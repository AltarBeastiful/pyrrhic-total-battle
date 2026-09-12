/**
 * The one action that follows the player down the page: fixed bottom-right, round, accent-filled.
 * Its four states are the whole vocabulary of "can I press this, and what is happening":
 *
 * - `ready`    accent fill, nothing else to say;
 * - `stale`    accent fill plus a dot — the setup changed since the last result;
 * - `running`  a spinner, and `aria-busy` on the region so assistive tech knows work is under way;
 * - `blocked`  neutral fill, `aria-disabled` (still focusable, so the reason can be read) and the
 *              `hint` replaces the label as the visible text: the button says *why* it is blocked.
 *
 * React Aria filters `aria-busy` off its `Button`, so the state lives on the fixed wrapper that
 * carries the position — which is also the element that changes while the march is computed.
 *
 * The offset from the corner is the `fab` spacing token, which already carries the safe-area inset;
 * no arbitrary `env()` value lives in this file.
 */
import type { ReactNode } from 'react';
import { Button as RACButton } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { Spinner } from './Button';
import { cn } from './cn';
import { ring, stateLayerOn } from './styles';

/** The extended FAB is a filled surface, so its state layer is the on-colour, pill-shaped like it. */
const filledLayer = cn(stateLayerOn, 'after:rounded-chip');

const fab = tv({
  slots: {
    anchor: 'fixed right-fab bottom-fab z-40',
    root: [
      'relative inline-flex items-center justify-center gap-2',
      'min-h-14 min-w-14 rounded-chip font-sans font-medium',
      'shadow-pop transition-colors motion-safe:duration-fast',
      ring,
    ],
    dot: 'absolute top-2 right-2 size-2 rounded-chip bg-accent-fg',
  },
  variants: {
    state: {
      ready: { root: cn('bg-accent text-accent-fg', filledLayer) },
      stale: { root: cn('bg-accent text-accent-fg', filledLayer) },
      running: { root: cn('bg-accent text-accent-fg', filledLayer) },
      blocked: { root: 'bg-raised text-muted cursor-not-allowed' },
    },
    showLabel: {
      true: { root: 'px-5' },
      false: { root: 'px-0' },
    },
  },
  defaultVariants: { state: 'ready', showLabel: true },
});

export interface FloatingActionProps {
  /** The action, in words: "Generate march". Always part of the accessible name. */
  label: string;
  state: 'ready' | 'stale' | 'running' | 'blocked';
  /** Why the action is blocked ("Add troops first"). Becomes the visible label when blocked. */
  hint?: string;
  /** The glyph; replaced by a spinner while running. */
  icon: ReactNode;
  onPress?: () => void;
  /** Hide the text label (glyph only) on narrow screens; the name stays on `aria-label`. */
  showLabel?: boolean;
  className?: string;
}

export function FloatingAction({
  label,
  state,
  hint,
  icon,
  onPress,
  showLabel = true,
  className,
}: FloatingActionProps) {
  const f = fab({ state, showLabel });
  const isBlocked = state === 'blocked';
  const visible = isBlocked && hint !== undefined ? hint : label;
  const name = isBlocked && hint !== undefined ? `${label}: ${hint}` : label;

  return (
    <div className={f.anchor()} data-state={state} aria-busy={state === 'running'}>
      <RACButton
        aria-label={name}
        aria-disabled={isBlocked}
        className={cn(f.root(), className)}
        {...(onPress === undefined || isBlocked ? {} : { onPress })}
      >
        {state === 'running' ? <Spinner /> : icon}
        <span className={showLabel ? 'truncate' : 'sr-only'}>{visible}</span>
        {state === 'stale' ? <span aria-hidden="true" className={f.dot()} /> : null}
      </RACButton>
    </div>
  );
}
