import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { copy } from '@/config/copy';
import { siteConfig } from '@/config/site';
import { getProfile } from '@/lib/profile';

/** 首页 Hero：左边头像，右边名字 */
export async function Hero() {
  const profile = await getProfile();

  return (
    <section className="pt-16 pb-12 sm:pt-24 sm:pb-16">
      <Container>
        {/* 窄屏把间距收紧，给右边的名字腾地方 */}
        <div className="flex items-center justify-center gap-4 sm:gap-10">
          {/* 头像 */}
          <div
            className="animate-rise relative shrink-0"
            style={{ animationDelay: '0ms' }}
          >
            {/* 背后的柔光晕 */}
            <span
              aria-hidden
              className="absolute -inset-3 rounded-full bg-accent-gradient-soft blur-2xl animate-float"
            />
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white shadow-glow-accent sm:h-40 sm:w-40">
              <Image
                src={profile.avatar}
                alt={copy.common.avatarAlt(siteConfig.author)}
                fill
                priority
                sizes="(max-width: 640px) 96px, 160px"
                className="object-cover"
              />
            </div>
          </div>

          {/*
            名字。
            站点名往往是「ReikaAkane」这种不含空格的单词，**浏览器没有可换行的位置**，
            固定字号在窄屏上只会直接溢出到屏幕外（实测 360px 下文字宽 203px、
            容器只有 184px，最后一个字母被切掉）。
            所以窄屏用跟视口联动的字号：8vw 保证按比例缩，下限 1.75rem 防止小到看不清，
            上限 2.25rem 与原来的 text-4xl 一致，宽一点的屏幕观感不变。
            overflow-wrap:anywhere 是最后一道保险 —— 万一以后换了很长的站点名、
            或者某些设备字体特别宽，宁可折行也不要跑出屏幕。
          */}
          <h1
            className="animate-rise min-w-0 text-[clamp(1.75rem,8vw,2.25rem)] font-extrabold tracking-tight text-gradient [overflow-wrap:anywhere] sm:text-6xl"
            style={{ animationDelay: '110ms' }}
          >
            {siteConfig.name}
          </h1>
        </div>
      </Container>
    </section>
  );
}
