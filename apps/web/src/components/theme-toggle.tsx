'use client';

import { useTheme } from './theme-provider';
import { Button } from './ui/button';
import type { AccentName } from '@nexovexo/ui';

const accentList: { name: AccentName; label: string; swatch: string }[] = [
  { name: 'violet', label: 'Violet', swatch: 'hsl(262 83% 58%)' },
  { name: 'cyan', label: 'Cyan', swatch: 'hsl(189 94% 43%)' },
  { name: 'amber', label: 'Amber', swatch: 'hsl(38 92% 50%)' },
];

export function ThemeToggle() {
  const { theme, toggleTheme, accent, setAccent } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" role="group" aria-label="Accent color">
        {accentList.map((a) => (
          <button
            key={a.name}
            type="button"
            onClick={() => setAccent(a.name)}
            aria-label={`${a.label} accent`}
            aria-pressed={accent === a.name}
            className={`h-5 w-5 rounded-full border-2 transition-transform ${
              accent === a.name ? 'scale-110 border-foreground' : 'border-transparent'
            }`}
            style={{ backgroundColor: a.swatch }}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </Button>
    </div>
  );
}
