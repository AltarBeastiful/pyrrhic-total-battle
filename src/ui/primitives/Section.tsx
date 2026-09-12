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

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn('border-line bg-surface scroll-mt-4 rounded-xl border', className)}
    >
      <div className="flex items-start gap-2 p-3 sm:p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="text-base font-semibold">
              {collapsible ? (
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={isOpen}
                  aria-controls={bodyId}
                  className="flex items-center gap-1 text-left"
                >
                  {title}
                  <span className="text-muted" aria-hidden="true">
                    {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </span>
                </button>
              ) : (
                title
              )}
            </h2>
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
