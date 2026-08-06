'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  ChevronUp,
  Disc3,
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TrackList } from '@/components/music/TrackList';
import { copy } from '@/config/copy';
import { useDiscSpin } from '@/hooks/useDiscSpin';
import { formatDuration } from '@/lib/music';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/providers/PlayerProvider';

/** 唱片旋转一圈的时长；两处封面共用，保证转速一致 */
const SPIN_CLASS = 'animate-[spin_9s_linear_infinite]';

/**
 * 常驻左下角的浮动播放器 —— 全站唯一的音乐入口。
 * 默认收起成一个小圆按钮，点一下才展开成完整的播放条。
 */
export function FloatingPlayer() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // 收起态和展开态各有一个封面，用同一套累计角度对齐，切换时不会跳
  const collapsedDiscRef = useDiscSpin<HTMLSpanElement>();
  const expandedDiscRef = useDiscSpin<HTMLSpanElement>();
  const {
    tracks,
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    muted,
    repeat,
    togglePlay,
    playNext,
    playPrev,
    seek,
    changeVolume,
    toggleMute,
    cycleRepeat,
  } = usePlayer();

  // 展开时，点击面板以外的任意空白处收起播放器
  useEffect(() => {
    if (!panelOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanelOpen(false);
        setListOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [panelOpen]);

  if (tracks.length === 0) return null;

  const total = duration || currentTrack?.duration || 0;
  const hasTrack = Boolean(currentTrack);

  const collapse = () => {
    setPanelOpen(false);
    setListOpen(false);
  };

  // 收起态：只有一个圆形按钮
  if (!panelOpen) {
    return (
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        aria-label={copy.music.expandPlayer}
        // 标记给 PlayerProvider 的"自动播放解锁"逻辑用：
        // 点在播放器自己身上的交互交给按钮处理，避免播了又被切成暂停
        data-player-ui
        className={cn(
          'animate-rise fixed bottom-4 left-4 z-40 h-14 w-14 overflow-hidden rounded-full',
          'bg-accent-gradient text-accent-foreground shadow-glow-accent',
          'transition-transform duration-300 ease-idol hover:scale-105 active:scale-95',
        )}
      >
        {/* 旋转放在内层：hover 的缩放和旋转都作用在 transform 上，同层会互相覆盖 */}
        <span ref={collapsedDiscRef} className={cn('absolute inset-0 flex items-center justify-center', SPIN_CLASS)}>
          <TrackDisc cover={currentTrack?.cover} size={24} holeClass="h-5 w-5" sizes="56px" />
        </span>
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      data-player-ui
      className="fixed bottom-4 left-4 z-40 w-[19rem] max-w-[calc(100vw-2rem)]"
    >
      {/* 展开的歌曲列表，浮在播放条上方 */}
      <div
        className={cn(
          'mb-2 overflow-hidden rounded-card border border-white/70 bg-white/85 shadow-lift backdrop-blur-xl transition-all duration-400 ease-idol',
          listOpen ? 'max-h-80 opacity-100' : 'pointer-events-none max-h-0 border-transparent opacity-0',
        )}
      >
        <div className="max-h-64 overflow-y-auto p-1.5">
          <TrackList onSelect={() => setListOpen(false)} />
        </div>
      </div>

      {/* 播放条本体 */}
      <div className="animate-rise overflow-hidden rounded-card border border-white/70 bg-white/80 shadow-lift backdrop-blur-xl">
        <div className="flex items-center gap-3 p-3">
          <button
            type="button"
            onClick={collapse}
            aria-label={copy.music.collapsePlayer}
            className={cn(
              'relative h-11 w-11 shrink-0 overflow-hidden rounded-full',
              'bg-accent-gradient text-accent-foreground shadow-glow-accent',
              'transition-transform duration-300 ease-idol hover:scale-105',
            )}
          >
            <span ref={expandedDiscRef} className={cn('absolute inset-0 flex items-center justify-center', SPIN_CLASS)}>
              <TrackDisc cover={currentTrack?.cover} size={20} holeClass="h-3.5 w-3.5" sizes="44px" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setListOpen((open) => !open)}
            className="min-w-0 flex-1 text-left"
          >
            <span className="block truncate text-sm font-semibold text-ink-800">
              {currentTrack?.title ?? copy.music.noTrackTitle}
            </span>
            <span className="block truncate text-xs text-ink-400">
              {currentTrack ? currentTrack.artist : copy.music.tracksAvailable(tracks.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setListOpen((open) => !open)}
            aria-label={listOpen ? copy.music.collapseList : copy.music.expandList}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:text-sakura-600"
          >
            {listOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {/* 进度 */}
        <div className="px-3">
          <RangeSlider
            value={hasTrack ? progress : 0}
            max={total || 1}
            disabled={!hasTrack}
            ariaLabel={copy.music.progressLabel}
            onChange={seek}
          />
          <div className="mb-1.5 flex justify-between text-[11px] text-ink-400 tabular-nums">
            <span>{formatDuration(progress)}</span>
            <span>{formatDuration(total)}</span>
          </div>
        </div>

        {/* 控制：上一首 · 播放 · 下一首 · 循环模式
            左边那个占位块和右边的循环按钮同宽，好让播放键正好落在整行正中间 */}
        <div className="flex items-center justify-center gap-2 px-3">
          <span aria-hidden className="h-8 w-8 shrink-0" />

          <IconButton label={copy.music.prevTrack} onClick={playPrev}>
            <SkipBack size={16} />
          </IconButton>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? copy.music.pause : copy.music.play}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-gradient text-accent-foreground shadow-glow-accent transition-transform duration-300 ease-idol hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
          </button>

          <IconButton label={copy.music.nextTrack} onClick={playNext}>
            <SkipForward size={16} />
          </IconButton>

          <IconButton
            label={
              repeat === 'one'
                ? copy.music.repeatOne
                : repeat === 'all'
                  ? copy.music.repeatAll
                  : copy.music.repeatOff
            }
            onClick={cycleRepeat}
            active={repeat !== 'off'}
          >
            {repeat === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
          </IconButton>
        </div>

        {/* 音量：放在播放条自己身上，不用先展开歌单才能调 */}
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-3">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? copy.music.unmute : copy.music.mute}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:text-sakura-600"
          >
            {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <RangeSlider
            value={muted ? 0 : volume}
            max={1}
            step={0.01}
            ariaLabel={copy.music.volumeLabel}
            onChange={changeVolume}
          />
        </div>
      </div>
    </div>
  );
}

/** 封面：有专辑图就显示图，没有就退回唱片图标 */
function TrackDisc({
  cover,
  size,
  holeClass,
  sizes,
}: {
  cover?: string;
  size: number;
  holeClass: string;
  sizes: string;
}) {
  if (cover) {
    return <Image src={cover} alt="" fill sizes={sizes} className="object-cover" />;
  }

  return (
    <>
      <Disc3 size={size} />
      <span
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85',
          holeClass,
        )}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function IconButton({
  children,
  label,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ease-idol',
        active ? 'text-sakura-600' : 'text-ink-600 hover:text-sakura-600',
      )}
    >
      {children}
    </button>
  );
}

/** 滑块：用原生 range 保证键盘可访问，已填充部分用渐变背景表现 */
function RangeSlider({
  value,
  max,
  step = 0.1,
  disabled = false,
  ariaLabel,
  onChange,
}: {
  value: number;
  max: number;
  step?: number;
  disabled?: boolean;
  ariaLabel: string;
  onChange: (value: number) => void;
}) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <input
      type="range"
      min={0}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(Number(event.target.value))}
      style={{
        background: `linear-gradient(to right, var(--accent-solid) ${percent}%, rgba(255,255,255,0.8) ${percent}%)`,
      }}
      className={cn(
        'h-1.5 w-full cursor-pointer appearance-none rounded-pill outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3',
        '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
        '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--accent-solid)] [&::-webkit-slider-thumb]:bg-white',
        '[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full',
        '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--accent-solid)] [&::-moz-range-thumb]:bg-white',
      )}
    />
  );
}
