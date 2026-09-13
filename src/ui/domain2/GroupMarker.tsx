/**
 * The small coloured mark that opens a summary line and labels a group's row (design plan §7.1): a
 * 3 px bar in the group's ink, with the group's name beside it when there is room.
 *
 * The bar is decorative — colour alone never carries meaning — so when no visible label is asked
 * for, the group's name is still there for a screen reader.
 */
import { Box, Group, Text, VisuallyHidden } from '@mantine/core';

import classes from './domain2.module.css';
import { GROUP_LABEL, groupInk, type UnitGroup } from './unitGroup';

export interface GroupMarkerProps {
  group: UnitGroup;
  /** Written beside the bar. Left out, the group's name is still announced. */
  label?: string;
}

export function GroupMarker({ group, label }: GroupMarkerProps) {
  return (
    <Group gap="xs" wrap="nowrap" align="stretch" component="span">
      <Box className={classes.marker} bg={groupInk(group)} aria-hidden="true" />
      {label === undefined ? (
        <VisuallyHidden>{GROUP_LABEL[group]}</VisuallyHidden>
      ) : (
        <Text span size="sm" fw={500} truncate>
          {label}
        </Text>
      )}
    </Group>
  );
}
