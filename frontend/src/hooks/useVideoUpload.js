// React Query hook for video upload
import { useMutation } from '@tanstack/react-query';
import { uploadVideo } from '../services/videoService';

export const useVideoUpload = () => {
  return useMutation({
    mutationFn: ({ file, onProgress }) => uploadVideo(file, onProgress),
    onError: (error) => {
      console.error('Upload error:', error);
    },
  });
};

