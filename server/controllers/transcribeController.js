const fs = require("fs");
const path = require("path");
const supabase = require("../supabaseClient");
const axios = require("axios");

// 📌 Controller to handle transcription
exports.handleTranscription = async (req, res) => {
  try {
    const file = req.file;
    console.log("trans")
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // ✅ Read file from disk
    const filePath = path.join(__dirname, "..", file.path);
    const fileBuffer = fs.readFileSync(filePath);

    // ✅ Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("audio-files")
      .upload(`recordings/${Date.now()}-${file.originalname}`, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("Supabase Upload Error:", error);
      return res.status(500).json({ error: "Upload to Supabase failed" });
    }

    // ✅ Get public URL
    const publicUrlResponse = supabase.storage
      .from("audio-files")
      .getPublicUrl(data.path);

    const audioUrl = publicUrlResponse.data.publicUrl;
    console.log("Uploaded audio URL:", audioUrl);

    // ✅ Request transcription from AssemblyAI
    const transcriptReq = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      { audio_url: audioUrl },
      {
        headers: {
          authorization: process.env.ASSEMBLYAI_API_KEY,
          "content-type": "application/json",
        },
      }
    );

    const transcriptId = transcriptReq.data.id;

    // ✅ Polling AssemblyAI for result
    let transcriptionResult;
    while (true) {
      const polling = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            authorization: process.env.ASSEMBLYAI_API_KEY,
          },
        }
      );

      if (polling.data.status === "completed") {
        transcriptionResult = polling.data.text;

        // ✅ Save result to Supabase DB
        await supabase.from("transcriptions").insert([
          {
            file_url: audioUrl,
            transcription: transcriptionResult,
          },
        ]);

        break;
      } else if (polling.data.status === "error") {
        throw new Error("Transcription failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 3000)); // wait 3s
    }

    // ✅ Return transcription to frontend
    return res.json({
      transcription: transcriptionResult,
      url: audioUrl,
    });
  } catch (error) {
    console.error("Transcription Error:", error);
    res.status(500).json({ error: "Internal Server Error -tras" });
  }
};

// 📌 Controller to fetch transcription history
exports.getTranscriptionHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("transcriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch history error:", error);
      return res.status(500).json({ error: "Failed to fetch history" });
    }

    res.json(data);
  } catch (error) {
    console.error("History fetch exception:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
  