/**
 * A line that opens. The whole header row is the button, so it is easy to hit with a thumb, and the
 * `summary` stays inside that row: collapsed, the line still says what is in there ("Health +312 %
 * · Strength +198 %") instead of only "Bonuses".
 */
import type { ReactNode } from 'react';
import {
  Button as RACButton,
  Disclosure as RACDisclosure,
  DisclosurePanel,
  Heading,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { ChevronDownIcon } from '../icons';
import { cn } from './cn';
import { ring, stateLayer, tapTarget } from './styles';

const disclosure = tv({
  slots: {
    root: 'rounded-card bg-surface',
    heading: 'm-0',
    trigger: [
      'group flex w-full cursor-pointer items-center gap-3 rounded-card px-4 py-3 text-left',
      'font-sans text-base text-fg transition-colors motion-safe:duration-fast',
      stateLayer,
      'disabled:cursor-not-allowed disabled:opacity-50',
      tapTarget,
      ring,
    ],
    title: 'font-medium',
    summary: 'min-w-0 flex-1 truncate text-sm text-muted',
    chevron: 'shrink-0 transition-transform motion-safe:duration-fast group-aria-expanded:rotate-180',
    // React Aria renders the collapsed panel with `hidden="until-found"`, which hides the *contents*
    // but still lays the box out: padding and a border on the panel itself left an empty ruled band
    // under every closed card. They live on an inner wrapper instead, so closed means closed.
    panel: '',
    panelInner: 'border-t border-line px-4 py-4',
  },
});

export interface DisclosureProps {
  /** The name of the section. */
  title: ReactNode;
  /** What the section holds, in one line; stays visible when collapsed. */
  summary?: ReactNode;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
  isDisabled?: boolean;
  children: ReactNode;
  className?: string;
}

export function Disclosure({
  title,
  summary,
  defaultExpanded,
  isExpanded,
  onExpandedChange,
  isDisabled = false,
  children,
  className,
}: DisclosureProps) {
  const d = disclosure();
  return (
    <RACDisclosure
      isDisabled={isDisabled}
      className={cn(d.root(), className)}
      {...(defaultExpanded === undefined ? {} : { defaultExpanded })}
      {...(isExpanded === undefined ? {} : { isExpanded })}
      {...(onExpandedChange === undefined ? {} : { onExpandedChange })}
    >
      <Heading level={3} className={d.heading()}>
        <RACButton slot="trigger" className={d.trigger()}>
          <span className={d.title()}>{title}</span>
          {summary === undefined ? null : <span className={d.summary()}>{summary}</span>}
          <ChevronDownIcon className={d.chevron()} />
        </RACButton>
      </Heading>
      <DisclosurePanel className={d.panel()}>
        <div className={d.panelInner()}>{children}</div>
      </DisclosurePanel>
    </RACDisclosure>
  );
}
