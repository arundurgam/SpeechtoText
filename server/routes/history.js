const express = require("express");
const router = express.Router();

// ✅ Import the controller from its correct location
const { getTranscriptionHistory } = require("../controllers/transcribeController");

// ✅ Route: GET /api/history → Fetch transcription history
router.get("/", getTranscriptionHistory);

module.exports = router;
