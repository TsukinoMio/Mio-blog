import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  /** wide 用于列表页网格，narrow 用于文章正文（保证每行 35~40 字的舒适阅读宽度） */
  size?: 'narrow' | 'default' | 'wide';
}

const sizeMap = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-6xl',
} as const;

/** 统一页面横向留白与最大宽度 */
export function Container({ children, className, size = 'default' }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-5 sm:px-8', sizeMap[size], className)}>{children}</div>
  );
}
