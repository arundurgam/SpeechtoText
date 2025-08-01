const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const transcribeRoute = require("./routes/transcribe");
const historyRoute = require("./routes/history");

const app = express();

// ✅ Enable CORS for frontend
app.use(
  cors({
    origin: ["http://localhost:5173", "https://your-frontend.vercel.app"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const PORT = process.env.PORT || 5000;

// ✅ Log for debug
console.log("Supabase URL:", SUPABASE_URL);
console.log("AssemblyAI Key starts with:", ASSEMBLYAI_API_KEY?.slice(0, 5));

// ✅ Routes
app.use("/api/transcribe", transcribeRoute);
app.use("/api/history", historyRoute);

// ✅ Serve frontend from /client (built React)
app.use(express.static(path.join(__dirname, "client")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
