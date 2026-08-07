/**
 * 媒体自动同步 —— 把"丢文件进目录"变成唯一的操作，不用再改任何配置。
 *
 *   public/audio/*.mp3            -> src/data/music.json  +  public/images/covers/*
 *   public/images/backgrounds/*   -> src/data/backgrounds.json
 *
 * 歌曲信息（曲名 / 艺术家 / 专辑 / 封面）全部从 mp3 自带的 ID3 标签里读，
 * 封面会被抽出来单独存成图片文件 —— 页面上显示的是这个图片文件，
 * 不是从 mp3 里现读（那需要运行时文件系统，而 Cloudflare Workers 上没有）。
 *
 * 【为什么是构建前的独立脚本，而不是在 src/lib 里读文件系统】
 * 抽出来的封面要写进 public/，必须赶在 next build 收集静态资源【之前】完成。
 * 放进构建过程里做，写入时机和资源收集时机的先后没有保证。
 * 所以挂在 package.json 的 prebuild / predev 上，由 npm 保证它先跑完。
 *
 * 手动执行：npm run sync:media
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseFile } from 'music-metadata';

const AUDIO_DIR = 'public/audio';
const COVER_DIR = 'public/images/covers';
const BACKGROUND_DIR = 'public/images/backgrounds';
const MUSIC_JSON = 'src/data/music.json';
const BACKGROUNDS_JSON = 'src/data/backgrounds.json';

/** 认得的图片扩展名，用于筛选背景图 */
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

/** MIME -> 扩展名，给抽出来的封面命名用 */
const PICTURE_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * 生成 URL 安全的短标识。
 * 只保留 ASCII 字母数字，中日文标题会被清空 —— 那时退回按序号命名，
 * 保证文件名和 id 在任何语言下都不会出问题。
 */
function slugify(input, fallback) {
  const slug = input
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

/** public/ 下的绝对路径 -> 站点里的 URL 路径 */
function toUrlPath(filePath) {
  return '/' + path.relative('public', filePath).split(path.sep).join('/');
}

function listFiles(dir, filter) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => fs.statSync(path.join(dir, name)).isFile())
    .filter(filter)
    .sort((a, b) => a.localeCompare(b, 'en'));
}

/** 只在内容真的变了时才写盘，避免每次构建都把文件的修改时间刷新一遍 */
function writeIfChanged(file, content) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (existing === content) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
  return true;
}

async function syncAudio() {
  const files = listFiles(AUDIO_DIR, (name) => name.toLowerCase().endsWith('.mp3'));
  const tracks = [];
  let extracted = 0;
  let missingArt = 0;
  /** 已用掉的 id，用来给重名曲目加后缀 */
  const usedIds = new Set();

  fs.mkdirSync(COVER_DIR, { recursive: true });

  for (const [index, name] of files.entries()) {
    const filePath = path.join(AUDIO_DIR, name);
    const meta = await parseFile(filePath, { duration: true });
    const { common, format } = meta;

    const stem = path.basename(name, path.extname(name));
    const title = common.title?.trim() || stem;
    const artist = common.artist?.trim() || common.albumartist?.trim() || '';
    // id 同时用作 React 列表的 key 和封面文件名，必须唯一。
    // 两首歌 ID3 标题相同时（同曲不同版本、或不同专辑收录同名曲）
    // slug 会撞车，导致列表 key 重复、封面互相覆盖 —— 撞了就加 -2 / -3
    const baseId = slugify(title, `track-${index + 1}`);
    let id = baseId;
    for (let n = 2; usedIds.has(id); n += 1) id = `${baseId}-${n}`;
    usedIds.add(id);

    // 内嵌封面抽成单独文件。页面用的是这个文件，运行时不需要再碰 mp3
    let cover;
    const picture = common.picture?.[0];
    if (picture) {
      const ext = PICTURE_EXT[picture.format?.toLowerCase()] ?? '.jpg';
      const coverPath = path.join(COVER_DIR, `${id}${ext}`);
      const data = Buffer.from(picture.data);
      // 内容没变就不重写，理由同 writeIfChanged
      const same = fs.existsSync(coverPath) && Buffer.compare(fs.readFileSync(coverPath), data) === 0;
      if (!same) {
        fs.writeFileSync(coverPath, data);
        extracted += 1;
      }
      cover = toUrlPath(coverPath);
    } else {
      missingArt += 1;
    }

    tracks.push({
      id,
      title,
      artist,
      ...(common.album ? { album: common.album.trim() } : {}),
      // encodeURI：文件名里常有空格和 !，直接进 src 会拼不出合法 URL
      src: encodeURI(toUrlPath(filePath)),
      ...(cover ? { cover } : {}),
      ...(format.duration ? { duration: Math.round(format.duration) } : {}),
    });
  }

  const payload = {
    _generated: '此文件由 scripts/sync-media.mjs 生成，请勿手改。加歌只需把 mp3 放进 public/audio/',
    id: 'recent',
    name: '最近在循环',
    tracks,
  };

  const changed = writeIfChanged(MUSIC_JSON, JSON.stringify(payload, null, 2) + '\n');
  console.log(`  音频  ${files.length} 首 -> ${MUSIC_JSON}${changed ? '（已更新）' : '（无变化）'}`);
  if (extracted > 0) console.log(`        抽出 ${extracted} 张内嵌封面到 ${COVER_DIR}/`);
  if (missingArt > 0) {
    console.log(`        ⚠ ${missingArt} 首没有内嵌封面，播放器会显示渐变占位块`);
  }
  return tracks.length;
}

function syncBackgrounds() {
  const files = listFiles(BACKGROUND_DIR, (name) => IMAGE_EXT.has(path.extname(name).toLowerCase()));
  const images = files.map((name) => encodeURI(toUrlPath(path.join(BACKGROUND_DIR, name))));

  const payload = {
    _generated: '此文件由 scripts/sync-media.mjs 生成，请勿手改。换背景只需把图片放进 public/images/backgrounds/',
    images,
  };

  const changed = writeIfChanged(BACKGROUNDS_JSON, JSON.stringify(payload, null, 2) + '\n');
  console.log(`  背景  ${files.length} 张 -> ${BACKGROUNDS_JSON}${changed ? '（已更新）' : '（无变化）'}`);
  return images.length;
}

console.log('同步媒体资源：');
const trackCount = await syncAudio();
const bgCount = syncBackgrounds();

if (trackCount === 0) console.log('  ⚠ public/audio/ 下没有 mp3，播放器将不显示');
if (bgCount === 0) console.log('  ⚠ public/images/backgrounds/ 下没有图片，背景只保留渐变');
