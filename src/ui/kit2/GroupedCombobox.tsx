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
import { useMemo, useState, type ReactNode } from 'react';

import classes from './kit2.module.css';

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
}: GroupedComboboxProps) {
  const [query, setQuery] = useState('');
  const combobox = useCombobox({
    onDropdownClose: () => {
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

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(value) => {
        onPick(value);
        // Deliberately left open: several hires in a row is the whole point.
      }}
    >
      <Combobox.DropdownTarget>
        <Button
          variant="default"
          w={width}
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
