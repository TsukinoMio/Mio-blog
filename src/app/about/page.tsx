import type { Metadata } from 'next';
import Image from 'next/image';
import { SocialLinks } from '@/components/about/SocialLinks';
import { Container } from '@/components/ui/Container';
import { GlassCard } from '@/components/ui/GlassCard';
import { copy } from '@/config/copy';
import { siteConfig } from '@/config/site';
import { getProfile } from '@/lib/profile';

export const metadata: Metadata = {
  title: copy.about.metaTitle,
  description: copy.common.aboutDescription(siteConfig.author),
};

export default async function AboutPage() {
  const profile = await getProfile();

  return (
    <div className="py-14 sm:py-20">
      <Container>
        {/* 介绍 */}
        <GlassCard padding="lg" glow="pink" className="animate-rise">
          <div className="flex flex-col items-center gap-7 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-glow-accent">
              <Image
                src={profile.avatar}
                alt={copy.common.avatarAlt(siteConfig.author)}
                fill
                sizes="112px"
                priority
                className="object-cover"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                <span className="text-gradient">{siteConfig.name}</span>
              </h1>
              <p className="mt-2 text-sm font-medium text-lavender-600">{siteConfig.role}</p>

              <div className="mt-4 space-y-3">
                {profile.intro.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-ink-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 社交媒体 */}
        <section className="mt-12">
          <SectionTitle title={copy.about.socialTitle} subtitle={copy.about.socialSubtitle} />
          <SocialLinks links={[...siteConfig.social]} />
        </section>
      </Container>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">{title}</h2>
      <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>
    </div>
  );
}
