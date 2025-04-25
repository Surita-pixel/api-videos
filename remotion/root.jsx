import React from "react";
import { Composition } from "remotion";
import { RemotionVideo } from "./_components/RemotionVideo.jsx";
const calculateMetadata = ({props, defaultProps, abortSignal}) => {
    
    return {
      durationInFrames: Math.round(props.captions[props.captions?.length -1 ]?.end/1000 * 30),
    };
  };
function Root() {
  return (
    <>
      <Composition
        id="Empty"
        component={RemotionVideo}
        fps={30}
        width={300}
        height={450}
        
        durationInFrames={60}
        defaultProps={{
          script: [],
          imageList: [],
          audioFile: "",
          captions: [],
        }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
}

export default Root;