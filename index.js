import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
const compositionId = "Empty"
const bundleLocation = await bundle({
    entryPoint: "C:\\proyects\\tiktok-generate\\tiktok-generate\\src\\app\\remotion\\index.ts"
});

const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,

});

await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: `out/${compositionId}.mp4`,
    inputProps: {},
});