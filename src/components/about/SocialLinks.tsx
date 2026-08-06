import { Mail, X as XIcon } from 'lucide-react';
import { BilibiliMark, GithubMark } from '@/components/about/SocialIcons';
import { GlassCard } from '@/components/ui/GlassCard';
import type { SocialLink, SocialPlatform } from '@/config/site';

const iconMap: Record<SocialPlatform, (size: number) => React.ReactNode> = {
  bilibili: (size) => <BilibiliMark size={size} />,
  x: (size) => <XIcon size={size} />,
  github: (size) => <GithubMark size={size} />,
  email: (size) => <Mail size={size} />,
};

/** 关于页底部的社交链接。数据在 src/config/site.ts 的 social 数组里配置 */
export function SocialLinks({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;

  return (
    // 用 auto-fill 而不是写死 grid-cols-4：链接数量随便加减都不会错版。
    // 这里特意不用 auto-fit —— auto-fit 会把空轨道折叠掉，
    // 只配一个链接时那张卡会被拉满整行，很难看；auto-fill 保留轨道，卡片宽度始终一致
    <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4">
      {links.map((link, index) => (
        <a
          key={link.platform}
          href={link.href}
          target={link.href.startsWith('http') ? '_blank' : undefined}
          rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
          className="group"
        >
          <GlassCard
            interactive
            padding="md"
            className="animate-rise flex flex-col items-center gap-2.5 text-center"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-gradient text-accent-foreground shadow-glow-accent transition-transform duration-500 ease-idol group-hover:scale-110">
              {iconMap[link.platform](20)}
            </span>
            <span className="text-sm font-semibold text-ink-800">{link.label}</span>
          </GlassCard>
        </a>
      ))}
    </div>
  );
}
