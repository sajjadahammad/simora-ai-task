# Quick Start Guide

## Prerequisites
- Node.js 18+ installed

**Note for Windows users**: If installation fails with `better-sqlite3` errors, don't worry! The database is optional. Just set `USE_DATABASE=false` in your `.env` file and the app will work perfectly without it.

**Note**: FFmpeg is bundled with the application via `ffmpeg-static` package, so no separate installation is needed.

**Note**: This project uses **LangChain** for structured AI processing. The LangChain framework provides a clean pipeline for transcription and can be easily extended with additional processing steps.

## Setup Steps

### 1. Install Dependencies

**Option A: Install all at once**
```bash
npm run install:all
```

**Option B: Install separately**
```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 2. Configure Environment Variables

**Backend:**
Create `backend/.env`:
```env
PORT=5000
WHISPER_MODEL=Xenova/whisper-small
USE_DATABASE=false
NODE_ENV=development
```

**Note:** `WHISPER_MODEL` is optional. The model will be downloaded automatically on first use (~150MB for whisper-small).

**Frontend (optional):**
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

### 4. Use the Application

1. Open http://localhost:3000 in your browser
2. Click "Select MP4 Video" and choose a video file
3. Click "Upload Video"
4. Click "Auto-generate Captions" (or it will auto-generate after upload)
5. Select a caption style from the dropdown
6. Preview the video with captions
7. Edit captions if needed
8. Use the export command shown in the preview section

## Architecture

This project uses the **MCP (Model-Controller-Service) pattern**:

- **Models**: Data structures (`backend/models/`)
- **Controllers**: Handle HTTP requests (`backend/controllers/`)
- **Services**: Business logic (`backend/services/`)
- **Routes**: Define API endpoints (`backend/routes/`)

## Database (Optional)

To enable SQLite database for storing video metadata:

1. Set `USE_DATABASE=true` in `backend/.env`
2. The database will be automatically created at `backend/database.sqlite`
3. Video metadata and captions will be stored for retrieval

## Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Verify `.env` file exists with valid Hugging Face API key
- Run `npm install` in backend directory

### Frontend won't start
- Check if port 3000 is available
- Verify backend is running on port 5000
- Run `npm install` in frontend directory

### Caption generation fails
- Check browser console and backend logs for errors
- Ensure video file has audio track
- First run will download the model (~150MB) - be patient
- Check available disk space (models are cached in `node_modules/@xenova/transformers`)
- FFmpeg is bundled with the app, so no separate installation is needed

### Preview not working
- Check browser console for errors
- Verify CORS is enabled (it should be by default)
- Ensure video URL is accessible

## Next Steps

- See README.md for detailed documentation
- See backend/README.md for API documentation
- Deploy to Vercel/Render/Netlify (see README.md deployment section)
