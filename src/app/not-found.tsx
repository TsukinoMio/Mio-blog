import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { GlassCard } from '@/components/ui/GlassCard';
import { copy } from '@/config/copy';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center py-16">
      <Container size="narrow">
        <GlassCard padding="lg" className="animate-rise text-center">
          <p className="text-6xl font-extrabold text-gradient">{copy.notFound.code}</p>
          <h1 className="mt-4 text-xl font-bold text-ink-900">{copy.notFound.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            {copy.notFound.description}
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex rounded-pill bg-accent-gradient-r px-6 py-3 text-sm font-semibold text-accent-foreground shadow-glow-accent transition-transform duration-400 ease-idol hover:-translate-y-0.5"
          >
            {copy.notFound.cta}
          </Link>
        </GlassCard>
      </Container>
    </div>
  );
}
