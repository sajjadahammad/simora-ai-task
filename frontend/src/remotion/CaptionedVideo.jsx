import React, { useRef, useEffect } from 'react';
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
  Easing,
  OffthreadVideo,
  Sequence
} from 'remotion';

export const CaptionedVideo = ({ videoUrl, captions = [], captionStyle = 'bottom-centered' }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = frame / fps;

  // Find current caption(s) based on time
  const currentCaptions = captions.filter(
    (caption) => currentTime >= caption.start && currentTime <= caption.end
  );

  const renderCaption = (caption, index) => {
    const captionStart = caption.start;
    const captionEnd = caption.end;
    const captionDuration = captionEnd - captionStart;

    // Calculate progress within this caption (0 to 1)
    const progress = Math.max(
      0,
      Math.min(1, (currentTime - captionStart) / captionDuration)
    );

    // For karaoke style, split words and highlight them
    if (captionStyle === 'karaoke') {
      return renderKaraokeCaption(caption, progress, index);
    }

    // Fade in/out animation
    const opacity = interpolate(
      progress,
      [0, 0.1, 0.9, 1],
      [0, 1, 1, 0],
      {
        easing: Easing.ease,
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      }
    );

    const style = getCaptionStyle(captionStyle, opacity);

    return (
      <div 
        key={index} 
        style={{
          ...style,
          fontFamily: "'Noto Sans', 'Noto Sans Devanagari', sans-serif",
          direction: 'ltr',
          unicodeBidi: 'embed'
        }}
      >
        {caption.text}
      </div>
    );
  };

  const renderKaraokeCaption = (caption, progress, index) => {
    const words = caption.text.split(' ');
    const highlightedIndex = Math.floor(progress * words.length);

    return (
      <div 
        key={index}
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '48px',
          fontWeight: '600',
          textAlign: 'center',
          padding: '20px 40px',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '10px',
          maxWidth: '80%',
          lineHeight: '1.4',
          fontFamily: "'Noto Sans', 'Noto Sans Devanagari', sans-serif",
          direction: 'ltr',
          unicodeBidi: 'embed'
        }}
      >
        {words.map((word, wordIndex) => {
          const isHighlighted = wordIndex <= highlightedIndex;
          return (
            <span
              key={wordIndex}
              style={{
                color: isHighlighted ? '#ffd700' : 'rgba(255, 255, 255, 0.5)',
                textShadow: isHighlighted ? '0 0 10px rgba(255, 215, 0, 0.8)' : 'none',
              }}
            >
              {word}{' '}
            </span>
          );
        })}
      </div>
    );
  };

  const getCaptionStyle = (style, opacity) => {
    const baseStyle = {
      opacity,
      fontFamily: "'Noto Sans', 'Noto Sans Devanagari', sans-serif",
      fontSize: '48px',
      fontWeight: '600',
      color: '#ffffff',
      textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)',
      textAlign: 'center',
      padding: '20px 40px',
      borderRadius: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      maxWidth: '80%',
      lineHeight: '1.4',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    };

    switch (style) {
      case 'bottom-centered':
        return {
          ...baseStyle,
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'auto'
        };
      case 'top-bar':
        return {
          ...baseStyle,
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderTop: '4px solid #00ff00',
          borderRadius: '0 0 10px 10px'
        };
      default:
        return baseStyle;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill>
        {videoUrl && (
          <OffthreadVideo
            src={videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        )}
      </AbsoluteFill>
      <AbsoluteFill>
        {currentCaptions.map((caption, index) => renderCaption(caption, index))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
