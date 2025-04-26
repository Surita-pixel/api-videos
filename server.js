import express from 'express';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';

const compositionId = "Empty";
const publicDir = path.join(process.cwd(), 'public');
const outputDir = path.join(process.cwd(), 'out');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use('/public', express.static(publicDir));
app.use('/videos', express.static(outputDir));

app.post('/generate-video', async (req, res) => {
  try {
    const inputProps = req.body;
    if (inputProps.audioFile && inputProps.id) {
      const audioUrl = saveBase64File(inputProps.audioFile, inputProps.id);
      inputProps.audioUrl = audioUrl.replace('/public/', '');
      delete inputProps.audioFile;
    }
    
    const time = inputProps.captions[inputProps.captions?.length - 1]?.end / 1000 * 30;
    console.log(`Duración estimada en frames: ${time}`);
    inputProps.durationInFrames = time;
    
    const videoResult = await generateVideo(inputProps);
    
    // Obtener información del servidor y construir URLs
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
    console.error("Error generando video:", error);
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