import Link from 'next/link';
import { siteConfig } from '@/config/site';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-white/60 bg-white/40 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-5 py-10 text-sm text-ink-500 sm:flex-row sm:justify-between sm:px-8">
        <p>
          © {year} {siteConfig.author} · {siteConfig.tagline}
        </p>

        {siteConfig.social.length > 0 && (
          <ul className="flex items-center gap-5">
            {siteConfig.social.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors duration-300 hover:text-sakura-600"
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
