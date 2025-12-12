# 🎬 Remotion Captioning Platform

A full-stack web application for auto-generating and rendering captions on videos using AI-powered speech-to-text with Hinglish (Hindi + English) support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18%2B-green.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

---

## 🚀 Live Demo

- **Frontend**: [Deploy to Vercel](https://vercel.com)
- **Backend**: [Deploy to Render](https://render.com)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture Overview](#-architecture-overview)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📤 **Video Upload** | Drag & drop or click to upload MP4 files |
| 🎙️ **Auto-Captioning** | AI-powered speech-to-text using Whisper |
| 🇮🇳 **Hinglish Support** | Mixed Hindi (Devanagari) + English rendering |
| 🎨 **3 Caption Styles** | Bottom-centered, Top-bar, Karaoke |
| 👁️ **Real-time Preview** | Live caption overlay on video |
| ✏️ **Caption Editor** | Edit text and timestamps |
| 📥 **Video Export** | Download video with burned-in captions |
| 📄 **SRT Export** | Export captions as subtitle file |
| 🔒 **100% Local** | No external API keys required |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │  VideoUpload │   │ VideoPreview │   │CaptionEditor │   │   App.jsx    │  │
│  │  Component   │   │  Component   │   │  Component   │   │ (State Mgmt) │  │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────────────┘  │
│         │                  │                  │                              │
│  ┌──────▼──────────────────▼──────────────────▼──────┐                       │
│  │              React Query Hooks                     │                      │
│  │   useVideoUpload.js  │  useCaptionGeneration.js   │                       │
│  └──────────────────────┬────────────────────────────┘                       │
│                         │                                                     │
│  ┌──────────────────────▼────────────────────────────┐                       │
│  │              Services Layer (videoService.js)      │                      │
│  │  uploadVideo │ generateCaptions │ renderVideo     │                       │
│  └──────────────────────┬────────────────────────────┘                       │
│                         │                                                     │
│  ┌──────────────────────▼────────────────────────────┐                       │
│  │              API Client (lib/api.js)               │                      │
│  │                     Axios                          │                      │
│  └──────────────────────┬────────────────────────────┘                       │
│                         │                                                     │
└─────────────────────────┼───────────────────────────────────────────────────┘
                          │ HTTP (REST API)
┌─────────────────────────▼───────────────────────────────────────────────────┐
│                              SERVER (Node.js)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Express.js Routes                              │   │
│  │  /api/video/upload │ /api/video/generate-captions │ /api/video/render│   │
│  └────────────────────────────────┬─────────────────────────────────────┘   │
│                                   │                                          │
│  ┌────────────────────────────────▼─────────────────────────────────────┐   │
│  │                           Controllers                                 │   │
│  │                      videoController.js                               │   │
│  └────────────────────────────────┬─────────────────────────────────────┘   │
│                                   │                                          │
│  ┌────────────────────────────────▼─────────────────────────────────────┐   │
│  │                            Services                                   │   │
│  ├──────────────────┬───────────────────┬───────────────────────────────┤   │
│  │  videoService.js │ whisperService.js │      renderService.js         │   │
│  │  (File I/O)      │ (AI Transcription)│      (FFmpeg Rendering)       │   │
│  └──────────────────┴─────────┬─────────┴───────────────────────────────┘   │
│                               │                                              │
│  ┌────────────────────────────▼─────────────────────────────────────────┐   │
│  │                     External Dependencies                             │   │
│  │  @xenova/transformers │ LangChain │ fluent-ffmpeg │ ffmpeg-static    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 How It Works

### Complete Flow Diagram

```
User Action                    Frontend                         Backend
───────────────────────────────────────────────────────────────────────────────

1. UPLOAD VIDEO
   ───────────
   [Select File] ──────► VideoUpload.jsx ────► POST /api/video/upload
                              │                         │
                              │                         ▼
                              │                 videoController.uploadVideo()
                              │                         │
                              │                         ▼
                              │                 videoService.saveVideo()
                              │                         │
                              ◄─────────────────────────┘
                         { filename, url }

2. GENERATE CAPTIONS
   ──────────────────
   [Click Button] ────► useCaptionGeneration ──► POST /api/video/generate-captions
                              │                         │
                              │                         ▼
                              │                 videoController.generateCaptions()
                              │                         │
                              │                         ▼
                              │                 whisperService.transcribe()
                              │                         │
                              │         ┌───────────────┴───────────────┐
                              │         │                               │
                              │         ▼                               ▼
                              │   extractAudio()                  loadAudio()
                              │   (FFmpeg: video→PCM)             (Buffer→Float32)
                              │         │                               │
                              │         └───────────────┬───────────────┘
                              │                         │
                              │                         ▼
                              │                 LangChain Pipeline
                              │                 ┌─────────────────┐
                              │                 │ WhisperTool     │
                              │                 │ (transcribe)    │
                              │                 └────────┬────────┘
                              │                          │
                              │                          ▼
                              │                 formatTranscription()
                              │                          │
                              │                          ▼
                              │                 groupWordsIntoSentences()
                              │                          │
                              ◄──────────────────────────┘
                         { captions: [{text, start, end}] }

3. PREVIEW WITH CAPTIONS
   ──────────────────────
                        VideoPreview.jsx
                              │
                              ▼
                   ┌────────────────────┐
                   │  <video> element   │
                   │  + Caption Overlay │
                   │  (synced to time)  │
                   └────────────────────┘

4. EXPORT VIDEO
   ─────────────
   [Download] ────────► renderCaptionedVideo() ──► POST /api/video/render
                              │                         │
                              │                         ▼
                              │                 renderService.renderWithCaptions()
                              │                         │
                              │         ┌───────────────┴───────────────┐
                              │         │                               │
                              │         ▼                               ▼
                              │   generateSRT()                   FFmpeg Process
                              │   (captions→.srt)                 ┌───────────────┐
                              │         │                         │ Input: video  │
                              │         │                         │ Filter: subs  │
                              │         │                         │ Output: MP4   │
                              │         │                         └───────┬───────┘
                              │         └───────────────────────────────────┘
                              │                         │
                              ◄─────────────────────────┘
                         Blob (captioned MP4 file)
```

---

### Background Process Details

#### 1️⃣ Audio Extraction (`whisperService.js`)

When caption generation is triggered:

```javascript
// FFmpeg extracts audio from video as raw PCM
ffmpeg(videoPath)
  .toFormat('s16le')      // 16-bit signed little-endian PCM
  .audioFrequency(16000)  // 16kHz (Whisper requirement)
  .audioChannels(1)       // Mono audio
  .save(audioPath);
```

**Why PCM?** The Whisper model needs raw audio samples, not encoded audio. PCM provides direct sample values.

#### 2️⃣ Audio Processing for AI

```javascript
// Convert PCM bytes to Float32Array for Whisper
const buffer = fs.readFileSync(audioPath);
const samples = buffer.length / 2;  // 2 bytes per 16-bit sample
const audioData = new Float32Array(samples);

for (let i = 0; i < samples; i++) {
  const sample = buffer.readInt16LE(i * 2);
  audioData[i] = sample / 32768.0;  // Normalize to [-1, 1]
}
```

**Why Float32?** Neural networks expect normalized floating-point values between -1 and 1.

#### 3️⃣ LangChain Transcription Pipeline

```
Input (audioPath)
       │
       ▼
┌─────────────────────────────┐
│ RunnableSequence            │
│                             │
│ Step 1: Load audio data     │
│         └──► Float32Array   │
│                             │
│ Step 2: WhisperTool         │
│         └──► Raw transcript │
│              with timestamps│
│                             │
│ Step 3: Format & group      │
│         └──► Caption array  │
└─────────────────────────────┘
       │
       ▼
Output: { text, chunks: [{text, start, end}] }
```

#### 4️⃣ Caption Rendering (`renderService.js`)

```javascript
// Generate SRT subtitles
const srtContent = captions.map((c, i) => 
  `${i+1}\n${formatTime(c.start)} --> ${formatTime(c.end)}\n${c.text}\n`
).join('\n');

// Burn subtitles into video using FFmpeg
ffmpeg(videoPath)
  .videoFilters(`subtitles='${srtPath}'`)
  .outputOptions(['-c:v libx264', '-preset fast', '-crf 23'])
  .save(outputPath);
```

---

## 🛠️ Tech Stack

### Backend

| Package | Purpose |
|---------|---------|
| `express` | HTTP server framework |
| `@xenova/transformers` | Local Whisper AI model |
| `@langchain/core` | AI processing pipeline |
| `fluent-ffmpeg` | Audio/video processing |
| `ffmpeg-static` | Bundled FFmpeg binary |
| `multer` | File upload handling |

### Frontend

| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `vite` | Build tool |
| `tailwindcss` | Styling |
| `@tanstack/react-query` | Server state management |
| `axios` | HTTP client |
| `remotion` | Video composition |

---

## 📁 Project Structure

```
simora_ai/
├── backend/
│   ├── server.js                 # Express app entry point
│   ├── nodemon.json              # Dev server config
│   ├── package.json
│   │
│   ├── controllers/
│   │   ├── videoController.js    # Request handlers
│   │   └── healthController.js   # Health check
│   │
│   ├── services/
│   │   ├── videoService.js       # File operations
│   │   ├── whisperService.js     # AI transcription
│   │   ├── renderService.js      # FFmpeg rendering
│   │   └── databaseService.js    # Optional SQLite
│   │
│   ├── routes/
│   │   ├── videoRoutes.js        # /api/video/*
│   │   └── healthRoutes.js       # /api/health
│   │
│   ├── models/
│   │   └── Video.js              # Video data model
│   │
│   ├── uploads/                  # Uploaded videos
│   ├── temp/                     # Temporary audio files
│   └── outputs/                  # Rendered videos
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx              # React entry point
│   │   ├── App.jsx               # Main component
│   │   ├── index.css             # Tailwind + global styles
│   │   │
│   │   ├── components/
│   │   │   ├── VideoUpload.jsx   # Upload UI
│   │   │   ├── VideoPreview.jsx  # Preview + download
│   │   │   └── CaptionEditor.jsx # Edit captions
│   │   │
│   │   ├── services/
│   │   │   ├── index.js          # Service exports
│   │   │   └── videoService.js   # API calls
│   │   │
│   │   ├── hooks/
│   │   │   ├── useVideoUpload.js
│   │   │   └── useCaptionGeneration.js
│   │   │
│   │   ├── lib/
│   │   │   └── api.js            # Axios instance
│   │   │
│   │   └── remotion/
│   │       ├── CaptionedVideo.jsx
│   │       ├── Root.jsx
│   │       └── index.ts
│   │
│   ├── vite.config.mjs
│   └── package.json
│
├── sample-videos/                # Example videos
├── vercel.json                   # Vercel config
├── render.yaml                   # Render config
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- **Node.js 18+** (check with `node -v`)
- **npm** or **yarn**

No FFmpeg installation needed - it's bundled!

### Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd simora_ai

# Install all dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Environment Setup

**Backend** (`backend/.env`):
```env
PORT=5000
WHISPER_MODEL=Xenova/whisper-small
USE_DATABASE=false
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
```

### Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev    # Uses nodemon for auto-reload

# Terminal 2 - Frontend  
cd frontend
npm run dev    # Vite dev server
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 📖 Usage Guide

### Step 1: Upload Video
- Click the upload area or drag & drop an MP4 file
- Wait for upload to complete

### Step 2: Generate Captions
- Click **"Generate Captions"** button
- First run downloads Whisper model (~150MB) - cached for future use
- Wait for AI processing (30s-2min depending on video length)

### Step 3: Preview
- Captions appear overlaid on video preview
- Select caption style from dropdown

### Step 4: Edit (Optional)
- Modify caption text directly
- Adjust start/end timestamps

### Step 5: Export
| Option | Description |
|--------|-------------|
| **Download with Captions** | MP4 with burned-in subtitles |
| **Download Original** | Original video without captions |
| **Export SRT** | Subtitle file for external players |

---

## 📡 API Reference

### Health Check
```
GET /api/health
```
Response: `{ status: "ok", whisper: true, database: false, ffmpeg: true }`

### Upload Video
```
POST /api/video/upload
Content-Type: multipart/form-data

Body: video (file)
```
Response:
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

### Generate Captions
```
POST /api/video/generate-captions
Content-Type: application/json

Body: { "filename": "1702400000000-video.mp4" }
```
Response:
```json
{
  "success": true,
  "captions": [
    { "text": "Hello world", "start": 0.0, "end": 1.5 },
    { "text": "This is a test", "start": 1.5, "end": 3.2 }
  ],
  "fullText": "Hello world. This is a test."
}
```

### Render Captioned Video
```
POST /api/video/render
Content-Type: application/json

Body: {
  "filename": "1702400000000-video.mp4",
  "captions": [...],
  "captionStyle": "bottom-centered"
}
```
Response: MP4 file (binary blob)

### Get Video File
```
GET /api/video/:filename
```
Response: Video file stream

---

## 🌐 Deployment

### Render (Backend)

1. Create **Web Service**
2. Connect GitHub repo
3. Settings:
   - Build: `cd backend && npm install`
   - Start: `cd backend && npm start`
4. Environment:
   ```
   PORT=10000
   WHISPER_MODEL=Xenova/whisper-small
   NODE_ENV=production
   ```

### Vercel (Frontend)

1. Import project
2. Settings:
   - Framework: Vite
   - Root: `frontend`
3. Environment:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```

---

## 🎛️ Configuration

### Whisper Models

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| `Xenova/whisper-tiny` | ~40MB | Fastest | Lower |
| `Xenova/whisper-small` | ~150MB | Balanced | Good |
| `Xenova/whisper-medium` | ~500MB | Slow | Better |
| `Xenova/whisper-large-v3` | ~1.5GB | Slowest | Best |

Set in `backend/.env`:
```env
WHISPER_MODEL=Xenova/whisper-small
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Slow first caption generation | Model downloads on first use (~150MB), cached after |
| Empty captions | Check video has audio, try increasing volume |
| Video not loading | Verify backend is running, check CORS |
| Render fails | Check FFmpeg logs in terminal |

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

**Built for the Remotion Captioning Platform Developer Task** 🎬
