// Main Server File - Entry point for Express application
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ffmpegStatic from 'ffmpeg-static';
import videoRoutes from './routes/videoRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://simora-ai-task.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/video', videoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${process.cwd()}/backend/uploads`);
  console.log(`🤖 Whisper Model: ${process.env.WHISPER_MODEL || 'Xenova/whisper-small'}`);
  console.log(`💾 Database: ${process.env.USE_DATABASE === 'true' ? 'Enabled' : 'Disabled'}`);
  
  // Check FFmpeg availability
  if (ffmpegStatic) {
    console.log(`✅ FFmpeg: Using bundled version from ffmpeg-static package`);
  } else {
    console.log(`⚠️  FFmpeg: Using system FFmpeg (if available)`);
  }
});
