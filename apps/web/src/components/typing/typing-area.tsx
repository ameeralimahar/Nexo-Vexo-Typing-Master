'use client';

import * as React from 'react';
import type { CharStatus, KeyEvent } from '@nexovexo/typing-engine';
import type { TypingSessionApi } from './use-typing-session';

export interface TypingAreaProps {
  session: TypingSessionApi;
  target: string;
  /** Mirror of the exam profile's input-blocking rules. */
  block?: { paste?: boolean; copy?: boolean; rightClick?: boolean };
  className?: string;
}

const STATUS_CLASS: Record<CharStatus, string> = {
  pending: 'text-type-pending',
  correct: 'text-type-correct',
  // Incorrect: color + underline so it's not distinguished by color alone (a11y).
  incorrect: 'text-type-incorrect underline decoration-2 underline-offset-2',
  corrected: 'text-type-correct/70',
};

/**
 * Exam-style copy-typing surface (matches real testing-service layout):
 *
 *   ┌─────────────────────────────────────────┐
 *   │  SOURCE TEXT  (read-only, shows progress)│  ← top box
 *   └─────────────────────────────────────────┘
 *   ┌─────────────────────────────────────────┐
 *   │  YOUR TYPING  (editable, caret here)     │  ← bottom box
 *   └─────────────────────────────────────────┘
 *
 * Zero-lag strategy is unchanged: the engine lives in a ref and is driven by
 * keystrokes imperatively. A requestAnimationFrame loop reads the engine
 * snapshot and patches ONLY the characters that changed — in BOTH boxes —
 * plus moves the caret in the lower box. React never re-renders per keystroke.
 */
export function TypingArea({ session, target, block, className }: TypingAreaProps) {
  const chars = React.useMemo(() => Array.from(target), [target]);

  // Top (source) box refs.
  const sourceRef = React.useRef<HTMLDivElement>(null);
  const sourceSpanRefs = React.useRef<Array<HTMLSpanElement | null>>([]);
  const sourceMarkerRef = React.useRef<HTMLSpanElement | null>(null);

  // Bottom (typed) box refs.
  const typedBoxRef = React.useRef<HTMLDivElement>(null);
  const typedSpanRefs = React.useRef<Array<HTMLSpanElement | null>>([]);
  const caretRef = React.useRef<HTMLSpanElement>(null);

  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const lastStatusRef = React.useRef<CharStatus[]>([]);
  const lastCursorRef = React.useRef<number>(-1);
  const rafRef = React.useRef<number | null>(null);
  const composingRef = React.useRef(false);

  const [focused, setFocused] = React.useState(false);

  // rAF render loop: patch only what changed in both boxes.
  React.useEffect(() => {
    const loop = () => {
      const snap = session.engine.snapshot();
      const status = snap.perCharStatus;
      const typed = snap.typed;

      for (let i = 0; i < chars.length; i++) {
        const prev = lastStatusRef.current[i];
        const next = status[i] ?? 'pending';
        if (prev !== next) {
          // Top box: highlight the source char with the status color.
          const srcEl = sourceSpanRefs.current[i];
          if (srcEl) srcEl.className = `source-char ${STATUS_CLASS[next]}`;

          // Bottom box: show the typed char with the same status color.
          const typedEl = typedSpanRefs.current[i];
          if (typedEl) {
            const ch = typed[i];
            // Render a real space (breakable) so lines wrap at word boundaries.
            typedEl.textContent = ch == null || ch === '' ? '' : ch;
            typedEl.className = `typed-char ${STATUS_CLASS[next]}`;
          }
          lastStatusRef.current[i] = next;
        }
      }

      // Move the caret (bottom box) + the position marker (top box).
      if (snap.cursor !== lastCursorRef.current) {
        positionAt(snap.cursor, typedSpanRefs.current, typedBoxRef.current, caretRef.current, chars.length);
        positionMarker(snap.cursor, sourceSpanRefs.current, sourceRef.current, sourceMarkerRef.current, chars.length);
        lastCursorRef.current = snap.cursor;
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [chars.length, session.engine]);

  // Reset local render caches when the engine resets (new session).
  React.useEffect(() => {
    if (!session.started && !session.finished) {
      lastStatusRef.current = [];
      lastCursorRef.current = -1;
      for (let i = 0; i < chars.length; i++) {
        const srcEl = sourceSpanRefs.current[i];
        if (srcEl) srcEl.className = `source-char ${STATUS_CLASS.pending}`;
        const typedEl = typedSpanRefs.current[i];
        if (typedEl) {
          typedEl.textContent = '';
          typedEl.className = `typed-char ${STATUS_CLASS.pending}`;
        }
      }
    }
  }, [session.started, session.finished, chars.length]);

  const now = React.useCallback(() => performance.now(), []);
  const rel = React.useCallback(() => {
    const start = session.getStartTime();
    return start == null ? 0 : Math.max(0, Math.round(now() - start));
  }, [session, now]);

  const emit = React.useCallback(
    (event: Omit<KeyEvent, 't'>) => {
      const started = session.getStartTime() != null;
      session.push({ ...event, t: started ? rel() : 0 } as KeyEvent);
    },
    [session, rel],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (session.finished) return;
    if (composingRef.current) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      emit({ kind: 'backspace', code: e.code });
      return;
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      emit({ kind: 'delete', code: e.code });
      return;
    }
    if (e.key === 'Tab') return;
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      emit({ kind: 'char', value: e.key, code: e.code });
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (block?.paste) {
      e.preventDefault();
      return;
    }
    const text = e.clipboardData.getData('text');
    if (text) emit({ kind: 'char', value: text });
    e.preventDefault();
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <div className={className} role="group" aria-label="Copy-typing test">
      {/* ── Top: source passage (read-only reference) ─────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Source text — type this
          </span>
          <span className="text-xs text-muted-foreground">Read only</span>
        </div>
        <div
          ref={sourceRef}
          className="copy-box relative max-h-72 select-none overflow-auto rounded-xl border border-border bg-muted/40 p-6 font-mono text-2xl leading-[2.6rem] tracking-normal md:text-[26px] md:leading-[2.9rem]"
          aria-hidden="true"
        >
          {/* Thin marker showing how far you've reached in the source. */}
          <span
            ref={sourceMarkerRef}
            className="pointer-events-none absolute left-0 top-0 w-[2px] rounded bg-type-caret/60 transition-transform duration-75 ease-out motion-reduce:transition-none"
            style={{ height: '1.5em' }}
          />
          {chars.map((ch, i) => (
            <span
              key={i}
              ref={(el) => {
                sourceSpanRefs.current[i] = el;
              }}
              className={`source-char ${STATUS_CLASS.pending}`}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>

      {/* ── Bottom: your typing (editable) ────────────────────────── */}
      <div className="mt-5" onClick={focusInput}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your typing
          </span>
          {!focused && !session.finished && (
            <span className="text-xs text-accent">Click here to start</span>
          )}
        </div>
        <div
          ref={typedBoxRef}
          className={`copy-box relative max-h-72 min-h-48 cursor-text overflow-auto rounded-xl border-2 bg-card p-6 font-mono text-2xl leading-[2.6rem] tracking-normal transition-colors md:text-[26px] md:leading-[2.9rem] ${
            focused ? 'border-accent' : 'border-border'
          }`}
        >
          {/* Caret for the typed box. */}
          <span
            ref={caretRef}
            aria-hidden="true"
            className={`pointer-events-none absolute left-0 top-0 w-[2px] rounded bg-type-caret transition-transform duration-75 ease-out motion-reduce:transition-none ${
              focused ? 'animate-caret-blink' : 'opacity-0'
            }`}
            style={{ height: '1.5em' }}
          />
          {/* One slot per source char; filled imperatively as you type. */}
          {chars.map((_, i) => (
            <span
              key={i}
              ref={(el) => {
                typedSpanRefs.current[i] = el;
              }}
              className={`typed-char ${STATUS_CLASS.pending}`}
            />
          ))}
        </div>
      </div>

      {/* Hidden capture field — keeps the engine out of React's render path. */}
      <textarea
        ref={inputRef}
        className="sr-only"
        aria-label="Type the source text here"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onCopy={(e) => block?.copy && e.preventDefault()}
        onContextMenu={(e) => block?.rightClick && e.preventDefault()}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          composingRef.current = false;
          if (e.data) emit({ kind: 'composition', value: e.data });
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

/** Position the caret in the typed box at the given cursor index. */
function positionAt(
  cursor: number,
  spans: Array<HTMLSpanElement | null>,
  container: HTMLDivElement | null,
  caret: HTMLSpanElement | null,
  total: number,
) {
  if (!caret || !container) return;
  const idx = Math.min(cursor, total - 1);
  const anchor = spans[idx];
  if (!anchor) return;
  const cRect = container.getBoundingClientRect();
  const aRect = anchor.getBoundingClientRect();
  const atEnd = cursor >= total;
  const x = aRect.left - cRect.left + container.scrollLeft + (atEnd ? aRect.width : 0);
  const y = aRect.top - cRect.top + container.scrollTop;
  caret.style.transform = `translate(${x}px, ${y}px)`;
  // Keep the caret line visible as the typed text grows.
  anchor.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/** Position the progress marker in the source box and keep it in view. */
function positionMarker(
  cursor: number,
  spans: Array<HTMLSpanElement | null>,
  container: HTMLDivElement | null,
  marker: HTMLSpanElement | null,
  total: number,
) {
  if (!marker || !container) return;
  const idx = Math.min(cursor, total - 1);
  const anchor = spans[idx];
  if (!anchor) return;
  const cRect = container.getBoundingClientRect();
  const aRect = anchor.getBoundingClientRect();
  const atEnd = cursor >= total;
  const x = aRect.left - cRect.left + container.scrollLeft + (atEnd ? aRect.width : 0);
  const y = aRect.top - cRect.top + container.scrollTop;
  marker.style.transform = `translate(${x}px, ${y}px)`;
  // Auto-scroll the source box to keep the current line visible.
  anchor.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
