// Whisper Provider Utility - Switches between local and AssemblyAI based on environment
import { pipeline } from "@xenova/transformers";
import { AssemblyAI } from "assemblyai";
import fs from "fs";

// Check if we're in production
console.log("NODE_ENV:", process.env.ENVIRON);
export const isProduction = () => {
  return process.env.NODE_ENV === "production";
};

// Get model name for local use (development)
export const getLocalModelName = () => {
  return process.env.WHISPER_MODEL || "Xenova/whisper-small";
};

// Get model name (backward compatibility)
export const getModelName = () => {
  return getLocalModelName();
};

// Get AssemblyAI API key from environment
export const getAssemblyApiKey = () => {
  return process.env.ASSEMBLY_API_KEY;
};

// Initialize local transcriber (for development)
let localTranscriber = null;

const getLocalTranscriber = async () => {
  if (!localTranscriber) {
    const modelName = getLocalModelName();
    console.log("Loading local Whisper model:", modelName);
    localTranscriber = await pipeline(
      "automatic-speech-recognition",
      modelName,
      {
        chunk_length_s: 30,
        stride_length_s: 5,
      }
    );
    console.log("Local Whisper model loaded successfully");
  }
  return localTranscriber;
};

// Initialize AssemblyAI client (for production)
let assemblyClient = null;

const getAssemblyClient = () => {
  if (!assemblyClient) {
    const apiKey = getAssemblyApiKey();
    console.log("AssemblyAI API key:", apiKey ? "Found" : "Missing");
    if (!apiKey) {
      throw new Error("ASSEMBLY_API_KEY is required in production environment");
    }
    assemblyClient = new AssemblyAI({ apiKey });
    console.log("AssemblyAI client initialized");
  }
  return assemblyClient;
};

// Transcribe using local model (Float32Array input)
const transcribeLocal = async (audioData, options = {}) => {
  const transcriber = await getLocalTranscriber();
  return await transcriber(audioData, {
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
    language: options.language || "en",
  });
};

// Transcribe using AssemblyAI API (accepts audio file path)
const transcribeAssemblyAI = async (audioPathOrData, options = {}) => {
  const client = getAssemblyClient();

  console.log("Transcribing with AssemblyAI...");

  let audioInput;

  // If it's a file path, use it directly
  if (typeof audioPathOrData === "string" && fs.existsSync(audioPathOrData)) {
    audioInput = audioPathOrData;
  } else {
    throw new Error("AssemblyAI requires a file path for audio input");
  }

  try {
    const params = {
      audio: audioInput,
      speech_model: "universal",
    };

    // Add language if specified
    if (options.language && options.language !== "en") {
      params.language_code = options.language;
    }

    const transcript = await client.transcripts.transcribe(params);

    console.log("AssemblyAI transcription complete");

    // Format response to match expected structure
    return {
      text: transcript.text,
      chunks:
        transcript.words?.map((word) => ({
          text: word.text,
          timestamp: [word.start / 1000, word.end / 1000], // Convert ms to seconds
        })) || [],
    };
  } catch (error) {
    console.error("AssemblyAI API error:", error);
    // Sanitize error message - don't expose technical details
    const errorMsg = error.message || "Unknown error";
    if (errorMsg.includes("API key") || errorMsg.includes("Unauthorized")) {
      throw new Error("Authentication failed");
    } else if (errorMsg.includes("Invalid")) {
      throw new Error("Invalid audio file");
    } else {
      throw new Error("Transcription service error: " + errorMsg);
    }
  }
};

// Main transcription function that switches based on environment
// Accepts either Float32Array (for local) or audio path/file (for AssemblyAI)
export const transcribeAudio = async (audioData, options = {}) => {
  if (isProduction()) {
    console.log("isProduction:", isProduction());
    console.log("Using AssemblyAI for transcription (production)");
    return await transcribeAssemblyAI(audioData, options);
  } else {
    console.log("Using local Whisper model for transcription (development)");
    return await transcribeLocal(audioData, options);
  }
};
