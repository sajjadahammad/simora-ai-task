// Render Service - Burns captions into video using FFmpeg
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set FFmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// Convert seconds to SRT timestamp format (HH:MM:SS,mmm)
const formatSRTTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

// Generate SRT content from captions
const generateSRT = (captions) => {
  let srtContent = '';
  captions.forEach((caption, index) => {
    const startTime = formatSRTTime(caption.start);
    const endTime = formatSRTTime(caption.end);
    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${caption.text}\n\n`;
  });
  return srtContent;
};

// Get subtitle style based on caption style
const getSubtitleStyle = (captionStyle) => {
  // ASS/SSA style format for FFmpeg subtitles filter
  // Format: FontName,FontSize,PrimaryColor,SecondaryColor,OutlineColor,BackColor,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
  
  switch (captionStyle) {
    case 'top-bar':
      // Top position with background
      return {
        fontsize: 24,
        fontcolor: 'white',
        fontcolor_expr: '',
        borderw: 2,
        shadowcolor: 'black',
        shadowx: 2,
        shadowy: 2,
        box: 1,
        boxcolor: 'black@0.8',
        boxborderw: 10,
        y: 50,  // Position from top
      };
    case 'karaoke':
      // Yellow highlight style
      return {
        fontsize: 28,
        fontcolor: 'yellow',
        borderw: 3,
        bordercolor: 'black',
        shadowcolor: 'black',
        shadowx: 2,
        shadowy: 2,
        box: 1,
        boxcolor: 'black@0.6',
        boxborderw: 10,
        y: '(h-text_h-50)',  // Bottom position
      };
    case 'bottom-centered':
    default:
      // Standard bottom-centered subtitles
      return {
        fontsize: 24,
        fontcolor: 'white',
        borderw: 2,
        bordercolor: 'black',
        shadowcolor: 'black',
        shadowx: 2,
        shadowy: 2,
        box: 1,
        boxcolor: 'black@0.7',
        boxborderw: 8,
        y: '(h-text_h-60)',  // Bottom position
      };
  }
};

// Render video with burned-in captions using FFmpeg
export const renderWithCaptions = async (videoPath, captions, captionStyle) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, '../outputs');
    const tempDir = path.join(__dirname, '../temp');
    
    // Ensure directories exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const srtPath = path.join(tempDir, `captions_${timestamp}.srt`);
    const outputPath = path.join(outputDir, `captioned_${timestamp}.mp4`);

    // Generate and save SRT file
    const srtContent = generateSRT(captions);
    fs.writeFileSync(srtPath, srtContent, 'utf-8');
    console.log('Generated SRT file:', srtPath);

    // Get style settings
    const style = getSubtitleStyle(captionStyle);

    // Build the subtitles filter
    // Escape special characters in path for FFmpeg
    const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    
    // Use drawtext filter for more control, or subtitles filter
    const subtitlesFilter = `subtitles='${escapedSrtPath}':force_style='FontSize=${style.fontsize},PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=4,Outline=2,Shadow=1,MarginV=60'`;

    console.log('Starting FFmpeg render...');
    console.log('Input:', videoPath);
    console.log('Output:', outputPath);
    console.log('Filter:', subtitlesFilter);

    ffmpeg(videoPath)
      .videoFilters(subtitlesFilter)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart'
      ])
      .on('start', (cmd) => {
        console.log('FFmpeg command:', cmd);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log('Rendering progress:', Math.round(progress.percent) + '%');
        }
      })
      .on('end', () => {
        console.log('Render complete:', outputPath);
        // Clean up SRT file
        try {
          fs.unlinkSync(srtPath);
        } catch (e) {
          console.warn('Failed to cleanup SRT:', e);
        }
        resolve(outputPath);
      })
      .on('error', (err, stdout, stderr) => {
        console.error('FFmpeg error:', err);
        console.error('FFmpeg stderr:', stderr);
        // Clean up on error
        try {
          fs.unlinkSync(srtPath);
        } catch (e) {}
        reject(new Error(`Render failed: ${err.message}`));
      })
      .save(outputPath);
  });
};

// Cleanup rendered file
export const cleanup = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log('Cleaned up:', filePath);
  }
};

