/**
 * Thin DOM adapter. Wires browser input events to engine KeyEvents.
 * Kept separate from core so the engine stays testable in plain Node.
 *
 * Usage (React, imperative — keeps engine out of the render path):
 *   const detach = createDomSource(hiddenInputEl, (ev) => engine.apply(ev), {
 *     startTime: performance.now(),
 *     blockPaste: profile.block.paste,
 *   });
 */
import type { KeyEvent } from '../types.js';

export interface DomSourceOptions {
  /** Reference time (performance.now()) marking t=0 for this session. */
  startTime: number;
  blockPaste?: boolean;
  blockCopy?: boolean;
  blockRightClick?: boolean;
  /** Clock source; defaults to performance.now for high-res timing. */
  now?: () => number;
}

export type DetachFn = () => void;

/**
 * Attach listeners to an input/textarea element. Returns a detach function.
 * Emits normalized KeyEvent objects to `onEvent`.
 */
export function createDomSource(
  el: HTMLElement,
  onEvent: (event: KeyEvent) => void,
  options: DomSourceOptions,
): DetachFn {
  const now = options.now ?? (() => performance.now());
  const rel = () => Math.max(0, Math.round(now() - options.startTime));

  let composing = false;

  const onKeyDown = (e: KeyboardEvent) => {
    if (composing) return; // let composition events handle IME text
    if (e.key === 'Backspace') {
      e.preventDefault();
      onEvent({ t: rel(), kind: 'backspace', code: e.code });
      return;
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      onEvent({ t: rel(), kind: 'delete', code: e.code });
      return;
    }
    // Single printable character (ignore modifier combos).
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      onEvent({ t: rel(), kind: 'char', value: e.key, code: e.code });
      return;
    }
    // Everything else recorded as a control event (for the log only).
    onEvent({ t: rel(), kind: 'control', value: e.key, code: e.code });
  };

  const onCompositionStart = () => {
    composing = true;
  };
  const onCompositionEnd = (e: CompositionEvent) => {
    composing = false;
    if (e.data) onEvent({ t: rel(), kind: 'composition', value: e.data });
  };

  const onPaste = (e: ClipboardEvent) => {
    if (options.blockPaste) {
      e.preventDefault();
      return;
    }
    const text = e.clipboardData?.getData('text') ?? '';
    if (text) onEvent({ t: rel(), kind: 'char', value: text });
  };

  const onCopy = (e: ClipboardEvent) => {
    if (options.blockCopy) e.preventDefault();
  };

  const onContextMenu = (e: MouseEvent) => {
    if (options.blockRightClick) e.preventDefault();
  };

  const onDrop = (e: DragEvent) => e.preventDefault();

  el.addEventListener('keydown', onKeyDown);
  el.addEventListener('compositionstart', onCompositionStart);
  el.addEventListener('compositionend', onCompositionEnd);
  el.addEventListener('paste', onPaste);
  el.addEventListener('copy', onCopy);
  el.addEventListener('contextmenu', onContextMenu);
  el.addEventListener('drop', onDrop);

  return () => {
    el.removeEventListener('keydown', onKeyDown);
    el.removeEventListener('compositionstart', onCompositionStart);
    el.removeEventListener('compositionend', onCompositionEnd);
    el.removeEventListener('paste', onPaste);
    el.removeEventListener('copy', onCopy);
    el.removeEventListener('contextmenu', onContextMenu);
    el.removeEventListener('drop', onDrop);
  };
}
