const express = require("express");
const router = express.Router();
const multer = require("multer");
const transcribeController = require("../controllers/transcribeController");

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

console.log("trans")

// ✅ Route 1: POST /api/transcribe
router.post("/", upload.single("audio"), transcribeController.handleTranscription);

// ✅ Route 2: GET /api/transcribe/history
router.get("/history", transcribeController.getTranscriptionHistory);

module.exports = router;
