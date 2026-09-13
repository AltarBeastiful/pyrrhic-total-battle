import { Button, Text } from '@mantine/core';

export interface MarchQuickSummaryProps {
  /** Opens the recap sheet (phones). */
  onOpen?: () => void;
}
/** One line: expected damage, silver, up to four tiny troop tiles, "+N"; text truncates. */
export function MarchQuickSummary(_props: MarchQuickSummaryProps) {
  return <Text size="sm">No march yet</Text>;
}

export interface MarchRecapProps {
  /** 'pane' = March pane header on desktop; 'sheet' = the phone recap sheet (adds the stacks). */
  variant: 'pane' | 'sheet';
}
/** The recap figures (expected, worst opening, hits, silver, gold, damage per silver) with deltas. */
export function MarchRecap(_props: MarchRecapProps) {
  return <Text size="sm">Nothing generated yet.</Text>;
}

export interface MarchGenerateButtonProps {
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}
/** Bound to the run store: ready / stale / running (cancel) / blocked (with the reason as tooltip). */
export function MarchGenerateButton(props: MarchGenerateButtonProps) {
  return (
    <Button size={props.size ?? 'md'} fullWidth={props.fullWidth ?? false}>
      Generate
    </Button>
  );
}

/** The whole March section (recap, tiles, counts, trade-off, details, saved marches). */
export function MarchSection() {
  return <Text>March</Text>;
}
