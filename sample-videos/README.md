# Sample Videos

This folder contains sample videos demonstrating the captioning platform.

## Sample Files

After running the application:

1. **input-sample.mp4** - Original input video
2. **output-sample.mp4** - Captioned output video

## How to Generate Sample Output

1. Start the application:
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. Open http://localhost:3000

3. Upload a video and generate captions

4. Export using Remotion CLI:
   ```bash
   cd frontend
   npx remotion render CaptionedVideo out/video.mp4 --props='{"videoUrl": "YOUR_VIDEO_URL", "captions": [...], "captionStyle": "bottom-centered"}'
   ```

## Notes

- Sample videos are not tracked in git due to file size
- Use your own MP4 files to test the platform
- Hinglish (Hindi + English) captions are fully supported

