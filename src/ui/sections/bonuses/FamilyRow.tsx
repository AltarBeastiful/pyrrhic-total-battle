/**
 * One family of sources on the card (the canvas "Bonuses card redesign", 2026-09-17): its name and
 * its count in a label column on the left, its chips wrapping on the right — the shape the Troops
 * card already gives a group and its tier steppers, so the two cards read the same way down their
 * left edge. Below Material's compact window the label stands over the chips instead.
 *
 * It replaces the accordion the families used to sit in, one fold each with the captains alone
 * open (owner, 2026-09-17: "obvious ones, mostly always used, are hidden by default"). What is on
 * screen now is every family a player touches on an ordinary day; the two they set once — the
 * artifacts and the titles — keep a fold of their own at the foot of the list.
 */
import { Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import classes from './bonuses.module.css';

export interface FamilyRowProps {
  title: string;
  /** How many are on, of how many: "3/3", "2 of 8 sources on", "always on". */
  count: string;
  children: ReactNode;
}

export function FamilyRow({ title, count, children }: FamilyRowProps) {
  return (
    <div className={classes.family}>
      <Stack gap={2} className={classes.familyLabel}>
        <Text size="sm" fw={600}>
          {title}
        </Text>
        <Text size="xs" c="dimmed">
          {count}
        </Text>
      </Stack>
      <div className={classes.familyChips}>{children}</div>
    </div>
  );
}
