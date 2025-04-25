import { AbsoluteFill, Img, Sequence, staticFile, Audio, useCurrentFrame } from "remotion";
import audioFile from './public/d26542df-3d7c-40df-bab6-2dc97fdacc30.mp3';
export const RemotionVideo = ({ script, imageList, audioUrl, captions, durationInFrames }) => {

  
    const frame = useCurrentFrame()
    const getCurrentTime = ()=>{
        const currentFrame = frame/30*1000
        const currentCaption = captions.find((word)=>currentFrame>=word.start && currentFrame<=word.end)
        return currentCaption?currentCaption.text:''
    }

    return (
        <div>
            <AbsoluteFill className="bg-white">
                <Audio src={staticFile(audioUrl)}  volume={1}/>
                
                {imageList?.map((image, index) => (
                    <Sequence
                        key={index}
                        from={(index * durationInFrames)/imageList.length}
                        durationInFrames={durationInFrames/imageList.length}
                    >
                        <Img
                            src={image}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
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
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: "white",
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        margin: "0 auto",
                        maxWidth: "80%",
                        boxSizing: "border-box",
                        lineHeight: "1.4",
                        letterSpacing: "0.5px"
                        }}>
                        {getCurrentTime()}
                        </h2>
                        </AbsoluteFill>
                    </Sequence>
                ))}
            </AbsoluteFill>
        </div>
    );
};