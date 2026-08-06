import Link from 'next/link';
import { cn } from '@/lib/utils';

type Tone = 'pink' | 'lavender' | 'aqua' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  /** 传了 href 就渲染成链接 */
  href?: string;
  /** 选中态（筛选条使用） */
  active?: boolean;
  className?: string;
}

const toneMap: Record<Tone, string> = {
  pink: 'bg-sakura-100/80 text-sakura-700 border-sakura-200/70',
  lavender: 'bg-lavender-100/80 text-lavender-700 border-lavender-200/70',
  aqua: 'bg-aqua-100/80 text-aqua-700 border-aqua-200/70',
  neutral: 'bg-white/70 text-ink-600 border-white/80',
};

const activeMap: Record<Tone, string> = {
  pink: 'bg-sakura-500 text-white border-sakura-500 shadow-glow-accent',
  lavender: 'bg-lavender-500 text-white border-lavender-500 shadow-glow-accent',
  aqua: 'bg-aqua-500 text-white border-aqua-500 shadow-glow-accent',
  neutral: 'bg-ink-700 text-white border-ink-700',
};

/** 分类 / 标签的胶囊标签 */
export function Badge({ children, tone = 'pink', href, active = false, className }: BadgeProps) {
  const classes = cn(
    'inline-flex items-center gap-1 rounded-pill border px-3 py-1 text-xs font-medium',
    'backdrop-blur-sm transition-all duration-300 ease-idol',
    active ? activeMap[tone] : toneMap[tone],
    href && !active && 'hover:-translate-y-0.5 hover:bg-white/90',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <span className={classes}>{children}</span>;
}
