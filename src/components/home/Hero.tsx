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
        <div className="flex items-center justify-center gap-6 sm:gap-10">
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
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-white shadow-glow-accent sm:h-40 sm:w-40">
              <Image
                src={profile.avatar}
                alt={copy.common.avatarAlt(siteConfig.author)}
                fill
                priority
                sizes="(max-width: 640px) 112px, 160px"
                className="object-cover"
              />
            </div>
          </div>

          {/* 名字 */}
          <h1
            className="animate-rise min-w-0 text-4xl font-extrabold tracking-tight text-gradient sm:text-6xl"
            style={{ animationDelay: '110ms' }}
          >
            {siteConfig.name}
          </h1>
        </div>
      </Container>
    </section>
  );
}
