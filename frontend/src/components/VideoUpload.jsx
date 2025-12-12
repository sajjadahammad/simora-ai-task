import React, { useState } from 'react';
import { useVideoUpload } from '../hooks/useVideoUpload';
import { useCaptionGeneration } from '../hooks/useCaptionGeneration';

function VideoUpload({ onVideoUpload, onCaptionsGenerated }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState(null);

  const uploadMutation = useVideoUpload();
  const captionMutation = useCaptionGeneration();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'video/mp4') {
      setSelectedFile(file);
      setUploadProgress(0);
    } else {
      alert('Please select a valid MP4 video file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a video file first');
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      const videoInfo = result.video;
      setUploadedVideo(videoInfo);

      const localUrl = URL.createObjectURL(selectedFile);
      onVideoUpload(selectedFile, localUrl, videoInfo.filename);

      await handleGenerateCaptions(videoInfo.filename);
    } catch (error) {
      alert('Failed to upload video: ' + (error.response?.data?.error || error.message));
      setUploadProgress(0);
    }
  };

  const handleGenerateCaptions = async (filename) => {
    try {
      const result = await captionMutation.mutateAsync(filename);
      if (result.success && result.captions) {
        onCaptionsGenerated(result.captions);
      }
    } catch (error) {
      alert('Failed to generate captions: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAutoGenerate = async () => {
    if (!uploadedVideo) {
      alert('Please upload a video first');
      return;
    }
    await handleGenerateCaptions(uploadedVideo.filename);
  };

  const isUploading = uploadMutation.isPending;
  const isGenerating = captionMutation.isPending;
  const uploadError = uploadMutation.error;
  const captionError = captionMutation.error;

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-5 h-full">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="text-xl">📤</span> Upload Video
      </h3>
      
      {/* Upload Area - Compact */}
      <div 
        className={`relative border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-all cursor-pointer
          ${selectedFile 
            ? 'border-green-300 bg-green-50/50' 
            : 'border-purple-200 bg-purple-50/30 hover:border-purple-300 hover:bg-purple-50/50'
          }`}
        onClick={() => document.getElementById('video-input').click()}
      >
        <input
          type="file"
          accept="video/mp4"
          onChange={handleFileSelect}
          id="video-input"
          className="hidden"
        />
        
        <div className="flex flex-col items-center">
          <div className={`text-4xl mb-3 ${selectedFile ? 'animate-bounce' : ''}`}>
            {selectedFile ? '✅' : '🎬'}
          </div>
          <p className="text-sm md:text-base text-gray-600 font-medium">
            {selectedFile ? selectedFile.name : 'Drop your MP4 here or click to browse'}
          </p>
          {selectedFile && (
            <p className="text-xs text-gray-400 mt-1">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          )}
          {!selectedFile && (
            <p className="text-xs text-gray-400 mt-2">Supports MP4 format</p>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {uploadError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          ❌ {uploadError.response?.data?.error || uploadError.message}
        </div>
      )}

      {captionError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          ❌ {captionError.response?.data?.error || captionError.message}
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !uploadedVideo && (
        <button 
          className="w-full mt-4 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Uploading... {uploadProgress}%
            </span>
          ) : (
            '🚀 Upload & Generate Captions'
          )}
        </button>
      )}

      {/* Progress Bar */}
      {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Success State */}
      {uploadedVideo && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <p className="text-green-700 font-medium text-sm mb-3 flex items-center gap-2">
            <span>✨</span> Video uploaded successfully!
          </p>
          <button 
            className="w-full py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-medium rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            onClick={handleAutoGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Generating captions...
              </span>
            ) : (
              '🎯 Re-generate Captions'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoUpload;
