import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from '../icons';
import { cn } from './cn';
import { IconButton } from './IconButton';
import { Popover } from './Popover';

export interface SectionProps {
  /** Anchor id; also the key the section registry uses. */
  id: string;
  title: string;
  /** The section's glyph, shown in a chip left of the title. Decorative. */
  icon?: ReactNode;
  /** One line under the title, always visible. */
  description?: ReactNode;
  /** Long-form help, shown in a popover behind the "?" button. */
  help?: ReactNode;
  /** Controls in the header, right of the title (a "Reset" button, a count). */
  actions?: ReactNode;
  /** Compact state shown in the header — most useful while the body is collapsed. */
  summary?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Controlled mode; pair with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  className?: string;
}

/** One page section: a titled card whose body can be collapsed, with a help slot in the header. */
export function Section({
  id,
  title,
  icon,
  description,
  help,
  actions,
  summary,
  collapsible = true,
  defaultOpen = true,
  open,
  onOpenChange,
  children,
  className,
}: SectionProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = open ?? uncontrolled;
  const bodyId = useId();
  const titleId = `${id}-title`;

  const toggle = (): void => {
    const next = !isOpen;
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  const heading = (
    <h2 id={titleId} className="font-display text-lg leading-tight font-semibold">
      {collapsible ? (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls={bodyId}
          className="tap group flex items-center gap-1.5 text-left"
        >
          {title}
          <span
            aria-hidden="true"
            className="text-muted group-hover:text-accent border-line bg-raised flex h-5 w-5 items-center justify-center rounded-full border text-[0.7rem] transition-colors"
          >
            {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </span>
        </button>
      ) : (
        title
      )}
    </h2>
  );

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(
        'border-line bg-surface shadow-card rounded-card scroll-mt-28 border',
        isOpen && 'ring-accent-line/40 ring-1',
        className,
      )}
    >
      <div className="flex items-start gap-3 p-3 sm:p-4">
        {icon !== undefined && (
          <span
            aria-hidden="true"
            className="border-accent-line bg-accent-soft text-accent mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {heading}
            {help !== undefined && (
              <Popover
                label={`About ${title}`}
                trigger={<IconButton label={`About ${title}`} icon={<InfoIcon />} />}
              >
                <div className="text-muted space-y-2 text-xs leading-relaxed">{help}</div>
              </Popover>
            )}
          </div>
          {description !== undefined && <p className="text-muted mt-1 text-xs">{description}</p>}
          {summary !== undefined && <div className="mt-1 text-xs">{summary}</div>}
        </div>
        {actions !== undefined && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      <div id={bodyId} hidden={!isOpen} className="px-3 pb-3 sm:px-4 sm:pb-4">
        {children}
      </div>
    </section>
  );
}
