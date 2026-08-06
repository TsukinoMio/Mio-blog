// 一次性脚本：从 public/audio/ 里 mp3 的 ID3 标签中提取内嵌专辑封面，
// 存到 public/images/covers/，并打印出 music.json 里每首歌对应的 cover 路径。
// 用法：node scripts/extract-audio-covers.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseFile } from 'music-metadata';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
const COVER_DIR = path.join(process.cwd(), 'public', 'images', 'covers');

function slugify(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

await fs.mkdir(COVER_DIR, { recursive: true });

const files = (await fs.readdir(AUDIO_DIR)).filter((f) => /\.(mp3|m4a|flac)$/i.test(f));

for (const file of files) {
  const metadata = await parseFile(path.join(AUDIO_DIR, file));
  const picture = metadata.common.picture?.[0];

  if (!picture) {
    console.log(`[无封面] ${file}`);
    continue;
  }

  const ext = picture.format.split('/').pop().replace('jpeg', 'jpg');
  const outName = `${slugify(file)}.${ext}`;
  await fs.writeFile(path.join(COVER_DIR, outName), picture.data);
  console.log(`${file}  ->  /images/covers/${outName}`);
}
