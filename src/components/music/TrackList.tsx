'use client';

import { Pause, Play } from 'lucide-react';
import { copy } from '@/config/copy';
import { formatDuration } from '@/lib/music';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/providers/PlayerProvider';

interface TrackListProps {
  /** 选中一首后触发，浮动播放条用它在移动端自动收起列表 */
  onSelect?: () => void;
}

/** 歌单列表。点击任意一首即可播放/暂停 */
export function TrackList({ onSelect }: TrackListProps = {}) {
  const { tracks, currentIndex, isPlaying, playTrack } = usePlayer();

  return (
    <ul>
      {tracks.map((track, index) => {
        const isCurrent = index === currentIndex;
        const isCurrentPlaying = isCurrent && isPlaying;

        return (
          <li key={track.id}>
            <button
              type="button"
              onClick={() => {
                playTrack(index);
                onSelect?.();
              }}
              aria-label={
                isCurrentPlaying
                  ? copy.music.pauseTrackLabel(track.title)
                  : copy.music.playTrackLabel(track.title)
              }
              className={cn(
                'group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left',
                'transition-colors duration-300 ease-idol hover:bg-white/70',
                isCurrent && 'bg-white/75',
              )}
            >
              {/* 序号 / 播放按钮 / 播放中动画 */}
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                {isCurrentPlaying ? (
                  <Equalizer />
                ) : (
                  <>
                    <span
                      className={cn(
                        'text-sm tabular-nums transition-opacity group-hover:opacity-0',
                        isCurrent ? 'text-sakura-600' : 'text-ink-400',
                      )}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="absolute opacity-0 transition-opacity group-hover:opacity-100">
                      <Play size={15} className={isCurrent ? 'text-sakura-600' : 'text-ink-500'} />
                    </span>
                  </>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate text-sm font-semibold',
                    isCurrent ? 'text-sakura-600' : 'text-ink-800',
                  )}
                >
                  {track.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-400">
                  {[track.artist, track.album].filter(Boolean).join(' · ')}
                </span>
              </span>

              <span className="shrink-0 text-xs text-ink-400 tabular-nums">
                {track.duration ? formatDuration(track.duration) : '--:--'}
              </span>

              {isCurrentPlaying && (
                <span className="shrink-0 text-sakura-500">
                  <Pause size={14} />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** 播放中的三根跳动竖条（纯 CSS） */
function Equalizer() {
  return (
    <span aria-hidden className="flex items-end gap-0.5">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className="w-0.5 origin-bottom rounded-full bg-sakura-500 animate-eq"
          style={{ height: '14px', animationDelay: `${bar * 0.18}s` }}
        />
      ))}
    </span>
  );
}
