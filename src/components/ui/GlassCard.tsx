import { cn } from '@/lib/utils';

type Glow = 'pink' | 'lavender' | 'aqua' | 'none';

interface GlassCardProps extends React.HTMLAttributes<HTMLElement> {
  /** 渲染成什么标签，便于保持语义（文章卡用 article，列表项用 li） */
  as?: 'div' | 'article' | 'section' | 'li' | 'aside';
  /** 悬停时的辉光颜色 */
  glow?: Glow;
  /** 是否启用悬停上浮 + 辉光 */
  interactive?: boolean;
  /** 内边距 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

// pink/lavender/aqua 三个取值现在渲染效果相同 —— 都跟随全站可调的主题强调色，
// 保留三个名字只是为了不用改调用处的 glow="pink" 等既有写法
const glowMap: Record<Glow, string> = {
  pink: 'hover:shadow-glow-accent hover:border-accent',
  lavender: 'hover:shadow-glow-accent hover:border-accent',
  aqua: 'hover:shadow-glow-accent hover:border-accent',
  none: 'hover:shadow-lift',
};

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-7 sm:p-9',
} as const;

/**
 * 全站唯一的卡片基元：半透明毛玻璃 + 柔和描边 + 大圆角。
 * 文章卡、入口卡、歌曲卡、技能卡都由它派生，保证视觉语言统一。
 */
export function GlassCard({
  as: Tag = 'div',
  glow = 'pink',
  interactive = false,
  padding = 'md',
  className,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        'relative overflow-hidden rounded-card border border-white/70 bg-white/55',
        'shadow-soft backdrop-blur-xl transition-all duration-500 ease-idol',
        paddingMap[padding],
        interactive && 'hover:-translate-y-1',
        interactive && glowMap[glow],
        className,
      )}
      {...rest}
    >
      {/* 顶部高光：模拟玻璃边缘的反光 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
      />
      {children}
    </Tag>
  );
}
