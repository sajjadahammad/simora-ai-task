// Whisper Service - Handles caption generation using LangChain with Whisper model
// Uses utility function to switch between local and Hugging Face based on environment
import { DynamicStructuredTool } from '@langchain/core/tools';
import { RunnableSequence } from '@langchain/core/runnables';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { transcribeAudio, isProduction } from '../utils/whisperProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set FFmpeg path from ffmpeg-static package
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
  console.log('✅ Using bundled FFmpeg from ffmpeg-static package');
} else {
  console.warn('⚠️  ffmpeg-static not found, falling back to system FFmpeg');
}

// Extract audio from video using ffmpeg
// Output as WAV in production (for Hugging Face) or PCM in development (for local model)
const extractAudio = async (videoPath) => {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // In production, use WAV format for Hugging Face API
    // In development, use raw PCM for local model
    const useWav = isProduction();
    const audioPath = path.join(tempDir, `audio_${Date.now()}.${useWav ? 'wav' : 'pcm'}`);

    console.log('Extracting audio from:', videoPath);
    console.log('Output audio path:', audioPath);
    console.log('Format:', useWav ? 'WAV (for Hugging Face)' : 'PCM (for local model)');

    const ffmpegCommand = ffmpeg(videoPath)
      .audioFrequency(16000)  // 16kHz sample rate required by Whisper
      .audioChannels(1);  // Mono

    if (useWav) {
      // Output as WAV for Hugging Face API
      ffmpegCommand.toFormat('wav');
    } else {
      // Output as raw 16-bit PCM for local model
      ffmpegCommand.toFormat('s16le');
    }

    ffmpegCommand
      .on('start', (cmd) => {
        console.log('FFmpeg command:', cmd);
      })
      .on('end', () => {
        console.log('Audio extraction complete');
        // Verify file was created
        if (fs.existsSync(audioPath)) {
          const stats = fs.statSync(audioPath);
          console.log('Audio file size:', stats.size, 'bytes');
          if (stats.size === 0) {
            reject(new Error('Audio extraction produced empty file'));
            return;
          }
        }
        resolve(audioPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .save(audioPath);
  });
};

// Load raw PCM audio and convert to Float32Array for Whisper
const loadAudio = (audioPath) => {
  console.log('Loading audio from:', audioPath);
  
  // Read raw PCM file
  const buffer = fs.readFileSync(audioPath);
  console.log('Raw audio buffer size:', buffer.length, 'bytes');
  
  if (buffer.length === 0) {
    throw new Error('Audio file is empty');
  }
  
  // Convert 16-bit signed integers to Float32Array
  // PCM 16-bit has values from -32768 to 32767
  const samples = buffer.length / 2;  // 2 bytes per sample
  const audioData = new Float32Array(samples);
  
  for (let i = 0; i < samples; i++) {
    // Read 16-bit signed integer (little-endian)
    const sample = buffer.readInt16LE(i * 2);
    // Normalize to [-1, 1] range
    audioData[i] = sample / 32768.0;
  }
  
  console.log('Audio samples:', audioData.length);
  console.log('Audio duration:', (audioData.length / 16000).toFixed(2), 'seconds');
  
  // Check if audio has actual content (not all zeros)
  const maxAbs = Math.max(...Array.from(audioData).map(Math.abs).slice(0, 10000));
  console.log('Max audio amplitude (first 10k samples):', maxAbs);
  
  if (maxAbs < 0.001) {
    console.warn('Warning: Audio appears to be silent or very quiet');
  }
  
  return audioData;
};

// Create LangChain tool for Whisper transcription
const createWhisperTool = async () => {
  return new DynamicStructuredTool({
    name: 'whisper_transcribe',
    description: 'Transcribes audio file to text with timestamps using Whisper model',
    schema: z.object({
      audioPath: z.string().describe('Path to the audio file to transcribe'),
    }),
    func: async ({ audioPath }) => {
      try {
        console.log('Transcribing audio with LangChain tool...');
        console.log('Environment:', isProduction() ? 'Production (Hugging Face)' : 'Development (Local)');
        
        let output;
        
        if (isProduction()) {
          // In production, pass audio file path directly to Hugging Face
          console.log('Using Hugging Face API with audio file:', audioPath);
          output = await transcribeAudio(audioPath, {
            language: 'en',
          });
        } else {
          // In development, load audio and use local model
          const audioData = loadAudio(audioPath);
          console.log('Starting local Whisper transcription...');
          output = await transcribeAudio(audioData, {
            language: 'en',
          });
        }
        
        console.log('Transcription output:', JSON.stringify(output).substring(0, 500));
        
        return JSON.stringify(output);
      } catch (error) {
        console.error('Transcription error in tool:', error);
        throw new Error(`Transcription failed: ${error.message}`);
      }
    },
  });
};

// Format transcription output with timestamps
const formatTranscription = (output) => {
  // Handle both direct output and JSON string
  let parsedOutput = output;
  if (typeof output === 'string') {
    try {
      parsedOutput = JSON.parse(output);
    } catch (e) {
      // If not JSON, treat as plain text
      parsedOutput = { text: output };
    }
  }

  console.log('Formatting transcription:', JSON.stringify(parsedOutput).substring(0, 300));

  // Check for empty or whitespace-only text
  const text = (parsedOutput?.text || '').trim();
  if (!text) {
    console.warn('Warning: Transcription returned empty text');
    return {
      text: '',
      chunks: []
    };
  }

  if (parsedOutput.chunks && Array.isArray(parsedOutput.chunks) && parsedOutput.chunks.length > 0) {
    // Transform chunks to our format
    const chunks = parsedOutput.chunks.map(chunk => ({
      text: (chunk.text || '').trim(),
      start: chunk.timestamp?.[0] || 0,
      end: chunk.timestamp?.[1] || 0
    })).filter(chunk => chunk.text.length > 0);

    console.log('Formatted chunks:', chunks.length);

    return {
      text: text,
      chunks: chunks
    };
  }
  
  // Fallback: if no chunks, create from text
  console.log('No chunks found, estimating timestamps');
  return {
    text: text,
    chunks: estimateTimestamps(text)
  };
};

// Estimate timestamps when not provided
const estimateTimestamps = (text) => {
  if (!text || text.trim() === '') {
    return [];
  }
  
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) {
    return [];
  }
  
  const wordsPerSecond = 2.5;
  const chunks = [];
  
  let currentChunk = [];
  let chunkStart = 0;

  words.forEach((word, index) => {
    currentChunk.push(word);
    
    const hasPunctuation = /[.!?।]$/.test(word);
    const isLongEnough = currentChunk.length >= 5;
    const isLastWord = index === words.length - 1;

    if ((hasPunctuation || isLongEnough || isLastWord) && currentChunk.length > 0) {
      const chunkDuration = currentChunk.length / wordsPerSecond;
      chunks.push({
        text: currentChunk.join(' '),
        start: chunkStart,
        end: chunkStart + chunkDuration
      });
      chunkStart += chunkDuration;
      currentChunk = [];
    }
  });

  return chunks;
};

// Create LangChain chain for transcription pipeline
const createTranscriptionChain = async () => {
  const whisperTool = await createWhisperTool();

  // Create a chain that processes audio transcription
  const chain = RunnableSequence.from([
    // Step 1: Extract audio path from input
    async (input) => {
      return { audioPath: input.audioPath };
    },
    // Step 2: Run transcription tool
    async (input) => {
      const result = await whisperTool.invoke(input);
      return { transcription: result, audioPath: input.audioPath };
    },
    // Step 3: Format the output
    async (input) => {
      const formatted = formatTranscription(input.transcription);
      return formatted;
    }
  ]);

  return chain;
};

// Main transcription function using LangChain
export const transcribe = async (videoPath, filename) => {
  let audioPath = null;

  try {
    // Check if video file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    console.log('=== Starting transcription ===');
    console.log('Video path:', videoPath);
    console.log('Filename:', filename);

    // Extract audio from video
    console.log('Extracting audio from video...');
    audioPath = await extractAudio(videoPath);

    // Create and run LangChain transcription chain
    console.log('Creating LangChain transcription chain...');
    const chain = await createTranscriptionChain();
    
    console.log('Running transcription with LangChain...');
    const transcription = await chain.invoke({ audioPath });

    console.log('=== Transcription complete ===');
    console.log('Text length:', transcription.text?.length || 0);
    console.log('Chunks:', transcription.chunks?.length || 0);

    return transcription;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Failed to transcribe video: ${error.message}`);
  } finally {
    // Clean up temporary audio file
    if (audioPath && fs.existsSync(audioPath)) {
      try {
        fs.unlinkSync(audioPath);
        console.log('Cleaned up temp audio file');
      } catch (err) {
        console.warn('Failed to delete temporary audio file:', err);
      }
    }
  }
};

// Group chunks into readable sentences
export const groupWordsIntoSentences = (chunks) => {
  if (!chunks || chunks.length === 0) {
    console.log('No chunks to group into sentences');
    return [];
  }

  const sentences = [];
  let currentSentence = [];
  let currentStart = null;

  chunks.forEach((chunk, index) => {
    if (currentStart === null) {
      currentStart = chunk.start;
    }

    currentSentence.push(chunk.text);

    const hasPunctuation = /[.!?।]$/.test(chunk.text);
    const isLongEnough = currentSentence.length >= 2;
    const isLastChunk = index === chunks.length - 1;

    if ((hasPunctuation || isLongEnough || isLastChunk) && currentSentence.length > 0) {
      sentences.push({
        text: currentSentence.join(' '),
        start: currentStart,
        end: chunk.end
      });
      currentSentence = [];
      currentStart = null;
    }
  });

  console.log('Grouped into', sentences.length, 'sentences');
  return sentences;
};
