import { bundle } from '@remotion/bundler';
import { renderMedia } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const root = process.cwd();
const entry = path.join(root, 'src/index.tsx');
const out = path.join(root, 'output', 'video.mp4');

const config = {
  input: entry,
  out,
  props: {
    title: 'AI Agency Demo',
    script: 'This is a generated short-form script for testing the pipeline. Use a proper script from your model output in production.'
  },
  logLevel: 'info',
};

fs.mkdirSync(path.dirname(out), { recursive: true });

const bundled = await bundle({ entry, outDir: path.join(root, '.remotion') });
await renderMedia({
  ...config,
  bundle: bundled,
  codec: 'h264',
  imageFormat: 'jpeg',
  pixelsPerFrame: 1,
  frameRate: 30,
  durationInFrames: 120,
  quality: 'high',
  onProgress: (p) => console.log('progress', p),
});

console.log('Rendered to', out);
