import { Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { siteConfig } from '@/config/site';

/** 首页正中央的一句口号 —— 舞台谢幕时的那种坚定感 */
export function Tagline() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="animate-rise flex flex-col items-center gap-4 text-center">
          <Sparkles size={20} className="text-sakura-400" aria-hidden />
          <p className="text-gradient text-3xl leading-tight font-extrabold tracking-wide text-balance sm:text-5xl">
            {siteConfig.homeSlogan}
          </p>
        </div>
      </Container>
    </section>
  );
}
