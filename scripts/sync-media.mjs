/**
 * 媒体自动同步 —— 把"丢文件进目录"变成唯一的操作，不用再改任何配置。
 *
 *   public/audio/*.mp3            -> 压到 128k -> src/data/music.json + public/images/covers/*
 *   public/images/backgrounds/*   -> 转 WebP  -> src/data/backgrounds.json
 *
 * 丢进去的文件会先被自动优化（需要本机装了 ffmpeg，没有就跳过），
 * 原文件挪去 MioSrc/media-originals/ 留底，那个目录不进仓库。
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

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseFile } from 'music-metadata';

const AUDIO_DIR = 'public/audio';
const COVER_DIR = 'public/images/covers';
const BACKGROUND_DIR = 'public/images/backgrounds';
const MUSIC_JSON = 'src/data/music.json';
const BACKGROUNDS_JSON = 'src/data/backgrounds.json';

/* ==========================================================================
   自动优化的参数
   ========================================================================== */

/** mp3 目标码率。原文件低于 BITRATE_SKIP_KBPS 就不动它 */
const AUDIO_TARGET_KBPS = 128;

/**
 * 码率容差线。只有超过这个值才会重新编码。
 *
 * 【为什么要容差】mp3 是有损格式，把已经 128k 的文件再压一遍不会更小，
 * 只会一次次掉音质。而 VBR 文件的实测码率常在标称值上下浮动，
 * 卡死 128 会让它们每次构建都被重压一遍。留 8% 余量。
 */
const AUDIO_SKIP_ABOVE_KBPS = Math.round(AUDIO_TARGET_KBPS * 1.08);

/**
 * 背景图 WebP 质量（libwebp，0~100）。
 *
 * 实测（本站四张背景，PSNR 越高越接近原图）：
 *   q=82 -> 合计 1.99 MB，PSNR 33.6~42.1 dB
 *   q=90 -> 合计 3.2  MB，PSNR 34.9~43   dB   ← 选它
 *   q=95 -> 合计 4.75 MB，PSNR 35.5~44   dB
 *
 * 选 90 而不是更省的 82：**源文件体积只影响仓库大小，不影响访客下载量** ——
 * 访客拿到的是 next/image 现场生成的 AVIF，与源文件大小无关。
 * 而背景在首页是 0.55 不透明度、无模糊直接显示的（见 config/theme.ts，
 * 首页还不叠遮罩），源图糊了会被看出来。多花 1 MB 仓库换画质是划算的。
 */
const WEBP_QUALITY = 90;

/**
 * 背景图最大宽度。next/image 的最大档位就是 3840，
 * 再大的源图不会被用到，纯粹占仓库体积。小于这个宽度的图不会被放大。
 */
const MAX_IMAGE_WIDTH = 3840;

/** 会被转成 WebP 的源格式。webp / avif 已经是目标格式，gif 可能是动图，都跳过 */
const CONVERTIBLE_IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff']);

/**
 * 原文件备份目录。**在 .gitignore 里**，不进仓库。
 *
 * 转码是不可逆的，直接覆盖等于把站主拖进来的原图/原曲销毁了。
 * 所以先挪到这里再替换 —— 本地留底，仓库只拿优化后的版本。
 * 确认没问题后可以随时手动清空这个目录。
 */
const ORIGINALS_DIR = 'MioSrc/media-originals';

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

/* ==========================================================================
   自动优化：mp3 压到 128k、图片转 WebP
   --------------------------------------------------------------------------
   目标是让"丢文件进目录"真的只需要丢文件，不用先自己压一遍。

   【为什么可以缺 ffmpeg 也不报错】
   这个脚本挂在 prebuild 上，CI（Cloudflare Workers Builds）也会跑，
   而那个环境里没有 ffmpeg。所以检测不到就静默跳过 ——
   反正优化后的文件已经在本地转好并提交了，CI 只负责读。

   代价：如果丢完文件不在本地跑一次（npm run dev 会自动跑）就直接提交，
   进仓库的就是没压过的原文件。README 里写明了这一点。
   ========================================================================== */

/** ffmpeg 在不在。只探测一次，结果缓存下来 */
let ffmpegChecked = false;
let ffmpegOk = false;
function hasFfmpeg() {
  if (ffmpegChecked) return ffmpegOk;
  ffmpegChecked = true;
  // 不用 shell，避免路径里的空格和中文被拆开
  const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore', shell: false });
  ffmpegOk = probe.status === 0;
  return ffmpegOk;
}

/** 把原文件挪进备份目录。同名时加 -2 / -3，不覆盖之前的备份 */
function backupOriginal(filePath) {
  fs.mkdirSync(ORIGINALS_DIR, { recursive: true });
  const ext = path.extname(filePath);
  const stem = path.basename(filePath, ext);
  let dest = path.join(ORIGINALS_DIR, `${stem}${ext}`);
  for (let n = 2; fs.existsSync(dest); n += 1) {
    dest = path.join(ORIGINALS_DIR, `${stem}-${n}${ext}`);
  }
  fs.renameSync(filePath, dest);
  return dest;
}

function runFfmpeg(args) {
  const res = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
    stdio: ['ignore', 'ignore', 'pipe'],
    shell: false,
    encoding: 'utf8',
  });
  return { ok: res.status === 0, stderr: (res.stderr || '').trim() };
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);

/** 把码率高于目标的 mp3 重新编码到 128k，内嵌封面原样保留 */
async function optimizeAudio() {
  const files = listFiles(AUDIO_DIR, (name) => name.toLowerCase().endsWith('.mp3'));
  if (files.length === 0) return;

  // 先只做检测，没有需要处理的就完全不提 ffmpeg，避免每次构建刷无用日志
  const todo = [];
  for (const name of files) {
    const filePath = path.join(AUDIO_DIR, name);
    const { format } = await parseFile(filePath, { duration: false });
    const kbps = Math.round((format.bitrate ?? 0) / 1000);
    // 注意：这里读的是**音频流**码率，不是容器码率。
    // 容器码率被内嵌封面拉高（实测 128k 的歌容器上显示 133~144k），
    // 拿容器值判断会导致已经压好的文件每次都被重压。
    if (kbps > AUDIO_SKIP_ABOVE_KBPS) todo.push({ name, filePath, kbps });
  }
  if (todo.length === 0) return;

  if (!hasFfmpeg()) {
    console.log(`        ⚠ ${todo.length} 首码率高于 ${AUDIO_SKIP_ABOVE_KBPS}k 但没找到 ffmpeg，跳过压缩`);
    return;
  }

  for (const { name, filePath, kbps } of todo) {
    const before = fs.statSync(filePath).size;
    const tmp = path.join(AUDIO_DIR, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);

    // -map 0 -c:v copy：把内嵌封面那条流原样带过去。
    // ADR-9 踩过 —— 用 -vn 剥掉封面省体积，结果 sync-media 认不到图，
    // 播放器只剩渐变占位块。每首多 0.2~0.6 MB 是这套工作流的必要成本。
    const { ok, stderr } = runFfmpeg([
      '-i', filePath,
      '-map', '0',
      '-map_metadata', '0',
      '-c:v', 'copy',
      '-c:a', 'libmp3lame',
      '-b:a', `${AUDIO_TARGET_KBPS}k`,
      '-id3v2_version', '3',
      tmp,
    ]);

    if (!ok || !fs.existsSync(tmp) || fs.statSync(tmp).size === 0) {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      console.log(`        ⚠ ${name} 压缩失败，保留原文件${stderr ? `：${stderr.split('\n')[0]}` : ''}`);
      continue;
    }

    const after = fs.statSync(tmp).size;
    backupOriginal(filePath);
    fs.renameSync(tmp, filePath);
    console.log(`        ♪ ${name}`);
    console.log(
      `          ${kbps}k -> ${AUDIO_TARGET_KBPS}k，${mb(before)} MB -> ${mb(after)} MB（原文件已备份到 ${ORIGINALS_DIR}/）`,
    );
  }
}

/** 把背景图转成 WebP 并限制最大宽度 */
function optimizeBackgrounds() {
  const files = listFiles(BACKGROUND_DIR, (name) =>
    CONVERTIBLE_IMAGE_EXT.has(path.extname(name).toLowerCase()),
  );
  if (files.length === 0) return;

  if (!hasFfmpeg()) {
    console.log(`        ⚠ ${files.length} 张图待转 WebP 但没找到 ffmpeg，跳过转换`);
    return;
  }

  for (const name of files) {
    const filePath = path.join(BACKGROUND_DIR, name);
    const stem = path.basename(name, path.extname(name));
    const target = path.join(BACKGROUND_DIR, `${stem}.webp`);

    // 同名的 .webp 已经存在：转过去会把它覆盖掉，而那可能是另一张图。
    // 宁可不动，让站主自己决定留哪个
    if (fs.existsSync(target)) {
      console.log(`        ⚠ ${name} 跳过：同名的 ${stem}.webp 已存在，请自行确认保留哪张`);
      continue;
    }

    const before = fs.statSync(filePath).size;
    const tmp = path.join(BACKGROUND_DIR, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`);

    // scale='min(W,iw)':-1 —— 只缩不放：源图比上限窄时 min() 取源图宽度，等于不缩放
    const { ok, stderr } = runFfmpeg([
      '-i', filePath,
      '-vf', `scale='min(${MAX_IMAGE_WIDTH},iw)':-1`,
      '-c:v', 'libwebp',
      '-preset', 'picture',
      '-quality', String(WEBP_QUALITY),
      '-compression_level', '6',
      tmp,
    ]);

    if (!ok || !fs.existsSync(tmp) || fs.statSync(tmp).size === 0) {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      console.log(`        ⚠ ${name} 转换失败，保留原文件${stderr ? `：${stderr.split('\n')[0]}` : ''}`);
      continue;
    }

    const after = fs.statSync(tmp).size;
    fs.renameSync(tmp, target);
    backupOriginal(filePath);
    console.log(
      `        ▸ ${name} -> ${stem}.webp   ${mb(before)} MB -> ${mb(after)} MB（省 ${Math.round((1 - after / before) * 100)}%）`,
    );
  }
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

// 优化必须跑在扫描之前：图片转 WebP 会改文件名，
// 扫描要拿到的是转换后的最终文件列表
await optimizeAudio();
optimizeBackgrounds();

const trackCount = await syncAudio();
const bgCount = syncBackgrounds();

if (trackCount === 0) console.log('  ⚠ public/audio/ 下没有 mp3，播放器将不显示');
if (bgCount === 0) console.log('  ⚠ public/images/backgrounds/ 下没有图片，背景只保留渐变');
