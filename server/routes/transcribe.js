const express = require("express");
const multer = require("multer");
const { handleTranscription, getTranscriptionHistory } = require("../controllers/transcribeController");

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Routes
router.post("/", upload.single("audio"), handleTranscription);
router.get("/history", getTranscriptionHistory);

module.exports = router;
