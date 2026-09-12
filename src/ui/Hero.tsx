import type { ReactNode } from 'react';

import { cn } from './primitives/cn';

/**
 * The flat-profile drawing: eight stacks whose tops form an almost level line, facing the epic
 * monster they were sized against. That level line *is* the idea the whole app is built on — the
 * enemy always hits the biggest stack, so the flatter the profile, the longer the march survives.
 *
 * Hand-drawn here as inline SVG (ADR-0002: no asset fetch, no illustration dependency), coloured by
 * the palette tokens so it follows the theme, and purely decorative.
 */
function MarchIllustration({ className }: { className?: string }) {
  // Eight stacks, tops within 7 px of each other: a flat profile, not a staircase.
  const stacks = [58, 57, 56, 55, 54, 53, 52, 51];

  return (
    <svg
      viewBox="0 0 360 120"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* The epic monster: a hunched silhouette facing the march. */}
      <g fill="var(--pyr-accent)" stroke="var(--pyr-accent)" strokeLinejoin="round" strokeWidth="2">
        <path
          d="M348 104c0-30-10-51-32-60-12-5-24-4-34 2l-10 6c-16 4-26 14-28 28l-2 24z"
          fillOpacity="0.16"
          strokeOpacity="0.5"
        />
        <path d="M286 46l-8-18 16 9z" fillOpacity="0.3" strokeOpacity="0.5" />
        <path d="M304 44l3-19 11 14z" fillOpacity="0.3" strokeOpacity="0.5" />
        <path
          d="M244 90l5-6 5 6 5-6 5 6"
          fill="none"
          strokeOpacity="0.45"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <circle cx="262" cy="74" r="3" stroke="none" fillOpacity="0.75" />
        <circle cx="280" cy="70" r="3" stroke="none" fillOpacity="0.75" />
      </g>

      {/* The march: one bar per stack, the front rank under the banner. */}
      {stacks.map((height, index) => {
        const x = 16 + index * 26;
        return (
          <rect
            key={x}
            x={x}
            y={104 - height}
            width="19"
            height={height}
            rx="4"
            fill="var(--pyr-accent-soft)"
            fillOpacity={index === 0 ? '1' : '0.75'}
            stroke="var(--pyr-accent-line)"
            strokeWidth="2"
          />
        );
      })}
      <g stroke="var(--pyr-accent)" strokeOpacity="0.75" strokeWidth="2" strokeLinejoin="round">
        <path d="M25.5 46V21" strokeLinecap="round" />
        <path d="M25.5 23h21l-4.5 6 4.5 6h-21z" fill="var(--pyr-accent)" fillOpacity="0.75" />
      </g>

      {/* The level line the stacker aims for, and the ground both sides stand on. */}
      <path
        d="M10 45h222"
        stroke="var(--pyr-info)"
        strokeOpacity="0.65"
        strokeWidth="2"
        strokeDasharray="5 6"
        strokeLinecap="round"
      />
      <path d="M8 105h344" stroke="var(--pyr-line)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export interface HeroProps {
  /** Controls that belong with the title (theme, About); they sit right of it on a wide screen. */
  actions?: ReactNode;
  className?: string;
}

/** The page's opening card: what this is, who it is for, and the promise that it stays offline. */
export function Hero({ actions, className }: HeroProps) {
  return (
    <div className={cn('mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-5', className)}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-accent text-[0.68rem] font-semibold tracking-[0.18em] uppercase">Total Battle</p>
          <h1 className="font-display mt-0.5 text-3xl leading-none font-semibold tracking-tight sm:text-4xl">
            Pyrrhic
          </h1>
          <p className="text-muted mt-2 max-w-sm text-sm leading-relaxed">
            Plan your epic-monster march. Free, offline, nothing leaves your browser.
          </p>
        </div>

        {/* Last on a phone, between the title and the controls on a wide screen. */}
        <MarchIllustration className="order-last h-[84px] w-full sm:order-none sm:h-[104px] sm:w-[300px] sm:shrink-0" />

        {actions !== undefined && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
