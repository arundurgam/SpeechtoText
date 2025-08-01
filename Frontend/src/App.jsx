import { useState, useRef, useEffect } from "react";
import axios from "axios";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"; // ✅ updated

function App() {
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlaybackRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${backendURL}/api/history`);
      setHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    return () => {
      if (audioPlaybackRef.current?.src) {
        URL.revokeObjectURL(audioPlaybackRef.current.src);
      }
    };
  }, [audioBlob]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      alert("❌ Invalid file type. Please upload an audio file (mp3, wav, ogg, etc).");
      return;
    }

    setAudioBlob(file);
    setTranscription("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current.start();
      setTranscription("");
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Microphone access denied or error: " + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleTranscription = async () => {
    if (!audioBlob) {
      alert("Please record or upload an audio file first.");
      return;
    }

    setLoading(true);
    setTranscription("Transcribing audio, please wait...");

    const formData = new FormData();
    formData.append("audio", audioBlob);

    try {
      const response = await axios.post(`${backendURL}/api/transcribe`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (response.data.transcription) {
        setTranscription(response.data.transcription);
        fetchHistory();
      } else {
        setTranscription("❌ Failed to transcribe audio: No transcription data received.");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      if (error.response?.status === 500) {
        setTranscription("❌ Server error. Please try again later.");
      } else {
        const errorMessage = error.response?.data?.error || "An unexpected error occurred.";
        setTranscription(`❌ Error during transcription: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 p-6 sm:p-10 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-10 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-ping"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-bounce"></div>
      </div>

      <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-700 relative z-10">
        🎙️ Speech-to-Text App
      </h1>

      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Upload */}
        <div className="w-full max-w-md">
          <label className="block mb-2 text-lg font-semibold text-gray-700">Upload Audio File:</label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={startRecording}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
            disabled={loading}
          >
            Start Recording
          </button>
          <button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
            disabled={loading || !mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive"}
          >
            Stop Recording
          </button>
        </div>

        {/* Preview */}
        {audioBlob && (
          <div className="mt-4 w-full max-w-md bg-white p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Review Recorded/Uploaded Audio:</h2>
            <audio controls src={URL.createObjectURL(audioBlob)} ref={audioPlaybackRef} className="w-full" />
            {audioBlob instanceof File && (
              <p className="text-sm text-gray-600 mt-2">File: {audioBlob.name}</p>
            )}
          </div>
        )}

        {/* Transcribe */}
        <button
          onClick={handleTranscription}
          disabled={loading || !audioBlob}
          className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-8 py-3 rounded-lg shadow-lg mt-4 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Transcribing...
            </span>
          ) : (
            "Upload & Transcribe"
          )}
        </button>

        {/* Transcription Result */}
        <div className="mt-10 w-full max-w-xl p-6 bg-white border border-gray-200 rounded-lg shadow-xl transition-shadow duration-200">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">📝 Transcription Result</h2>
          <div
            className={`prose prose-sm sm:prose lg:prose-lg max-w-none ${
              transcription.startsWith("❌") ? "text-red-600" : "text-gray-800"
            }`}
          >
            {transcription || "No transcription yet. Record or upload an audio file and click 'Upload & Transcribe'."}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-12 w-full max-w-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              🕓 Transcription History
            </h2>
            <ul className="space-y-4">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition duration-200"
                >
                  <div className="text-sm text-gray-500 font-mono mb-1">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                  <p className="text-gray-800 font-medium leading-snug">
                    {item.transcription || "No transcription available."}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <audio controls src={item.file_url} className="w-3/4" />
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm ml-4"
                    >
                      View Audio
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
