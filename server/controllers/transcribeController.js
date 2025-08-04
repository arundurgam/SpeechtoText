const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
require("dotenv").config();

// Validate environment
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.ASSEMBLYAI_API_KEY) {
  throw new Error("Missing Supabase or AssemblyAI credentials in .env");
}

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = process.env.SUPABASE_BUCKET || "audio";

// POST /api/transcribe
exports.handleTranscription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded." });
    }

    const localFilePath = path.join(__dirname, "..", req.file.path);
    const fileBuffer = fs.readFileSync(localFilePath);
    const extension = path.extname(req.file.originalname);
    const filename = `${Date.now()}-${uuidv4()}${extension}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`uploads/${filename}`, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      return res.status(500).json({ error: "Failed to upload file to Supabase." });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`uploads/${filename}`);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      return res.status(500).json({ error: "Could not generate public URL." });
    }

    // Delete local file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    // ===== AssemblyAI Transcription Logic =====
    // Step 1: Upload to AssemblyAI
    const uploadResponse = await axios.post(
      "https://api.assemblyai.com/v2/upload",
      fileBuffer,
      {
        headers: {
          authorization: process.env.ASSEMBLYAI_API_KEY,
          "Transfer-Encoding": "chunked",
        },
      }
    );

    const uploadUrl = uploadResponse.data.upload_url;

    // Step 2: Start transcription
    const transcriptResponse = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      {
        audio_url: uploadUrl,
      },
      {
        headers: {
          authorization: process.env.ASSEMBLYAI_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const transcriptId = transcriptResponse.data.id;

    // Step 3: Poll for transcription result
    let transcriptionText = "";
    while (true) {
      const pollingResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            authorization: process.env.ASSEMBLYAI_API_KEY,
          },
        }
      );

      const status = pollingResponse.data.status;
      if (status === "completed") {
        transcriptionText = pollingResponse.data.text;
        break;
      } else if (status === "error") {
        console.error("Transcription failed:", pollingResponse.data.error);
        return res.status(500).json({ error: "AssemblyAI transcription failed." });
      }

      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3s before polling again
    }

    // Save to Supabase DB
    const { data: insertResult, error: dbError } = await supabase
      .from("transcriptions")
      .insert([{ transcription: transcriptionText, file_url: publicUrl }])
      .select()
      .single();

    if (dbError) {
      console.error("Insert error:", dbError.message);
      return res.status(500).json({ error: "Failed to store transcription in DB." });
    }

    // Send response
    res.status(200).json({
      message: "Audio uploaded and transcribed",
      transcription: insertResult.transcription,
      file_url: insertResult.file_url,
      id: insertResult.id,
      created_at: insertResult.created_at,
    });
  } catch (err) {
    console.error("Transcription error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
};

// GET /api/transcribe/history
exports.getTranscriptionHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("transcriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch history error:", error.message);
      return res.status(500).json({ error: "Failed to fetch history." });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
};
