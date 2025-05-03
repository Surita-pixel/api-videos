import express from 'express';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { AssemblyAI } from 'assemblyai';  
import { join } from 'path'; 

const compositionId = "Empty";
const publicDir = path.join(process.cwd(), 'public');
const outputDir = path.join(process.cwd(), 'out');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const client = new AssemblyAI({
    apiKey: "d23e9940c99744bfaad2118d05b9abc9",
});

async function generateVideo(inputProps) {
    const bundleLocation = await bundle({
        entryPoint: ".\\remotion\\index.js"
    });

    const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: compositionId,
        inputProps
    });

    const outputFilename = `${compositionId}-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: inputProps,
    });

    return {
        filename: outputFilename,
        fullPath: outputPath
    };
}

async function saveBase64AudioToFile(base64Audio, id) {
    const audioBuffer = Buffer.from(base64Audio, 'base64');
    const filename = `${id}.mp3`;
    const filepath = join(process.cwd(), 'public', filename);
    const fileUrl = `/public/${filename}`;

    try {
        fs.accessSync(filepath); 
        console.log(`Audio file already exists for id: ${id}. Returning existing URL.`);
        return fileUrl;
    } catch (error) {
        if (error.code === 'ENOENT') {
            
        } else {
            console.error("Error checking for audio file:", error);
            throw new Error("Failed to check for existing audio file");
        }
    }

    try {
        fs.writeFileSync(filepath, audioBuffer); 
        return fileUrl;
    } catch (error) {
        console.error("Error saving audio file:", error);
        throw new Error("Failed to save audio file");
    }
}

function saveBase64File(base64Data, id, fileExtension = 'mp3') {
    const base64Content = base64Data.includes('base64,')
        ? base64Data.split('base64,')[1]
        : base64Data;
    const fileName = `${id}.${fileExtension}`;
    const filePath = path.join(publicDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
    return `/public/${fileName}`;
}


function getServerIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}
async function generateAudioElevenLabs(script, speed = 1.5) { 
  const myHeaders = new Headers();
  myHeaders.append("xi-api-key", "sk_e82f350d6be6cbceb4efebbe07bc0774632ca63a9183f20c");
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    "text": script,
    "model_id": "eleven_multilingual_v2",
    "voice_settings": { 
      "stability": 0.75, 
      "similarity_boost": 0.75, 
      "style": 0, 
      "use_speaker_boost": true 
    }
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/w7IU2bIH6xHcyfkUUWi3?output_format=mp3_44100_128&speed=${speed}`, requestOptions); 

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} - ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString('base64');

    return `data:audio/mp3;base64,${base64Audio}`;
  } catch (error) {
    console.error("Error generating audio with ElevenLabs:", error);
    throw error;
  }
}
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use('/public', express.static(publicDir));
app.use('/videos', express.static(outputDir));

app.post('/generate-video', async (req, res) => {
    try {
        const inputProps = req.body;

        
        if (!inputProps.audioFile && inputProps.script) {
            try {
                const audioBase64 = await generateAudioElevenLabs(inputProps.script);
                inputProps.audioFile = audioBase64; 
                delete inputProps.script; 
            } catch (elevenLabsError) {
                return res.status(500).send('Error generating audio with ElevenLabs: ' + elevenLabsError.message);
            }
        }

        //Save audio file in public and create assembly ai caption

        if (inputProps.audioFile && inputProps.id) {
            //const audioUrl = saveBase64File(inputProps.audioFile, inputProps.id);
            const audioUrl = await saveBase64AudioToFile(inputProps.audioFile.split('base64,')[1], inputProps.id);
            inputProps.audioUrl = audioUrl.replace('/public/', '');
            delete inputProps.audioFile;

            if (!inputProps.captions || inputProps.captions.length === 0) {
                
                try {
                    const transcript = await client.transcripts.transcribe({ audio: `${publicDir}/${inputProps.audioUrl}` });
                    inputProps.captions = transcript.words ?? [];
                    
                    console.log("AssemblyAI transcript:", transcript.text);


                } catch (assemblyAiError) {
                    console.error("AssemblyAI error:", assemblyAiError);
                    return res.status(500).send('Error transcribing audio with AssemblyAI: ' + assemblyAiError.message);
                }
            }
        }

        const time = inputProps.captions[inputProps.captions?.length - 1]?.end / 1000 * 30;
        console.log(`Duración estimada en frames: ${time}`);
        inputProps.durationInFrames = time;

        const videoResult = await generateVideo(inputProps);

        const serverIP = getServerIP();
        const serverPort = 4000;
        const videoUrl = `http://${serverIP}:${serverPort}/videos/${videoResult.filename}`;

        res.status(200).json({
            message: 'Video generado exitosamente',
            videoFilename: videoResult.filename,
            videoLocalPath: videoResult.fullPath,
            videoUrl: videoUrl,
            serverIP: serverIP,
            serverPort: serverPort,
            audioUrl: inputProps.audioUrl ? `/public/${inputProps.audioUrl}` : null
        });
    } catch (error) {
        console.error("Error generating video:", error);
        res.status(500).send('Error generando video: ' + error.message);
    }
});

app.get('/video-status', (req, res) => {
    try {
        const { filename } = req.query;
        if (!filename) {
            return res.status(400).json({ error: 'Se requiere nombre de archivo' });
        }

        const videoPath = path.join(outputDir, filename);
        if (fs.existsSync(videoPath)) {
            const stats = fs.statSync(videoPath);
            const serverIP = getServerIP();
            const serverPort = 4000;

            res.status(200).json({
                exists: true,
                fileSize: stats.size,
                created: stats.birthtime,
                videoUrl: `http://${serverIP}:${serverPort}/videos/${filename}`,
                serverIP: serverIP,
                serverPort: serverPort
            });
        } else {
            res.status(404).json({
                exists: false,
                message: 'Video no encontrado'
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    const serverIP = getServerIP();
    console.log(`Servidor ejecutándose en http://${serverIP}:${PORT}`);
    console.log(`Carpeta de videos: ${outputDir}`);
});