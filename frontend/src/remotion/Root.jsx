import { Composition } from 'remotion';
import { CaptionedVideo } from './CaptionedVideo';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CaptionedVideo"
        component={CaptionedVideo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoUrl: '',
          captions: [],
          captionStyle: 'bottom-centered'
        }}
      />
    </>
  );
};

