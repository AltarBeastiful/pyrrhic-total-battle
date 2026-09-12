/**
 * The account-style menu: a trigger, a floating list, sections with titles, items that may carry a
 * glyph and a second line, and a segmented row for a small either/or choice (theme, for instance).
 *
 * `MenuSegment` is a `MenuSection` in single-selection mode rather than a bare row of buttons: that
 * keeps the choice inside the menu's collection, so arrow keys walk through it like every other
 * item and screen readers announce `menuitemradio` with the checked state.
 */
import type { ReactNode } from 'react';
import {
  Header,
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  MenuSection as RACMenuSection,
  MenuTrigger,
  Popover as RACPopover,
  Text,
  type Placement,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from './cn';
import { ring, stateLayer, tapTarget } from './styles';

const menu = tv({
  slots: {
    // A menu is one of the few things that floats: `raised` plus level-2 elevation, the medium
    // shape, 12 px of inner padding and 8 px items inside it.
    popover: [
      'min-w-48 max-w-80 overflow-auto rounded-card bg-raised p-3 shadow-pop',
      'motion-safe:transition-all motion-safe:duration-fast entering:opacity-0 exiting:opacity-0',
    ],
    list: 'flex max-h-96 flex-col gap-1 overflow-y-auto outline-none',
    section: 'mb-2 flex flex-col gap-1 last:mb-0',
    sectionTitle: 'px-2 pt-1 pb-1 font-sans text-xs font-semibold tracking-wide text-muted uppercase',
    separator: 'my-2 h-px w-full bg-line',
  },
});

const menuItem = tv({
  base: [
    'flex cursor-pointer items-center gap-3 rounded-control px-3 py-2 font-sans text-base',
    'transition-colors motion-safe:duration-fast',
    'focus:bg-fg/8 selected:bg-accent-soft',
    stateLayer,
    'disabled:cursor-not-allowed disabled:opacity-50',
    tapTarget,
    // The item's own focus mark is the `focus:` state layer above: React Aria drives a menu by
    // virtual focus, so `data-focus-visible` is only set when the menu was opened from the keyboard.
    ring,
  ],
  variants: {
    isDanger: { true: 'text-danger', false: 'text-fg' },
  },
  defaultVariants: { isDanger: false },
});

const segmentItem = tv({
  base: [
    'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-control border border-transparent',
    'px-3 py-2 font-sans text-sm text-fg transition-colors motion-safe:duration-fast',
    'focus:bg-fg/8',
    'selected:border-transparent selected:bg-accent-soft selected:text-fg',
    stateLayer,
    tapTarget,
    ring,
  ],
});

export interface MenuProps {
  /** The pressable that opens the menu — a kit `Button` or `IconButton`. */
  trigger: ReactNode;
  /** The accessible name of the list itself. */
  label: string;
  children: ReactNode;
  placement?: Placement;
  className?: string;
}

export function Menu({ trigger, label, children, placement = 'bottom end', className }: MenuProps) {
  const { popover, list } = menu();
  return (
    <MenuTrigger>
      {trigger}
      <RACPopover placement={placement} className={cn(popover(), className)}>
        <RACMenu aria-label={label} className={list()}>
          {children}
        </RACMenu>
      </RACPopover>
    </MenuTrigger>
  );
}

export interface MenuSectionProps {
  /** Shown above the group and used as the group's accessible name. */
  title?: string;
  children: ReactNode;
  className?: string;
}

export function MenuSection({ title, children, className }: MenuSectionProps) {
  const { section, sectionTitle } = menu();
  return (
    <RACMenuSection className={cn(section(), className)}>
      {title === undefined ? null : <Header className={sectionTitle()}>{title}</Header>}
      {children}
    </RACMenuSection>
  );
}

export interface MenuItemProps {
  /** Stable key for the item; required when the menu selects rather than acts. */
  id?: string;
  /** Decorative glyph on the leading edge. */
  icon?: ReactNode;
  /** A second, quieter line under the label. */
  description?: ReactNode;
  /** Paints the item in the danger tone (delete, reset). */
  isDanger?: boolean;
  isDisabled?: boolean;
  onAction?: () => void;
  /** Typeahead text; only needed when `children` is not a plain string. */
  textValue?: string;
  children: ReactNode;
  className?: string;
}

export function MenuItem({
  id,
  icon,
  description,
  isDanger = false,
  isDisabled = false,
  onAction,
  textValue,
  children,
  className,
}: MenuItemProps) {
  const text = textValue ?? (typeof children === 'string' ? children : undefined);
  return (
    <RACMenuItem
      isDisabled={isDisabled}
      className={cn(menuItem({ isDanger }), className)}
      {...(id === undefined ? {} : { id })}
      {...(text === undefined ? {} : { textValue: text })}
      {...(onAction === undefined ? {} : { onAction })}
    >
      {icon === undefined ? null : <span className="shrink-0">{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <Text slot="label" className="truncate">
          {children}
        </Text>
        {description === undefined ? null : (
          <Text slot="description" className="text-muted truncate text-sm">
            {description}
          </Text>
        )}
      </span>
    </RACMenuItem>
  );
}

export interface MenuSegmentOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface MenuSegmentProps {
  /** The name of the choice, shown above the row ("Theme"). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: MenuSegmentOption[];
  className?: string;
}

export function MenuSegment({ label, value, onChange, options, className }: MenuSegmentProps) {
  const { section, sectionTitle } = menu();
  return (
    <RACMenuSection
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        if (keys === 'all') return;
        const [first] = [...keys];
        if (typeof first === 'string') onChange(first);
      }}
      className={cn(section(), 'flex-row flex-wrap items-center gap-1', className)}
    >
      <Header className={cn(sectionTitle(), 'w-full')}>{label}</Header>
      {options.map((option) => (
        <RACMenuItem key={option.value} id={option.value} textValue={option.label} className={segmentItem()}>
          {option.icon === undefined ? null : <span className="shrink-0">{option.icon}</span>}
          {option.label}
        </RACMenuItem>
      ))}
    </RACMenuSection>
  );
}
