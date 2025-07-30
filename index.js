const express = require("express");
const cors = require("cors");
require("dotenv").config();

const transcribeRoute = require("./routes/transcribe");
const historyRoute = require("./routes/history");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://your-frontend.vercel.app"], // Allow local + deployed frontend
    credentials: true,
  })
);

app.use(express.json());

// Use environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const PORT = process.env.PORT || 5000;

// Optionally log to verify
console.log("Supabase URL:", SUPABASE_URL);
console.log("AssemblyAI Key starts with:", ASSEMBLYAI_API_KEY?.slice(0, 5));

// Mount API routes
app.use("/api/transcribe", transcribeRoute);
app.use("/api/history", historyRoute);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
