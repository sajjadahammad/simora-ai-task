import React, { useState, useEffect, useRef, useMemo } from 'react';
import { renderCaptionedVideo, exportCaptionsAsSRT, downloadBlob, downloadText } from '../services/videoService';

function VideoPreview({ videoUrl, captions, captionStyle, uploadedFilename }) {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const currentCaption = useMemo(() => {
    if (!captions || captions.length === 0) return null;
    return captions.find(
      (caption) => currentTime >= caption.start && currentTime <= caption.end
    );
  }, [captions, currentTime]);

  const karaokeProgress = useMemo(() => {
    if (!currentCaption) return 0;
    const captionDuration = currentCaption.end - currentCaption.start;
    if (captionDuration <= 0) return 0;
    return Math.min(1, Math.max(0, (currentTime - currentCaption.start) / captionDuration));
  }, [currentCaption, currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoUrl]);

  const getCaptionContainerStyle = () => {
    const base = {
      position: 'absolute',
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      zIndex: 10,
      pointerEvents: 'none',
      padding: '0 10px',
    };

    switch (captionStyle) {
      case 'top-bar':
        return { ...base, top: '10px' };
      default:
        return { ...base, bottom: '50px' };
    }
  };

  const getCaptionStyle = () => {
    const baseStyle = {
      fontFamily: "'Noto Sans', 'Noto Sans Devanagari', sans-serif",
      fontSize: 'clamp(12px, 2vw, 20px)',
      fontWeight: '600',
      color: '#ffffff',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
      textAlign: 'center',
      padding: '8px 16px',
      borderRadius: '12px',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      maxWidth: '95%',
      lineHeight: '1.4',
    };

    if (captionStyle === 'top-bar') {
      return {
        ...baseStyle,
        width: '95%',
        borderRadius: '0 0 12px 12px',
        borderTop: '3px solid #A78BFA',
      };
    }
    return baseStyle;
  };

  const renderCaption = () => {
    if (!currentCaption) return null;

    if (captionStyle === 'karaoke') {
      const words = currentCaption.text.split(' ');
      const highlightedIndex = Math.floor(karaokeProgress * words.length);

      return (
        <div style={getCaptionContainerStyle()}>
          <div style={getCaptionStyle()}>
            {words.map((word, index) => (
              <span
                key={index}
                style={{
                  color: index <= highlightedIndex ? '#FCD34D' : 'rgba(255, 255, 255, 0.5)',
                  textShadow: index <= highlightedIndex ? '0 0 8px rgba(252, 211, 77, 0.8), 2px 2px 4px rgba(0,0,0,0.9)' : '2px 2px 4px rgba(0,0,0,0.9)',
                  transition: 'color 0.15s ease',
                }}
              >
                {word}{' '}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div style={getCaptionContainerStyle()}>
        <div style={getCaptionStyle()}>
          {currentCaption.text}
        </div>
      </div>
    );
  };

  const handleDownloadCaptioned = async () => {
    if (!uploadedFilename || !captions || captions.length === 0) {
      alert('Please upload a video and generate captions first');
      return;
    }

    setIsRendering(true);
    setRenderProgress(0);

    try {
      const blob = await renderCaptionedVideo(
        uploadedFilename, 
        captions, 
        captionStyle,
        (progress) => setRenderProgress(progress)
      );

      downloadBlob(blob, `captioned_${uploadedFilename}`);
    } catch (error) {
      alert('Failed to render: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsRendering(false);
      setRenderProgress(0);
    }
  };

  const exportSRT = () => {
    if (!captions || captions.length === 0) return;
    const srtContent = exportCaptionsAsSRT(captions);
    downloadText(srtContent, 'captions.srt');
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-5 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="text-xl">👁️</span> Preview
      </h3>
      
      {!videoUrl ? (
        <div className="flex-1 flex items-center justify-center min-h-[200px] md:min-h-[300px] bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-dashed border-purple-200">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🎥</div>
            <p className="text-gray-500 text-sm">Upload a video to see preview</p>
          </div>
        </div>
      ) : (
        <>
          {/* Video Player with Captions */}
          <div className="relative bg-black rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            />
            {renderCaption()}
          </div>

          {/* Caption Status */}
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl text-sm">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
              <span>📝 {captions?.length || 0} captions</span>
              <span>⏱️ {currentTime.toFixed(1)}s / {duration.toFixed(1)}s</span>
            </div>
            {currentCaption && (
              <p className="mt-2 text-purple-600 font-medium truncate">
                💬 "{currentCaption.text}"
              </p>
            )}
          </div>

          {/* Download Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadCaptioned}
              disabled={isRendering || !captions || captions.length === 0 || !uploadedFilename}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRendering ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Rendering... {renderProgress}%
                </span>
              ) : (
                '⬇️ Download with Captions'
              )}
            </button>

            {isRendering && (
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-300"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = videoUrl;
                  a.download = 'video.mp4';
                  a.click();
                }}
                className="flex-1 py-2 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-all text-sm"
              >
                📹 Original
              </button>
              <button
                onClick={exportSRT}
                disabled={!captions || captions.length === 0}
                className="flex-1 py-2 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-all text-sm disabled:opacity-50"
              >
                📄 Export SRT
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default VideoPreview;
