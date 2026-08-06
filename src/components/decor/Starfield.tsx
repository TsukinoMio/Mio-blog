import { themeConfig } from '@/config/theme';
import { cn } from '@/lib/utils';

/**
 * 星光层 —— 纯 CSS 实现（不使用 Canvas / WebGL）。
 *
 * 星星位置由固定种子的伪随机数生成：服务端与客户端结果完全一致，
 * 因此这是一个 Server Component，不产生任何客户端 JS，也不会 hydration 报错。
 */

/** 线性同余生成器：同一个种子永远得到同一串数字 */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const STAR_COLORS = ['#ffffff', '#ffd0e4', '#e0d3ff', '#bfeaff'];

export function Starfield() {
  const random = createRandom(20260806);

  const stars = Array.from({ length: themeConfig.starCount }, (_, index) => ({
    key: index,
    top: random() * 100,
    left: random() * 100,
    size: 1.5 + random() * 2.5,
    delay: random() * 5,
    duration: 3 + random() * 4,
    color: STAR_COLORS[Math.floor(random() * STAR_COLORS.length)] ?? '#ffffff',
    // 移动端只保留一半星星，减轻低端机的合成压力
    mobileHidden: index % 2 === 1,
  }));

  return (
    <div aria-hidden className="absolute inset-0 animate-drift">
      {stars.map((star) => (
        <span
          key={star.key}
          className={cn('absolute rounded-full animate-twinkle', star.mobileHidden && 'max-sm:hidden')}
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            boxShadow: `0 0 ${star.size * 3}px ${star.color}`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
