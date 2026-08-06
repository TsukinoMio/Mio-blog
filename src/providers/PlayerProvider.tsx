'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { siteConfig } from '@/config/site';
import { resolveAudioSrc, type Track } from '@/lib/music';

/* ==========================================================================
   播放状态
   --------------------------------------------------------------------------
   <audio> 只有一个，挂在根布局里。App Router 导航时根布局不会卸载，
   所以切换页面音乐不会中断 —— 这正是常驻 FloatingPlayer 能成立的原因。
   ========================================================================== */

export type RepeatMode = 'off' | 'one' | 'all';

interface PlayerContextValue {
  tracks: Track[];
  currentTrack: Track | null;
  currentIndex: number;
  isPlaying: boolean;
  /** 已播放秒数 */
  progress: number;
  /** 总时长（秒），元数据加载后才准确 */
  duration: number;
  volume: number;
  muted: boolean;
  repeat: RepeatMode;
  playTrack: (index: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (seconds: number) => void;
  changeVolume: (value: number) => void;
  toggleMute: () => void;
  cycleRepeat: () => void;
  /**
   * 唱片封面累计"转了多少秒"。
   * 收起态的小圆钮和展开态的封面是两个不同的 DOM 节点，切换时新节点的 CSS 动画
   * 默认从 0° 重新开始，看起来就会突然跳一下。让它们都按这个累计时长设置
   * 负的 animation-delay，就能对齐到同一个角度 —— 暂停再播也接得上。
   */
  getRotationSeconds: () => number;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer 必须在 <PlayerProvider> 内部使用');
  return context;
}

export function PlayerProvider({
  tracks,
  children,
}: {
  tracks: Track[];
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  /** 换曲时是否自动播放：用户主动点歌为 true，首次恢复状态为 false */
  const autoPlayRef = useRef(false);
  /** 进页面的自动播放只做一次，防止 React 严格模式下重复触发 */
  const autoplayStartedRef = useRef(false);
  /** 唱片已经转过的秒数（不含当前这一段正在转的） */
  const rotationAccRef = useRef(0);
  /** 当前这一段是从什么时候开始转的；null 表示此刻没在转 */
  const rotationSinceRef = useRef<number | null>(null);
  /**
   * 我们"希望"处于播放状态。
   *
   * 音频托管在 Workers Assets 上，实测不支持 Range 请求、单曲 10~13 MB，
   * 慢网络下 play() 很可能在数据到位前就失败（AbortError，或被 load() 打断）。
   * 光靠"调了 play() 就当播了"会出现「加载完却停在暂停态、必须手点」。
   * 有了这个意图标记，就能在 canplay（数据够播了）时补一次。
   */
  const wantsPlayRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  // 显式标注 number：siteConfig 是 as const，不标注会被推断成 0.5 这个字面量类型
  const [volume, setVolume] = useState<number>(siteConfig.player.defaultVolume);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('all');
  /** 自动播放被浏览器拦下了，正等待用户的第一次交互来解锁 */
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const currentTrack = currentIndex >= 0 ? (tracks[currentIndex] ?? null) : null;

  /**
   * 全站统一的"开始播放"入口。
   *
   * 除了调用 play()，还会记下播放意图（wantsPlayRef），这样即使这一次因为
   * 数据没到位而失败，也能在 canplay 时补播。返回值表示这次是否真的播起来了。
   */
  const attemptPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    wantsPlayRef.current = true;
    try {
      await audio.play();
      return true;
    } catch (error: unknown) {
      // NotAllowedError = 浏览器的自动播放策略拦下来了（用户还没跟页面交互过），
      // 交给下面的手势解锁逻辑处理。
      // 其余错误（AbortError、数据还没到位等）保留播放意图，等 canplay 补一次。
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setAutoplayBlocked(true);
      }
      return false;
    }
  }, []);

  /** 统一的"暂停"入口。必须清掉播放意图，否则 canplay 会把它又拉起来 */
  const pauseAudio = useCallback(() => {
    wantsPlayRef.current = false;
    audioRef.current?.pause();
  }, []);

  /* 选中的歌变化时，换源并按需播放 */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentIndex < 0) return;

    const track = tracks[currentIndex];
    if (!track) return;

    audio.src = resolveAudioSrc(track.src);
    audio.load();

    if (autoPlayRef.current) void attemptPlay();
  }, [currentIndex, tracks, attemptPlay]);

  /* 进入页面时自动开一首 */
  useEffect(() => {
    if (autoplayStartedRef.current) return;
    if (!siteConfig.player.autoplay || tracks.length === 0) return;
    autoplayStartedRef.current = true;

    const { autoplayTrack } = siteConfig.player;
    const index =
      autoplayTrack === 'random'
        ? Math.floor(Math.random() * tracks.length)
        : Math.min(Math.max(autoplayTrack, 0), tracks.length - 1);

    autoPlayRef.current = true;
    // 随机选曲必须在挂载后才能算（服务端算会导致 hydration 不一致），
    // 所以只能在 effect 里设置状态，这是客户端专属逻辑的标准写法
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 见上
    setCurrentIndex(index);
  }, [tracks.length]);

  /* 自动播放被拦下时：等用户第一次交互，静默接上 */
  useEffect(() => {
    if (!autoplayBlocked) return;

    const events = ['pointerdown', 'keydown', 'touchstart'] as const;

    // 用函数声明而不是 const 箭头函数：两者互相引用，函数声明会提升，不会踩 TDZ
    function detach() {
      events.forEach((name) => document.removeEventListener(name, handleFirstGesture));
    }

    function handleFirstGesture(event: Event) {
      // 如果这第一次交互正好是在点播放器自己的按钮，就交给按钮去处理 ——
      // 否则这里先播、按钮的 click 再切一次，结果反而变成暂停
      const target = event.target;
      if (target instanceof Element && target.closest('[data-player-ui]')) {
        detach();
        setAutoplayBlocked(false);
        return;
      }

      // 【关键】只有真的播起来了才注销监听。
      // 旧实现在这里无条件注销 + 吞掉 play() 的失败，慢网络下第一次没成功
      // 就再也不会自动接上了 —— 表现为"加载完却停在暂停态，只能手点播放"。
      // 现在失败就保留监听，等用户下一次交互再试；同时 attemptPlay 记下了
      // 播放意图，数据到位时 canplay 那边也会补一次。
      void attemptPlay().then((started) => {
        if (!started) return;
        detach();
        setAutoplayBlocked(false);
      });
    }

    events.forEach((name) => document.addEventListener(name, handleFirstGesture));
    return detach;
  }, [autoplayBlocked, attemptPlay]);

  /* 音量 / 静音同步到 audio 元素 */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const playTrack = useCallback(
    (index: number) => {
      if (index < 0 || index >= tracks.length) return;
      autoPlayRef.current = true;

      if (index === currentIndex) {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) void attemptPlay();
        else pauseAudio();
        return;
      }

      setCurrentIndex(index);
    },
    [currentIndex, tracks.length, attemptPlay, pauseAudio],
  );

  const togglePlay = useCallback(() => {
    if (currentIndex < 0) {
      playTrack(0);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void attemptPlay();
    else pauseAudio();
  }, [currentIndex, playTrack, attemptPlay, pauseAudio]);

  const playNext = useCallback(() => {
    if (tracks.length === 0) return;
    autoPlayRef.current = true;
    setCurrentIndex((index) => (index + 1) % tracks.length);
  }, [tracks.length]);

  const playPrev = useCallback(() => {
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    // 播放超过 3 秒时，"上一首"先回到本曲开头（和常见播放器一致）
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    autoPlayRef.current = true;
    setCurrentIndex((index) => (index <= 0 ? tracks.length - 1 : index - 1));
  }, [tracks.length]);

  /* 播完一首之后的行为 */
  const handleEnded = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (repeat === 'one') {
      audio.currentTime = 0;
      void attemptPlay();
      return;
    }

    const isLast = currentIndex >= tracks.length - 1;
    if (repeat === 'off' && isLast) {
      // 自然播完且不再续播，清掉播放意图，免得 canplay 又把它拉起来
      wantsPlayRef.current = false;
      setIsPlaying(false);
      return;
    }

    playNext();
  }, [repeat, currentIndex, tracks.length, playNext, attemptPlay]);

  /* 绑定 audio 事件 */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);

    const onPlay = () => {
      setIsPlaying(true);
      // 开始新的一段旋转，计时起点记在这里
      if (rotationSinceRef.current === null) rotationSinceRef.current = performance.now();
    };

    const onPause = () => {
      setIsPlaying(false);
      // 把这一段转过的时间累加进去，下次接着这个角度转
      if (rotationSinceRef.current !== null) {
        rotationAccRef.current += (performance.now() - rotationSinceRef.current) / 1000;
        rotationSinceRef.current = null;
      }
    };

    /**
     * 慢网络补播：数据够播了，但我们本来想播、现在却停着，就补一次。
     *
     * 这是"加载完却不播"的第二道保险 —— 第一道是手势解锁失败后保留监听。
     * 这里直接用 audio.play() 而不是 attemptPlay()：意图已经是 true 了，
     * 不需要再设一遍；失败也没关系，下一次 canplay 还会再来。
     */
    const onCanPlay = () => {
      if (wantsPlayRef.current && audio.paused) void audio.play().catch(() => undefined);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [handleEnded]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const changeVolume = useCallback((value: number) => {
    setVolume(value);
    setMuted(value === 0);
  }, []);

  const toggleMute = useCallback(() => setMuted((value) => !value), []);

  const cycleRepeat = useCallback(
    () =>
      setRepeat((mode) => (mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off')),
    [],
  );

  const getRotationSeconds = useCallback(() => {
    const since = rotationSinceRef.current;
    return rotationAccRef.current + (since === null ? 0 : (performance.now() - since) / 1000);
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      tracks,
      currentTrack,
      currentIndex,
      isPlaying,
      progress,
      duration,
      volume,
      muted,
      repeat,
      playTrack,
      togglePlay,
      playNext,
      playPrev,
      seek,
      changeVolume,
      toggleMute,
      cycleRepeat,
      getRotationSeconds,
    }),
    [
      tracks,
      currentTrack,
      currentIndex,
      isPlaying,
      progress,
      duration,
      volume,
      muted,
      repeat,
      playTrack,
      togglePlay,
      playNext,
      playPrev,
      seek,
      changeVolume,
      toggleMute,
      cycleRepeat,
      getRotationSeconds,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* 全站唯一的播放器实例 */}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
}
