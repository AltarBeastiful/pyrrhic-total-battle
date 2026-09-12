/**
 * One row picked out of a long, grouped list (design plan §7.2): type a few letters to narrow it,
 * or open it and walk the groups. It is what replaces a search field plus a wall of filter chips —
 * a player knows the name, and the groups are there for the times they only know the tier.
 *
 * Two things make it a *picker* rather than a value field:
 *
 * - Nothing is ever "the chosen value": the selection is held at `null`, so the field goes back to
 *   empty after every pick and the list stays open for the next one. Hiring six mercenaries is six
 *   presses, not six open-pick-reopen rounds.
 * - A word that matches nothing is not a value either (`allowsCustomValue={false}`): the list says
 *   so through `emptyState` and the field keeps what was typed.
 *
 * Filtering is a plain case-insensitive "contains" over each item's `label`, and a group whose
 * items have all gone is not drawn, so typing walks every group at once. It is done here rather
 * than by React Aria — passing `items` turns its own collection filter off — because that filter
 * rebuilds section nodes as plain copies, and React 19's development-time prop diffing then reads a
 * getter on the originals that throws ("childNodes is not supported"), which breaks the field in
 * `pnpm dev` while leaving the build untouched.
 */
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Button,
  ComboBox,
  Group,
  Header,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Popover,
  Text,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { ChevronDownIcon } from '../icons';
import { cn } from './cn';
import {
  fieldBox,
  fieldButton,
  fieldDescription,
  fieldHeight,
  fieldInput,
  fieldLabel,
  fieldRoot,
  ringWithin,
} from './fieldStyles';
import { tapTarget } from './styles';

export interface ComboboxItem {
  /** What `onSelect` is given back. */
  id: string;
  /** The row's accessible name, and the text typing filters on. */
  label: string;
  /** What the row draws instead of its plain label (a tile, a badge). Never anything focusable. */
  render?: () => ReactNode;
}

export interface ComboboxSection {
  id: string;
  /** The heading over the group ("Tier VI"). */
  title: string;
  /** A class name colouring that heading — the tier's ink. */
  tone?: string;
  items: ComboboxItem[];
}

export interface ComboboxProps {
  /** The visible name of what is being picked ("Add a mercenary"). */
  label: string;
  /** An example of what to type. Never a substitute for the label. */
  placeholder?: string;
  /** The groups, in the order they are shown; a group with no items is not drawn. */
  sections: ComboboxSection[];
  /** One press, one pick: the list stays open and the field empties itself. */
  onSelect: (id: string) => void;
  /** What the open list says when nothing matches what was typed. */
  emptyState?: ReactNode;
  /** One quiet line under the field. */
  description?: string;
  isDisabled?: boolean;
  className?: string;
}

const comboboxStyles = tv({
  slots: {
    root: fieldRoot,
    label: fieldLabel,
    box: cn(fieldBox, fieldHeight, 'gap-2 px-2', ringWithin),
    input: cn(fieldInput, 'text-base sm:text-sm'),
    trigger: cn(fieldButton, 'size-8'),
    description: fieldDescription,
    popover: 'rounded-card bg-raised shadow-pop w-(--trigger-width) p-2',
    listbox: 'flex max-h-80 flex-col gap-1 overflow-auto outline-none',
    section: 'flex flex-col',
    header: 'text-muted px-2 pt-2 pb-1 text-xs font-medium',
    item: cn(
      'group rounded-control text-fg flex cursor-pointer items-center gap-2 px-2 py-1 outline-none',
      'focus:bg-fg/8 hover:bg-fg/8 pressed:bg-fg/10',
      'disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors',
      tapTarget,
    ),
    empty: 'text-muted px-2 py-3 text-sm',
  },
});

/**
 * A grouped picker. `Enter` and a press do the same thing: report the row and clear the field,
 * leaving the list open and filtered by nothing, ready for the next pick.
 */
export function Combobox({
  label,
  placeholder,
  sections,
  onSelect,
  emptyState,
  description,
  isDisabled = false,
  className,
}: ComboboxProps) {
  const [query, setQuery] = useState('');
  const styles = comboboxStyles();

  const shown = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (needle === '') return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLocaleLowerCase().includes(needle)),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, query]);

  return (
    <ComboBox
      className={cn(styles.root(), className)}
      inputValue={query}
      onInputChange={setQuery}
      // Held at `null` on purpose: a pick is an action, not a value, so React Aria never closes the
      // list behind it and never writes the picked name into the field.
      value={null}
      onChange={(key) => {
        if (key === null) return;
        setQuery('');
        onSelect(String(key));
      }}
      allowsCustomValue={false}
      allowsEmptyCollection
      menuTrigger="focus"
      // Declaring the items as controlled is what tells React Aria the list is already filtered.
      items={shown}
      isDisabled={isDisabled}
    >
      <Label className={styles.label()}>{label}</Label>
      <Group className={styles.box()}>
        <Input className={styles.input()} {...(placeholder === undefined ? {} : { placeholder })} />
        <Button className={styles.trigger()}>
          <ChevronDownIcon />
        </Button>
      </Group>
      {description !== undefined && (
        <Text slot="description" className={styles.description()}>
          {description}
        </Text>
      )}
      <Popover className={styles.popover()}>
        <ListBox
          className={styles.listbox()}
          {...(emptyState === undefined
            ? {}
            : { renderEmptyState: () => <p className={styles.empty()}>{emptyState}</p> })}
        >
          {shown.map((section) => (
            <ListBoxSection key={section.id} id={section.id} className={styles.section()}>
              <Header className={cn(styles.header(), section.tone)}>{section.title}</Header>
              {section.items.map((item) => (
                // `aria-label` as well as `textValue`: a drawn row is a tile, a name and a badge,
                // and stringing those together is not the name the row means.
                <ListBoxItem
                  key={item.id}
                  id={item.id}
                  textValue={item.label}
                  aria-label={item.label}
                  className={styles.item()}
                >
                  {item.render === undefined ? item.label : item.render()}
                </ListBoxItem>
              ))}
            </ListBoxSection>
          ))}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
