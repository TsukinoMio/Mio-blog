import { Hero } from '@/components/home/Hero';
import { LatestPosts } from '@/components/home/LatestPosts';
import { Tagline } from '@/components/home/Tagline';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Tagline />
      <LatestPosts />
    </>
  );
}
