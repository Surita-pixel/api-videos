import { AbsoluteFill, Img, Sequence, staticFile, Audio, useCurrentFrame, interpolate, Easing, spring } from "remotion";


export const RemotionVideo = ({ script, imageList, audioUrl, captions, durationInFrames }) => {
    const frame = useCurrentFrame();
    
    const getCurrentTime = () => {
        const currentFrame = frame / 30 * 1000;
        const currentCaption = captions.find((word) => currentFrame >= word.start && currentFrame <= word.end);
        return currentCaption ? currentCaption.text : '';
    };
    
    const captionAnimationStyles = () => {
        const text = getCurrentTime();
        if (!text) return null;
        
        // Sutil animación para dar un efecto de respiración natural
        const fadeIn = interpolate(
            frame % 60,
            [0, 30, 60],
            [0.95, 1, 0.95],
            { extrapolateRight: "clamp" }
        );
        
        return {
            text,
            style: {
                color: "#FFFFFF",
                opacity: fadeIn,
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                fontWeight: "400",
                letterSpacing: "0.5px",
                transition: 'all 0.3s ease',
            }
        };
    };
    
    const transitionDuration = 15;
    const numberOfImages = imageList.length;
    
    return (
        <div>
            <AbsoluteFill className="bg-white">
                <Audio src={"http://127.0.0.1:4000/public/"+audioUrl} />
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
                    
                    // Obtenemos los estilos animados para el texto
                    const captionData = captionAnimationStyles();
                    
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
                                    bottom: 60,
                                    height: 100,
                                    textAlign: "center",
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {captionData && (
                                    <div style={{
                                        fontSize: '1.75rem',
                                        padding: '8px 16px',
                                        margin: '0 auto',
                                        maxWidth: '85%',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        borderRadius: '4px',
                                        backdropFilter: 'blur(4px)',
                                        lineHeight: '1.4',
                                        textAlign: 'center'
                                    }}>
                                        <span style={captionData.style}>
                                            {captionData.text}
                                        </span>
                                    </div>
                                )}
                            </AbsoluteFill>
                        </Sequence>
                    );
                })}
            </AbsoluteFill>
        </div>
    );
};