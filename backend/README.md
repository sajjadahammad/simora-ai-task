# Backend API

Express server for handling video uploads and caption generation using local Whisper AI.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
PORT=5000
WHISPER_MODEL=Xenova/whisper-small
USE_DATABASE=false
NODE_ENV=development
```

**No API keys needed!** The Whisper model runs locally via `@xenova/transformers`.

3. Start server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

## API Endpoints

### POST /api/video/upload
Upload a video file (MP4).

**Request:**
- Form data with `video` field containing MP4 file

**Response:**
```json
{
  "success": true,
  "video": {
    "filename": "1702400000000-video.mp4",
    "originalName": "video.mp4",
    "url": "/api/video/1702400000000-video.mp4"
  }
}
```

### POST /api/video/generate-captions
Generate captions using local Whisper AI.

**Request:**
```json
{
  "filename": "1702400000000-video.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "captions": [
    { "text": "Hello world", "start": 0.0, "end": 2.5 }
  ],
  "fullText": "Hello world"
}
```

### POST /api/video/render
Render video with burned-in captions.

**Request:**
```json
{
  "filename": "1702400000000-video.mp4",
  "captions": [...],
  "captionStyle": "bottom-centered"
}
```

**Response:** MP4 file download

### GET /api/video/:filename
Retrieve an uploaded video file.

### GET /api/health
Health check endpoint.

## Tech Stack

- **@xenova/transformers** - Local Whisper model (no API key)
- **LangChain** - AI pipeline orchestration
- **fluent-ffmpeg** - Audio/video processing
- **ffmpeg-static** - Bundled FFmpeg binary
