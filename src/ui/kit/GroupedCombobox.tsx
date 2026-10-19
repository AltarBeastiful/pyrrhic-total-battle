/**
 * The picker that adds something to a list (plan §3): "Hire mercenary…", the units a custom march
 * may borrow. A `Combobox` with a search field and tier-grouped options, and — the behaviour that
 * matters — it **stays open after a pick**, because TotalStack lets you hire five in a row and
 * closing after each one would cost four more taps.
 *
 * `Combobox.DropdownTarget` positions the dropdown but does not wire the keyboard contract that
 * `Combobox.Target` does, so Escape is handled here (investigation 0007).
 */
import { Box, Button, Combobox, Text, useCombobox } from '@mantine/core';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import classes from './kit.module.css';

export interface ComboboxOption {
  value: string;
  label: ReactNode;
  /** What the search matches on, when the label is not plain text. */
  searchText?: string;
  disabled?: boolean;
}

export interface ComboboxGroup {
  key: string;
  label: ReactNode;
  options: ComboboxOption[];
}

export interface GroupedComboboxProps {
  /** The trigger's text: "Hire mercenary…". */
  triggerLabel: string;
  /** The search field's accessible name and placeholder. */
  searchLabel: string;
  groups: ComboboxGroup[];
  onPick: (value: string) => void;
  /** A row of filters under the search field. */
  filters?: ReactNode;
  emptyMessage?: string;
  width?: number | string;
  disabled?: boolean;
  /**
   * Where the focus goes when Escape closes the list: the element returned, or the trigger when
   * this returns null or is not given.
   */
  escapeFocus?: () => HTMLElement | null;
}

function textOf(option: ComboboxOption): string {
  return option.searchText ?? (typeof option.label === 'string' ? option.label : option.value);
}

export function GroupedCombobox({
  triggerLabel,
  searchLabel,
  groups,
  onPick,
  filters,
  emptyMessage = 'Nothing matches',
  width = 220,
  disabled = false,
  escapeFocus,
}: GroupedComboboxProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');
  const combobox = useCombobox({
    // The search field takes the focus as the list opens (owner, 2026-09-18: "the hire a merc button
    // should focus the combobox input"): the trigger is pressed to type a name, and a second click to
    // reach the field was a tap for nothing. Mantine's `Combobox.Search` registers the field the store
    // focuses here.
    onDropdownOpen: () => {
      combobox.focusSearchInput();
    },
    onDropdownClose: () => {
      setQuery('');
      combobox.resetSelectedOption();
    },
  });

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        options: needle
          ? group.options.filter((option) => textOf(option).toLowerCase().includes(needle))
          : group.options,
      }))
      .filter((group) => group.options.length > 0);
  }, [groups, query]);

  // Every keystroke highlights the first match, so Enter hires it; Up and Down (Mantine's search
  // field) move from there. Runs after the list has re-rendered, which `selectFirstOption` reads.
  useEffect(() => {
    if (query.trim() === '') combobox.resetSelectedOption();
    else combobox.selectFirstOption();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the store object is new every render
  }, [query]);

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(value) => {
        onPick(value);
        // Deliberately left open, field emptied and focused: several hires in a row is the point.
        setQuery('');
        combobox.focusSearchInput();
      }}
    >
      <Combobox.DropdownTarget>
        <Button
          variant="default"
          w={width}
          ref={trigger}
          disabled={disabled}
          onClick={() => {
            combobox.toggleDropdown();
          }}
        >
          {triggerLabel}
        </Button>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Search
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
          }}
          placeholder={searchLabel}
          aria-label={searchLabel}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              combobox.closeDropdown();
              (escapeFocus?.() ?? trigger.current)?.focus();
            }
          }}
        />
        {filters !== undefined && <Box p={6}>{filters}</Box>}
        <Combobox.Options className={classes.comboboxOptions}>
          {matching.map((group) => (
            <Combobox.Group key={group.key} label={group.label}>
              {group.options.map((option) => (
                <Combobox.Option key={option.value} value={option.value} disabled={option.disabled ?? false}>
                  {option.label}
                </Combobox.Option>
              ))}
            </Combobox.Group>
          ))}
          {matching.length === 0 && (
            <Combobox.Empty>
              <Text size="xs">{emptyMessage}</Text>
            </Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
