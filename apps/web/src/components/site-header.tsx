import Link from 'next/link';
import { Wordmark } from '@nexovexo/ui';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="NEXO VEXO Typing Master home">
          <Wordmark withTagline={false} className="h-7 w-auto" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/practice" className="text-muted-foreground hover:text-foreground">
            Free Practice
          </Link>
          <Link href="/simulation" className="text-muted-foreground hover:text-foreground">
            Exam Simulation
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
            Privacy
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
