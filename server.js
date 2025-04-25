import express from 'express';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const compositionId = "Empty";

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
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
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h265',
    separateAudioTo:'audio.aac',
    outputLocation: `out/${compositionId}.mp4`,
    inputProps: inputProps,
  });
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

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use('/public', express.static(publicDir));
app.post('/generate-video', async (req, res) => {
  try {
    const inputProps = req.body;

    if (inputProps.audioFile && inputProps.id) {
      const audioUrl = saveBase64File(inputProps.audioFile, inputProps.id);

      inputProps.audioUrl = audioUrl.replace('/public/', '');

      delete inputProps.audioFile;
    }

    const time = inputProps.captions[inputProps.captions?.length - 1]?.end / 1000 * 30;
    console.log(time);
    inputProps.durationInFrames = time;

    await generateVideo(inputProps);

    res.status(200).json({
      message: 'Video generation started. Check out folder for result',
      audioUrl: inputProps.audioUrl
    });
  } catch (error) {
    console.error("Error generating video:", error);
    res.status(500).send('Error generating video: ' + error.message);
  }
});

app.listen(4000, () => {
  console.log('Server listening on port 4000');
});