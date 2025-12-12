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

    // Clean up uploaded video to save disk space (captions already extracted)
    try {
      await videoService.deleteVideo(filename);
      console.log('🧹 Cleaned up video after caption extraction:', filename);
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }

    // Force garbage collection if available (helps with memory on limited RAM)
    if (global.gc) {
      global.gc();
    }

    res.json({
      success: true,
      captions: captions,
      fullText: transcription.text
    });
  } catch (error) {
    console.error('Caption generation error:', error);
    
    // Create user-friendly error messages
    let errorMessage = 'Failed to generate captions. Please try again.';
    
    const errorMsg = error.message || '';
    
    if (errorMsg.includes('FFmpeg') || errorMsg.includes('audio extraction')) {
      errorMessage = 'Failed to process video audio. Please ensure the video file is valid.';
    } else if (errorMsg.includes('model') || errorMsg.includes('Whisper') || errorMsg.includes('Inference Provider')) {
      errorMessage = 'Transcription service is currently unavailable. Please try again later.';
    } else if (errorMsg.includes('memory') || errorMsg.includes('Memory')) {
      errorMessage = 'Video is too large to process. Please try a smaller video file.';
    } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
      errorMessage = 'Processing took too long. Please try a shorter video.';
    } else if (errorMsg.includes('HUGGINGFACE_API_KEY')) {
      errorMessage = 'Transcription service configuration error. Please contact support.';
    } else if (errorMsg.includes('not found') || errorMsg.includes('not exist')) {
      errorMessage = 'Video file not found. Please upload the video again.';
    }
    
    res.status(500).json({ 
      error: errorMessage
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

