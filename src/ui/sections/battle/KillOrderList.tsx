/**
 * The order the stacks fall in, edited without dragging anything.
 *
 * Drag and drop is gone with the old kit (Mantine ships none, and we removed `dnd-kit` with it), and
 * nothing is lost: a row moves with its own two buttons, which is the same gesture for a mouse, a
 * thumb and a keyboard, and every move is announced. The position number is what makes the list
 * readable while it changes — "third to fall" is the thing the player is actually deciding.
 *
 * A button that has just carried its row to the top or the bottom is disabled by that very move, so
 * focus is handed to the row's other arrow rather than being dropped on the document.
 */
import { ActionIcon, Group, Paper, Stack, Text, VisuallyHidden } from '@mantine/core';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { UnitDef } from '@/data/types';
import { Glyph, groupInk, TierBadge, unitGroupOf } from '@/ui/domain';

import { POOL_LABELS } from './choices';

export interface KillOrderListProps {
  /** Unit ids, first to die first. */
  order: string[];
  /** Every unit in `order`, by id. */
  units: Map<string, UnitDef>;
  onChange: (order: string[]) => void;
}

export function KillOrderList({ order, units, onChange }: KillOrderListProps) {
  const [message, setMessage] = useState('');
  /** `<unit id>:up` / `<unit id>:down` → the button, so focus can follow a row that moved. */
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());
  /** Which of them to hand focus to once the moved list has been drawn; a ref, not state. */
  const pending = useRef<string | null>(null);

  useEffect(() => {
    if (pending.current === null) return;
    buttons.current.get(pending.current)?.focus();
    pending.current = null;
  }, [order]);

  const move = (index: number, delta: -1 | 1): void => {
    const id = order[index];
    const target = index + delta;
    if (id === undefined || target < 0 || target >= order.length) return;

    const next = [...order];
    next.splice(index, 1);
    next.splice(target, 0, id);
    onChange(next);

    const name = units.get(id)?.name ?? id;
    setMessage(`${name} is now ${String(target + 1)} of ${String(order.length)} to fall.`);
    const pressed = delta === -1 ? 'up' : 'down';
    const other = delta === -1 ? 'down' : 'up';
    const atEnd = delta === -1 ? target === 0 : target === order.length - 1;
    pending.current = `${id}:${atEnd ? other : pressed}`;
  };

  return (
    <>
      <Stack
        component="ul"
        gap={4}
        aria-label="Order of the fall"
        // The one shape Mantine has no prop for: a list whose rows are the surfaces themselves.
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
      >
        {order.map((id, index) => {
          const unit = units.get(id);
          if (unit === undefined) return null;
          return (
            <Paper key={id} component="li" withBorder p={6} radius="sm">
              <Group gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed" w={20} ta="right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {index + 1}
                </Text>
                <TierBadge tier={unit.tier} />
                <Text size="xs" fw={500} c={groupInk(unitGroupOf(unit))} truncate flex={1} miw={0}>
                  {unit.name}
                </Text>
                <Glyph kind={unit.pool} label={POOL_LABELS[unit.pool]} />
                <ActionIcon
                  variant="subtle"
                  color="slate"
                  size="md"
                  aria-label={`Move ${unit.name} up`}
                  disabled={index === 0}
                  ref={(node) => {
                    buttons.current.set(`${id}:up`, node);
                  }}
                  onClick={() => {
                    move(index, -1);
                  }}
                >
                  <ArrowUp size={14} aria-hidden />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="slate"
                  size="md"
                  aria-label={`Move ${unit.name} down`}
                  disabled={index === order.length - 1}
                  ref={(node) => {
                    buttons.current.set(`${id}:down`, node);
                  }}
                  onClick={() => {
                    move(index, 1);
                  }}
                >
                  <ArrowDown size={14} aria-hidden />
                </ActionIcon>
              </Group>
            </Paper>
          );
        })}
      </Stack>
      <VisuallyHidden role="status">{message}</VisuallyHidden>
    </>
  );
}
