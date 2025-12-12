// Video Service - API calls for video operations
import api from '../lib/api';

/**
 * Upload a video file with progress tracking
 */
export const uploadVideo = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('video', file);

  const response = await api.post('/api/video/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

/**
 * Generate captions for an uploaded video
 */
export const generateCaptions = async (filename) => {
  const response = await api.post('/api/video/generate-captions', {
    filename,
  });
  return response.data;
};

/**
 * Get video information
 */
export const getVideoInfo = async (filename) => {
  const response = await api.get(`/api/video/${filename}/info`);
  return response.data;
};

/**
 * Get video file URL
 */
export const getVideoUrl = (filename) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}/api/video/${filename}`;
};

/**
 * Render video with burned-in captions
 * Returns a blob for download
 */
export const renderCaptionedVideo = async (filename, captions, captionStyle, onProgress) => {
  const response = await api.post('/api/video/render', {
    filename,
    captions,
    captionStyle
  }, {
    responseType: 'blob',
    onDownloadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });
  return response.data;
};

/**
 * Export captions as SRT file content
 */
export const exportCaptionsAsSRT = (captions) => {
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  let srtContent = '';
  captions.forEach((caption, index) => {
    srtContent += `${index + 1}\n`;
    srtContent += `${formatTime(caption.start)} --> ${formatTime(caption.end)}\n`;
    srtContent += `${caption.text}\n\n`;
  });

  return srtContent;
};

/**
 * Download a blob as a file
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Download text content as a file
 */
export const downloadText = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
};

