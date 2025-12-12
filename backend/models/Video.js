// Video Model - Data structure for video files
export const createVideo = (data) => {
  return {
    id: data.id || null,
    filename: data.filename,
    originalName: data.originalName,
    path: data.path,
    size: data.size,
    mimetype: data.mimetype,
    uploadedAt: data.uploadedAt || new Date().toISOString(),
    captions: data.captions || null
  };
};

export const videoToJSON = (video) => {
  return {
    id: video.id,
    filename: video.filename,
    originalName: video.originalName,
    path: video.path,
    size: video.size,
    mimetype: video.mimetype,
    uploadedAt: video.uploadedAt,
    hasCaptions: !!video.captions
  };
};

