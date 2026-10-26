import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { PracticeClient } from './practice-client';

export const metadata: Metadata = {
  title: 'Free Typing Practice',
  description:
    'Practice typing with configurable duration, difficulty and topic. Track your WPM and accuracy in real time.',
};

export default function PracticePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Free Practice
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose your settings and start typing. Your results are saved on this device.
        </p>
        <div className="mt-8">
          <PracticeClient />
        </div>
      </main>
    </>
  );
}
