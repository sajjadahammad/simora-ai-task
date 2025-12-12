// Video Service - Handles video file operations
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
const tempDir = path.join(__dirname, '..', 'temp');
const outputsDir = path.join(__dirname, '..', 'outputs');

// Ensure directories exist
[uploadsDir, tempDir, outputsDir].forEach(dir => {
  fs.ensureDirSync(dir);
});

// Clean old files to prevent disk fill (files older than 10 minutes)
const MAX_FILE_AGE_MS = 10 * 60 * 1000; // 10 minutes

export const cleanupOldFiles = () => {
  const now = Date.now();
  let cleaned = 0;
  
  [uploadsDir, tempDir, outputsDir].forEach(dir => {
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        try {
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > MAX_FILE_AGE_MS) {
            fs.removeSync(filePath);
            cleaned++;
            console.log(`🧹 Cleaned up old file: ${file}`);
          }
        } catch (e) {
          // Ignore errors for individual files
        }
      });
    } catch (e) {
      // Ignore errors for directories
    }
  });
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} old files`);
  }
  
  return cleaned;
};

// Run cleanup on startup and every 5 minutes
cleanupOldFiles();
setInterval(cleanupOldFiles, 5 * 60 * 1000);

export const getVideoPath = (filename) => {
  return path.join(uploadsDir, filename);
};

export const videoExists = (filename) => {
  const videoPath = getVideoPath(filename);
  return fs.existsSync(videoPath);
};

export const saveVideo = async (file) => {
  const videoInfo = {
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype
  };

  return videoInfo;
};

export const deleteVideo = async (filename) => {
  const videoPath = getVideoPath(filename);
  if (fs.existsSync(videoPath)) {
    await fs.remove(videoPath);
    return true;
  }
  return false;
};

export const getVideoStream = (filename) => {
  const videoPath = getVideoPath(filename);
  if (!fs.existsSync(videoPath)) {
    throw new Error('Video file not found');
  }
  return fs.createReadStream(videoPath);
};

