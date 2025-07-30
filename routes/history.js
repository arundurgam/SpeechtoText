const express = require("express");
const router = express.Router();
const { getTranscriptionHistory } = require("../controllers/transcribeController");

// Route: GET /api/history → Calls the controller to fetch history
router.get("/", getTranscriptionHistory);

module.exports = router;
