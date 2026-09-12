import type { ReactNode } from 'react';

import { Cluster, Grid, Page, Split, Stack } from '@/ui/layout';

import type { KitStory } from '../story';

/** A stand-in for real content, so the frame is the only thing on show. */
function Box({ children }: { children: ReactNode }) {
  return <div className="bg-surface border-line rounded-card border p-2 text-sm">{children}</div>;
}

function Heading({ children }: { children: ReactNode }) {
  return <p className="text-muted font-mono text-xs">{children}</p>;
}

const story: KitStory = {
  name: 'Layout',
  group: 'layout',
  render: () => (
    <Stack gap={6}>
      <Stack gap={2}>
        <Heading>Stack — gap 1 / 3 / 6</Heading>
        <Cluster align="start" gap={4}>
          {([1, 3, 6] as const).map((gap) => (
            <Stack key={gap} gap={gap} className="w-full">
              <Box>one</Box>
              <Box>two</Box>
              <Box>three</Box>
            </Stack>
          ))}
        </Cluster>
      </Stack>

      <Stack gap={2}>
        <Heading>Cluster — wraps, aligned centre, justified between</Heading>
        <Cluster>
          <Box>short</Box>
          <Box>a longer chip</Box>
          <Box>another</Box>
          <Box>and one more so the row has to wrap</Box>
        </Cluster>
        <Cluster justify="between">
          <Box>start</Box>
          <Box>end</Box>
        </Cluster>
      </Stack>

      <Stack gap={2}>
        <Heading>Grid — 2 columns, 4 from lg</Heading>
        <Grid cols={{ base: 2, lg: 4 }}>
          {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((label) => (
            <Box key={label}>{label}</Box>
          ))}
        </Grid>
      </Stack>

      <Stack gap={2}>
        <Heading>Page — gutters, measure, room under the floating button</Heading>
        <Page className="bg-sunken rounded-card">
          <Box>the page frame, filled</Box>
        </Page>
      </Stack>

      <Stack gap={2}>
        <Heading>Split — stacked on a phone, two scrolling columns from lg</Heading>
        <Split
          start={
            <Stack gap={2}>
              <Box>editor</Box>
              <Box>five twelfths</Box>
              <Box>scrolls on its own</Box>
            </Stack>
          }
          end={
            <Stack gap={2}>
              <Box>result</Box>
              <Box>seven twelfths</Box>
              <Box>scrolls on its own</Box>
            </Stack>
          }
        />
      </Stack>
    </Stack>
  ),
};

export default story;
