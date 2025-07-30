const express = require("express");
const router = express.Router();
const multer = require("multer");
const transcribeController = require("../controllers/transcribeController");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
console.log("trans")

// ✅ POST /api/transcribe
router.post("/", upload.single("audio"), transcribeController.handleTranscription);

// ✅ GET /api/history
router.get("/history", transcribeController.getTranscriptionHistory);

module.exports = router;
