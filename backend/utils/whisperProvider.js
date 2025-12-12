// Whisper Provider Utility - Switches between local and Hugging Face based on environment
import { pipeline } from '@xenova/transformers';
import { InferenceClient } from '@huggingface/inference';
import fs from 'fs';

// Check if we're in production
export const isProduction = () => {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
};

// Get model name for local use (development)
export const getLocalModelName = () => {
  return process.env.WHISPER_MODEL || 'Xenova/whisper-small';
};

// Get model name for Hugging Face API (production)
export const getHfModelName = () => {
  return process.env.WHISPER_MODEL || 'openai/whisper-base';
};

// Get model name (backward compatibility)
export const getModelName = () => {
  if (isProduction()) {
    return getHfModelName();
  }
  return getLocalModelName();
};

// Get Hugging Face API token from environment
export const getHfToken = () => {
  return process.env.HUGGINGFACE_API_KEY;
};

// Initialize local transcriber (for development)
let localTranscriber = null;

const getLocalTranscriber = async () => {
  if (!localTranscriber) {
    const modelName = getLocalModelName();
    console.log('Loading local Whisper model:', modelName);
    localTranscriber = await pipeline(
      'automatic-speech-recognition',
      modelName,
      {
        chunk_length_s: 30,
        stride_length_s: 5,
      }
    );
    console.log('Local Whisper model loaded successfully');
  }
  return localTranscriber;
};

// Initialize Hugging Face client (for production)
let hfClient = null;

const getHfClient = () => {
  if (!hfClient) {
    const token = getHfToken();
    if (!token) {
      throw new Error('HUGGINGFACE_API_KEY is required in production environment');
    }
    hfClient = new InferenceClient(token);
    console.log('Hugging Face client initialized');
  }
  return hfClient;
};

// Transcribe using local model (Float32Array input)
const transcribeLocal = async (audioData, options = {}) => {
  const transcriber = await getLocalTranscriber();
  return await transcriber(audioData, {
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
    language: options.language || 'en',
  });
};

// Transcribe using Hugging Face API (accepts audio file path or audio data)
const transcribeHuggingFace = async (audioPathOrData, options = {}) => {
  const client = getHfClient();
  const model = getHfModelName();
  
  console.log('Transcribing with Hugging Face API:', model);
  
  let audioInput;
  
  // If it's a file path, read the file
  if (typeof audioPathOrData === 'string' && fs.existsSync(audioPathOrData)) {
    audioInput = fs.readFileSync(audioPathOrData);
  } else if (audioPathOrData instanceof Float32Array || audioPathOrData instanceof ArrayBuffer) {
    // Convert Float32Array to Buffer
    const buffer = audioPathOrData instanceof Float32Array 
      ? Buffer.from(audioPathOrData.buffer)
      : Buffer.from(audioPathOrData);
    audioInput = buffer;
  } else {
    audioInput = audioPathOrData;
  }
  
  try {
    // Hugging Face API expects audio file (Buffer or Blob)
    const response = await client.automaticSpeechRecognition({
      model: model,
      inputs: audioInput,
      parameters: {
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
        language: options.language || 'en',
      },
    });
    
    return response;
  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw new Error(`Hugging Face transcription failed: ${error.message}`);
  }
};

// Main transcription function that switches based on environment
// Accepts either Float32Array (for local) or audio path/file (for HF)
export const transcribeAudio = async (audioData, options = {}) => {
  if (isProduction()) {
    console.log('Using Hugging Face API for transcription (production)');
    return await transcribeHuggingFace(audioData, options);
  } else {
    console.log('Using local Whisper model for transcription (development)');
    return await transcribeLocal(audioData, options);
  }
};

