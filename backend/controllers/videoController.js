// Video Controller - Handles HTTP requests for video operations
import * as videoService from '../services/videoService.js';
import * as whisperService from '../services/whisperService.js';
import * as renderService from '../services/renderService.js';
import { createDatabaseService } from '../services/databaseService.js';
import { createVideo, videoToJSON } from '../models/Video.js';

// Initialize database service only if enabled and available
let dbService = null;
if (process.env.USE_DATABASE === 'true') {
  try {
    dbService = createDatabaseService();
  } catch (error) {
    console.warn('Database service initialization failed:', error.message);
    console.warn('Continuing without database support.');
    dbService = null;
  }
}

export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const videoData = await videoService.saveVideo(req.file);
    
    // Save to database if enabled
    if (dbService) {
      videoData.id = await dbService.saveVideo(videoData);
    }

    const video = createVideo(videoData);

    res.json({
      success: true,
      video: videoToJSON(video)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const generateCaptions = async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    if (!videoService.videoExists(filename)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const videoPath = videoService.getVideoPath(filename);

    // Generate captions using Hugging Face Whisper
    const transcription = await whisperService.transcribe(videoPath, filename);
    
    // Group into sentences
    const captions = whisperService.groupWordsIntoSentences(transcription.chunks);

    // Save captions to database if enabled
    if (dbService) {
      await dbService.updateCaptions(filename, captions);
    }

    res.json({
      success: true,
      captions: captions,
      fullText: transcription.text
    });
  } catch (error) {
    console.error('Caption generation error:', error);
    
    // Determine error type for better frontend messaging
    let errorType = 'UNKNOWN_ERROR';
    let errorMessage = error.message || 'Failed to generate captions';
    
    if (errorMessage.includes('FFmpeg')) {
      errorType = 'FFMPEG_ERROR';
    } else if (errorMessage.includes('audio')) {
      errorType = 'AUDIO_ERROR';
    } else if (errorMessage.includes('model') || errorMessage.includes('Whisper')) {
      errorType = 'MODEL_ERROR';
    } else if (errorMessage.includes('memory') || errorMessage.includes('Memory')) {
      errorType = 'MEMORY_ERROR';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      errorType = 'TIMEOUT_ERROR';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      errorType: errorType,
      details: error.stack?.split('\n').slice(0, 3).join('\n') || null
    });
  }
};

export const getVideo = async (req, res) => {
  try {
    const { filename } = req.params;
    const videoPath = videoService.getVideoPath(filename);

    if (!videoService.videoExists(filename)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.sendFile(videoPath);
  } catch (error) {
    console.error('Video retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getVideoInfo = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!videoService.videoExists(filename)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    let videoData = null;
    if (dbService) {
      videoData = await dbService.getVideo(filename);
    }

    res.json({
      success: true,
      video: videoData
    });
  } catch (error) {
    console.error('Video info error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllVideos = async (req, res) => {
  try {
    if (!dbService) {
      return res.status(400).json({ 
        error: 'Database not enabled. Enable USE_DATABASE=true to use this endpoint.' 
      });
    }

    const videos = await dbService.getAllVideos();
    res.json({
      success: true,
      videos: videos
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Render video with burned-in captions
export const renderCaptionedVideo = async (req, res) => {
  try {
    const { filename, captions, captionStyle } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    if (!captions || captions.length === 0) {
      return res.status(400).json({ error: 'Captions are required' });
    }

    if (!videoService.videoExists(filename)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const videoPath = videoService.getVideoPath(filename);

    console.log('Starting video render with captions...');
    console.log('Video:', filename);
    console.log('Captions:', captions.length, 'segments');
    console.log('Style:', captionStyle);

    // Render video with captions
    const outputPath = await renderService.renderWithCaptions(
      videoPath, 
      captions, 
      captionStyle || 'bottom-centered'
    );

    // Send the rendered video file
    res.download(outputPath, `captioned_${filename}`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up the rendered file after download
      try {
        renderService.cleanup(outputPath);
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    });
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to render video',
    });
  }
};

