/**
 * The kit page (`/#kit`, dev only): every composite of `src/ui/kit` and `src/ui/domain`, rendered
 * once in whichever colour scheme the page is set to. They cannot be shown light and dark side by
 * side — Mantine's scheme is one attribute on `<html>`, so the toggle in the header is how both are
 * seen.
 *
 * This is the surface the owner reviews a phase on and the surface `pnpm test:visual` screenshots
 * and runs axe against.
 */
import { ActionIcon, Group, Stack, Text, Title, useMantineColorScheme } from '@mantine/core';
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

import type { KitStory } from './story';

/** Groups appear in this order; within a group, stories are sorted by name. */
const GROUP_ORDER: readonly KitStory['group'][] = ['kit', 'layout', 'domain', 'shell'];

/** The three frames the design plan reviews everything at. */
const WIDTHS = [390, 768, 1280] as const;

const modules = import.meta.glob<{ default: KitStory }>('./stories/*.story.tsx', { eager: true });

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface Entry {
  id: string;
  story: KitStory;
}

const entries: Entry[] = Object.values(modules)
  .map((module) => module.default)
  .filter((story): story is KitStory => Boolean(story))
  .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.name.localeCompare(b.name))
  .map((story) => ({ id: `${slug(story.group)}-${slug(story.name)}`, story }));

function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  return (
    <ActionIcon
      size="lg"
      variant="default"
      aria-label={dark ? 'Switch to the light scheme' : 'Switch to the dark scheme'}
      onClick={toggleColorScheme}
    >
      {dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </ActionIcon>
  );
}

export function KitPage() {
  const [width, setWidth] = useState<number>(1280);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--pyr-page)' }}>
      <Stack
        gap="sm"
        px="md"
        py="md"
        style={{ borderBottom: '1px solid var(--pyr-hairline)' }}
        component="header"
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={2}>
            <Title order={1} size="h4">
              Pyrrhic kit
            </Title>
            <Text size="sm" c="dimmed">
              {entries.length} stories. Development build only.
            </Text>
          </Stack>
          <ColorSchemeToggle />
        </Group>
        <Group role="group" aria-label="Story width" gap="xs">
          {WIDTHS.map((option) => (
            <ActionIcon
              key={option}
              w={64}
              size="md"
              variant={option === width ? 'filled' : 'default'}
              aria-pressed={option === width}
              aria-label={`${option} pixels`}
              onClick={() => {
                setWidth(option);
              }}
            >
              <Text span size="xs" inherit>
                {option}
              </Text>
            </ActionIcon>
          ))}
        </Group>
      </Stack>

      <main style={{ padding: '0 1rem 6rem' }}>
        <Stack gap="lg" mx="auto" pt="lg" style={{ maxWidth: `${width}px` }}>
          {entries.map(({ id, story }) => (
            <section key={id} id={id} data-story={id} aria-labelledby={`${id}-label`} style={{ minWidth: 0 }}>
              <Group gap="xs" align="baseline" mb={6}>
                <Title order={2} size="h6" id={`${id}-label`}>
                  {story.name}
                </Title>
                <Text size="xs" c="dimmed">
                  {story.group}
                </Text>
              </Group>
              <div
                style={{
                  background: 'var(--mantine-color-default)',
                  border: '1px solid var(--pyr-hairline)',
                  borderRadius: 'var(--mantine-radius-md)',
                  padding: '0.75rem',
                  minWidth: 0,
                }}
              >
                {story.render()}
              </div>
            </section>
          ))}
        </Stack>
      </main>
    </div>
  );
}
