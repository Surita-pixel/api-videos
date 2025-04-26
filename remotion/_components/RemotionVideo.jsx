import { AbsoluteFill, Img, Sequence, staticFile, Audio, useCurrentFrame, interpolate, Easing, spring } from "remotion";
import audioFile from './public/d26542df-3d7c-40df-bab6-2dc97fdacc30.mp3';
import { useRef } from 'react';

export const RemotionVideo = ({ script, imageList, audioUrl, captions, durationInFrames }) => {

    const frame = useCurrentFrame();
    const getCurrentTime = () => {
        const currentFrame = frame / 30 * 1000;
        const currentCaption = captions.find((word) => currentFrame >= word.start && currentFrame <= word.end);
        return currentCaption ? currentCaption.text : '';
    };

    const transitionDuration = 15;
    const numberOfImages = imageList.length;

    return (
        <div>
            <AbsoluteFill className="bg-white">
                <Audio src={"http://127.0.0.1:4000/public/d26542df-3d7c-40df-bab6-2dc97fdacc30.mp3"} volume={1} />

                {imageList?.map((image, index) => {
                    const sequenceStartFrame = (index * durationInFrames) / numberOfImages;
                    const sequenceDuration = durationInFrames / numberOfImages;
                    const sequenceEndFrame = sequenceStartFrame + sequenceDuration;

                    const zoomInRotate = interpolate(
                        frame,
                        [sequenceStartFrame, sequenceStartFrame + transitionDuration],
                        [1.5, 1],
                        { easing: Easing.bezier(0.25, 1, 0.5, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    );

                    const rotateIn = interpolate(
                        frame,
                        [sequenceStartFrame, sequenceStartFrame + transitionDuration],
                        [-45, 0],
                        { easing: Easing.bezier(0.25, 1, 0.5, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    );

                    const zoomOutRotate = interpolate(
                        frame,
                        [sequenceEndFrame - transitionDuration, sequenceEndFrame],
                        [1, 1.5],
                        { easing: Easing.bezier(0.25, 1, 0.5, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    );

                    const rotateOut = interpolate(
                        frame,
                        [sequenceEndFrame - transitionDuration, sequenceEndFrame],
                        [0, 45],
                        { easing: Easing.bezier(0.25, 1, 0.5, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    );

                    const opacity = interpolate(
                        frame,
                        [sequenceStartFrame, sequenceStartFrame + transitionDuration, sequenceEndFrame - transitionDuration, sequenceEndFrame],
                        [0, 1, 1, 0],
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    );

                    return (
                        <Sequence
                            key={index}
                            from={sequenceStartFrame}
                            durationInFrames={sequenceDuration}
                        >
                            <AbsoluteFill style={{
                                opacity: opacity,
                                transform: `scale(${frame < sequenceStartFrame + transitionDuration ? zoomInRotate : zoomOutRotate}) rotate(${frame < sequenceStartFrame + transitionDuration ? rotateIn : rotateOut}deg)`,
                                transformOrigin: 'center',
                            }}>
                                <Img
                                    src={image}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            </AbsoluteFill>

                            <AbsoluteFill
                                style={{
                                    color: "black",
                                    justifyContent: "center",
                                    top: undefined,
                                    bottom: 50,
                                    height: 150,
                                    textAlign: "center",
                                    width: '100%'
                                }}
                            >
                                <h2 style={{
                                    fontSize: "20px",
                                    fontWeight: "600",
                                    color: "#f0f0f0",
                                    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
                                    padding: "6px 12px",
                                    borderRadius: "4px",
                                    margin: "0 auto",
                                    maxWidth: "80%",
                                    boxSizing: "border-box",
                                    lineHeight: "1.3",
                                    letterSpacing: "0.3px",
                                    fontFamily: 'sans-serif',
                                    backgroundColor: "transparent" // Asegúrate de que el fondo sea transparente
                                }}>
                                    {getCurrentTime()}
                                </h2>
                            </AbsoluteFill>
                        </Sequence>
                    );
                })}
            </AbsoluteFill>
        </div>
    );
};
