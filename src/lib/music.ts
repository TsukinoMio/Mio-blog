import playlistData from '@/data/music.json';

/* ==========================================================================
   音乐数据层
   与 posts.ts 同样的思路：页面只调用这里的函数，不直接 import JSON。
   将来歌单改由接口下发时，只换这个文件的实现即可。
   ========================================================================== */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  /**
   * 音频地址。两种写法都支持：
   *   '/audio/song.mp3'                    —— 本地文件（放在 public/audio/）
   *   'https://cdn.example.com/song.mp3'   —— 外链 / CDN
   * 本地路径还可以通过环境变量整体切到 CDN，见 resolveAudioSrc。
   */
  src: string;
  cover?: string;
  /** 秒。可留空，播放器会在加载元数据后自动补上 */
  duration?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
}

/**
 * 把 track.src 解析成最终可播放的地址。
 *
 * 已经是完整 URL 的原样返回；相对路径则在设置了
 * NEXT_PUBLIC_AUDIO_BASE_URL 时自动加上前缀。
 * 这样以后音频搬去 CDN / 对象存储，只改一个环境变量，不用动 music.json。
 */
export function resolveAudioSrc(src: string): string {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src;

  const base = process.env.NEXT_PUBLIC_AUDIO_BASE_URL;
  if (!base) return src;

  return `${base.replace(/\/$/, '')}${src.startsWith('/') ? '' : '/'}${src}`;
}

/** 取默认歌单 */
export async function getPlaylist(): Promise<Playlist> {
  return playlistData as Playlist;
}

/** 秒 -> 3:07 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}
