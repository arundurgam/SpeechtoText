const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const transcribeRoutes = require("./routes/transcribe");
const PORT = process.env.PORT || 5000;

// Ensure 'uploads' directory exists
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// ✅ Correct CORS setup
app.use(cors({
  origin: "http://localhost:5173", // your frontend origin
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/transcribe", transcribeRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
