// React Query hook for caption generation
import { useMutation } from '@tanstack/react-query';
import { generateCaptions } from '../services/videoService';

export const useCaptionGeneration = () => {
  return useMutation({
    mutationFn: (filename) => generateCaptions(filename),
    onError: (error) => {
      console.error('Caption generation error:', error);
    },
  });
};

