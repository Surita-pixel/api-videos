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
    
    // Animación para los captions
    const captionAnimation = () => {
        const text = getCurrentTime();
        if (!text) return null;
        
        const bounce = spring({
            frame,
            fps: 30,
            config: {
                damping: 10,
                mass: 0.5,
                stiffness: 100,
            }
        });
        
        const textColor = interpolate(
            frame % 150,
            [0, 75, 150],
            ["#FF2D55", "#5856D6", "#FF2D55"],
            {extrapolateRight: "clamp"}
        );
        
        const shadowColor = interpolate(
            frame % 150,
            [0, 75, 150],
            ["#5856D6", "#FF2D55", "#5856D6"],
            {extrapolateRight: "clamp"}
        );
        
        return text;
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
                                    justifyContent: "center",
                                    top: undefined,
                                    bottom: 50,
                                    height: 150,
                                    textAlign: "center",
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    perspective: '1000px'
                                }}
                            >
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    padding: '10px 20px',
                                    margin: '0 auto',
                                    maxWidth: '80%',
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    borderRadius: '15px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                    transform: `translateY(${Math.sin(frame / 10) * 5}px)`,
                                    color: 'white',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(5px)',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    lineHeight: '1.3',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {getCurrentTime()}
                                </div>
                            </AbsoluteFill>
                        </Sequence>
                    );
                })}
            </AbsoluteFill>
        </div>
    );
};