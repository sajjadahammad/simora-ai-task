# Backend API

Express server for handling video uploads and caption generation.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

3. Start server:
```bash
npm start
# or for development
npm run dev
```

## API Endpoints

### POST /api/upload
Upload a video file (MP4).

**Request:**
- Form data with `video` field containing MP4 file

**Response:**
```json
{
  "success": true,
  "video": {
    "filename": "unique-filename.mp4",
    "originalName": "video.mp4",
    "path": "/path/to/uploaded/file",
    "size": 1234567,
    "mimetype": "video/mp4"
  }
}
```

### POST /api/generate-captions
Generate captions for an uploaded video using OpenAI Whisper.

**Request:**
```json
{
  "filename": "unique-filename.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "captions": [
    {
      "text": "Hello world",
      "start": 0.0,
      "end": 2.5
    }
  ],
  "fullText": "Hello world"
}
```

### GET /api/video/:filename
Retrieve an uploaded video file.

### GET /api/health
Health check endpoint.

