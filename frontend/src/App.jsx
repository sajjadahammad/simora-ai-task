import React, { useState, useEffect } from 'react';
import VideoUpload from './components/VideoUpload';
import CaptionEditor from './components/CaptionEditor';
import VideoPreview from './components/VideoPreview';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [captionStyle, setCaptionStyle] = useState('bottom-centered');

  useEffect(() => {
    console.log('App: Captions updated:', captions);
  }, [captions]);

  const handleVideoUpload = (file, url, filename) => {
    setVideoFile(file);
    setVideoUrl(url);
    setUploadedFilename(filename);
    setCaptions([]);
  };

  const handleCaptionsGenerated = (newCaptions) => {
    setCaptions(newCaptions);
  };

  const handleTestCaptions = () => {
    const testCaptions = [
      { text: 'This is a test caption', start: 0, end: 3 },
      { text: 'Second caption here', start: 3, end: 6 },
      { text: 'यह हिंदी में है - This is Hinglish', start: 6, end: 10 },
      { text: 'Final test caption', start: 10, end: 15 },
    ];
    setCaptions(testCaptions);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-6 md:mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-rose-400 bg-clip-text text-transparent">
                ✨ Caption Magic
              </h1>
              <p className="text-sm md:text-base text-gray-500 mt-1">
                Auto-generate beautiful captions for your videos
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Ready
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* Caption Style Selector */}
        {videoUrl && (
          <div className="mb-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <label className="text-sm font-medium text-gray-600">Caption Style:</label>
              <select 
                value={captionStyle} 
                onChange={(e) => setCaptionStyle(e.target.value)}
                className="px-4 py-2 bg-white border border-purple-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent cursor-pointer transition-all hover:border-purple-300"
              >
                <option value="bottom-centered">📍 Bottom Centered</option>
                <option value="top-bar">📺 Top Bar (News)</option>
                <option value="karaoke">🎤 Karaoke Style</option>
              </select>
              <button
                onClick={handleTestCaptions}
                className="px-4 py-2 bg-gradient-to-r from-amber-200 to-yellow-300 text-amber-800 text-sm font-medium rounded-xl hover:from-amber-300 hover:to-yellow-400 transition-all shadow-sm hover:shadow-md"
              >
                🧪 Test Captions
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          <VideoUpload 
            onVideoUpload={handleVideoUpload}
            onCaptionsGenerated={handleCaptionsGenerated}
          />
          <VideoPreview 
            videoUrl={videoUrl}
            captions={captions}
            captionStyle={captionStyle}
            uploadedFilename={uploadedFilename}
          />
        </div>

        {/* Caption Editor */}
        {videoUrl && captions.length > 0 && (
          <CaptionEditor 
            captions={captions}
            setCaptions={setCaptions}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-8 md:mt-12">
        <div className="text-center text-sm text-gray-400 py-4">
          <p>Powered by Remotion & Whisper AI ✨</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
