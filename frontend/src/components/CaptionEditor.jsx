import React from 'react';

function CaptionEditor({ captions, setCaptions }) {
  const handleCaptionChange = (index, field, value) => {
    const updatedCaptions = [...captions];
    if (field === 'text') {
      updatedCaptions[index].text = value;
    } else if (field === 'start') {
      updatedCaptions[index].start = parseFloat(value) || 0;
    } else if (field === 'end') {
      updatedCaptions[index].end = parseFloat(value) || 0;
    }
    setCaptions(updatedCaptions);
  };

  const handleDelete = (index) => {
    const updatedCaptions = captions.filter((_, i) => i !== index);
    setCaptions(updatedCaptions);
  };

  const handleAdd = () => {
    const lastCaption = captions[captions.length - 1];
    const newStart = lastCaption ? lastCaption.end : 0;
    setCaptions([...captions, {
      text: 'New caption',
      start: newStart,
      end: newStart + 2
    }]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-xl">✏️</span> Edit Captions
        </h3>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 bg-gradient-to-r from-green-400 to-emerald-400 text-white text-sm font-medium rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all"
        >
          + Add
        </button>
      </div>
      
      <p className="text-gray-500 text-sm mb-4">
        Edit caption text and timing. Changes update the preview in real-time.
      </p>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {captions.map((caption, index) => (
          <div 
            key={index} 
            className="bg-gradient-to-r from-white to-purple-50/50 border border-purple-100 rounded-xl p-3 md:p-4 group hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-purple-400 to-pink-400 text-white text-sm font-bold rounded-lg">
                {index + 1}
              </span>
              <span className="text-gray-500 text-sm">
                {formatTime(caption.start)} → {formatTime(caption.end)}
              </span>
              <button 
                className="ml-auto px-2 py-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm opacity-0 group-hover:opacity-100"
                onClick={() => handleDelete(index)}
              >
                🗑️ Delete
              </button>
            </div>
            
            <textarea
              className="w-full p-3 bg-white border border-purple-100 rounded-lg text-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
              value={caption.text}
              onChange={(e) => handleCaptionChange(index, 'text', e.target.value)}
              placeholder="Caption text..."
              rows={2}
            />
            
            <div className="flex gap-4 mt-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Start:
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={caption.start}
                  onChange={(e) => handleCaptionChange(index, 'start', e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-purple-100 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <span className="text-gray-400">s</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                End:
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={caption.end}
                  onChange={(e) => handleCaptionChange(index, 'end', e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-purple-100 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <span className="text-gray-400">s</span>
              </label>
            </div>
          </div>
        ))}
        
        {captions.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">📝</div>
            <p>No captions yet. Generate or add some!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CaptionEditor;
