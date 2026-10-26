'use client';

import * as React from 'react';
import { getPresetById, type ExamProfile } from '@nexovexo/typing-engine';
import { pickPassage, type Category, type Difficulty, type Passage } from '@/lib/passages';
import { TestRunner } from '@/components/typing/test-runner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const DURATIONS = [1, 2, 5, 10] as const;
const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];
const TOPICS: { value: Category; label: string }[] = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'government', label: 'Government letters' },
  { value: 'office', label: 'Office correspondence' },
  { value: 'news', label: 'News' },
  { value: 'legal', label: 'Legal text' },
  { value: 'data-entry', label: 'Numbers & data entry' },
];

/** A relaxed practice profile derived from PPSC but untimed-friendly. */
function practiceProfile(): ExamProfile {
  const base = getPresetById('ppsc-en-clerk-v1')!;
  return {
    ...base,
    id: 'practice-free',
    name: 'Free Practice',
    approximate: false,
    block: { paste: true, copy: false, rightClick: false },
    pass: { minWpm: 0, minAccuracy: 0 },
  };
}

export function PracticeClient() {
  const [duration, setDuration] = React.useState<number>(2);
  const [difficulty, setDifficulty] = React.useState<Difficulty>('medium');
  const [topic, setTopic] = React.useState<Category>('mixed');
  const [passage, setPassage] = React.useState<Passage | null>(null);
  const profile = React.useMemo(practiceProfile, []);

  const start = () => {
    setPassage(pickPassage({ language: 'en', difficulty, category: topic }));
  };

  if (passage) {
    return (
      <div className="flex flex-col items-center gap-6">
        <Button variant="ghost" size="sm" onClick={() => setPassage(null)}>
          ← Change settings
        </Button>
        <TestRunner
          passage={passage}
          profile={profile}
          mode="practice"
          durationSec={duration * 60}
        />
      </div>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="space-y-6">
        <Field label="Duration">
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <Chip key={d} active={duration === d} onClick={() => setDuration(d)}>
                {d} min
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Difficulty">
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <Chip
                key={d.value}
                active={difficulty === d.value}
                onClick={() => setDifficulty(d.value)}
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Topic">
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <Chip
                key={t.value}
                active={topic === t.value}
                onClick={() => setTopic(t.value)}
              >
                {t.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Button size="lg" className="w-full" onClick={start}>
          Start practice
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-accent bg-accent text-accent-foreground'
          : 'border-border bg-transparent text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}
