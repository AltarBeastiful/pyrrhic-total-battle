/**
 * **The burn ceiling, inside the "Merc lost" figure** (`docs/plans/burn-ceiling.md` §3.2; owner, 2026-10-19:
 * *"blend it in where we need it, not taking more lines … a small help tooltip … no input when the ceiling is the
 * plan's one"*). The figure the ceiling caps is the one already on the recap, so the control is that figure:
 *
 *  - **No ceiling** (the plan's own burn): the figure is plain text with a quiet pencil — no field, no
 *    placeholder that moves with the plan. A press opens a small field, empty, and Enter (or leaving it) commits.
 *  - **A ceiling**: the figure carries `≤ N` and a mark that takes it off, which gives the plan's burn back.
 *
 * The sentence that used to sit under the field is the tooltip on the label's `?` (`MercLostLabel`), rule 15 and 26.
 */
import { ActionIcon, Group, NumberInput, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { CircleHelp, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { isCommitEnter } from '@/ui/kit';

import { amount } from './format';

/** What the label says about the ceiling, once, in our own words ("merc", never "hired"). */
const HELP = 'Press the figure to cap the mercs this march may lose. Left alone, it keeps the plan’s burn.';

/** "Merc lost", with the help mark after it where a ceiling can be set. */
export function MercLostLabel({ editable }: { editable: boolean }) {
  if (!editable) return 'Merc lost';
  return (
    <>
      Merc lost{' '}
      <Tooltip label={HELP} multiline maw={240} withinPortal withArrow events={{ hover: true, focus: true, touch: true }}>
        <Text span inherit c="dimmed" tabIndex={0} aria-label={HELP} style={{ cursor: 'help' }}>
          <CircleHelp size={11} style={{ verticalAlign: '-1px' }} aria-hidden />
        </Text>
      </Tooltip>
    </>
  );
}

export function MarchBurnFigure({
  lost,
  burn,
  ceiling,
  editable,
  onChange,
  children,
}: {
  /** The mercs the march loses, as the figure draws it. */
  lost: ReactNode;
  /** The same count, as a number: the cap is said again only when it is not the figure. */
  burn: number;
  /** The player's ceiling, `null` for the plan's burn. */
  ceiling: number | null;
  /** Where a ceiling can be set (a plan's march); elsewhere the figure is plain. */
  editable: boolean;
  onChange: (ceiling: number | null) => void;
  /** The ratio drawn after the figure ("· 1.2M a merc"). */
  children?: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<number | null>(null);

  const open = () => {
    setDraft(ceiling);
    setEditing(true);
  };
  const finish = (commit: boolean) => {
    setEditing(false);
    if (commit && draft !== ceiling) onChange(draft);
  };

  if (!editable) {
    return (
      <Group gap={6} wrap="nowrap" align="baseline">
        {lost}
        {children}
      </Group>
    );
  }

  if (editing) {
    return (
      <NumberInput
        size="xs"
        w={84}
        autoFocus
        data-autofocus
        min={0}
        allowDecimal={false}
        allowNegative={false}
        hideControls
        value={draft ?? ''}
        placeholder="Most"
        enterKeyHint="done"
        aria-label="Most mercs lost"
        onChange={(next) => {
          setDraft(next === '' ? null : Number(next));
        }}
        onBlur={() => {
          finish(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            finish(false);
          } else if (isCommitEnter(event)) {
            event.stopPropagation();
            finish(true);
          }
        }}
      />
    );
  }

  const capped = ceiling !== null;
  // The tag is dimmed while the march loses less than the limit: the cap is on, and not what limits the march.
  const slack = capped && ceiling !== burn;
  return (
    <Group gap={6} wrap="nowrap" align="baseline">
      <Tooltip
        label={capped ? `Limit ${amount(ceiling)} mercs${slack ? ', not reached' : ''}. Press to change.` : 'Cap the mercs lost'}
        withinPortal
        withArrow
      >
        {/* **The figure and its tag are one press** (owner, 2026-10-19): either opens the field. */}
        <UnstyledButton
          onClick={open}
          aria-label={`Merc lost${capped ? `, limit ${amount(ceiling)}` : ''}: press to set the most`}
          style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline', font: 'inherit' }}
        >
          <Text span inherit {...(capped ? { c: 'var(--mantine-color-brass-filled)' } : {})}>
            {lost}
          </Text>
          {capped ? (
            <Text
              span
              fz="0.625rem"
              fw={700}
              c="var(--mantine-color-brass-filled)"
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'var(--mantine-color-brass-light)',
                borderRadius: 3,
                padding: '1px 5px',
                opacity: slack ? 0.45 : 1,
              }}
            >
              max
            </Text>
          ) : (
            <Pencil size={11} aria-hidden style={{ opacity: 0.5 }} />
          )}
        </UnstyledButton>
      </Tooltip>
      {capped && (
        <ActionIcon
          variant="subtle"
          size="xs"
          color="gray"
          radius="xl"
          aria-label="Take the cap off: back to the plan’s burn"
          onClick={() => {
            onChange(null);
          }}
        >
          <X size={11} aria-hidden />
        </ActionIcon>
      )}
      {children}
    </Group>
  );
}
