import { themeConfig } from '@/config/theme';
import { cn } from '@/lib/utils';
import { OverlayGradient } from './OverlayGradient';
import { RandomBackgroundImage } from './RandomBackgroundImage';
import { Starfield } from './Starfield';

/**
 * 全站背景，共三层（自下而上）：
 *   1. 背景图片   —— 候选列表在 config/theme.ts 配置，每次进入页面随机选一张
 *   2. 渐变遮罩   —— 保证长文字页面在任何背景图下都可读；首页不叠加，见 OverlayGradient
 *   3. 光晕 + 星光 —— 氛围特效，纯 CSS
 *
 * 整层 pointer-events-none 且 aria-hidden，不干扰交互与读屏。
 */
export function Background() {
  const { background, effects } = themeConfig;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none inset-0 -z-10 overflow-hidden',
        background.fixed ? 'fixed' : 'absolute',
      )}
    >
      {/* 1. 背景图（随机） */}
      <RandomBackgroundImage />

      {/* 2. 渐变遮罩（首页跳过） */}
      <OverlayGradient overlay={background.overlay} />

      {/* 3a. 漂浮光晕：跟随主题强调色，白色主题下就是纯白光晕 */}
      {effects.glowOrbs && (
        <>
          <Orb className="-top-32 -left-24 h-[26rem] w-[26rem] bg-accent-1 opacity-45" delay="0s" />
          <Orb
            className="top-1/3 -right-32 h-[30rem] w-[30rem] bg-accent-2 opacity-40"
            delay="-3s"
          />
          <Orb
            className="-bottom-40 left-1/4 h-[24rem] w-[24rem] bg-accent-3 opacity-45"
            delay="-6s"
          />
        </>
      )}

      {/* 3b. 星光 */}
      {effects.starfield && <Starfield />}
    </div>
  );
}

function Orb({ className, delay }: { className: string; delay: string }) {
  return (
    <div
      className={cn('absolute rounded-full blur-3xl animate-float', className)}
      style={{ animationDelay: delay }}
    />
  );
}
