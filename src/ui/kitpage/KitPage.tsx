/**
 * The kit page (`/#kit`, dev only). Two galleries now, because the app is mid-migration (ADR-0008):
 *
 * - **Kit v2**, the Mantine composites of `docs/plans/ui-foundation-mantine.md` §3, rendered once in
 *   whichever colour scheme the page is set to. They cannot be shown light and dark side by side:
 *   Mantine's scheme is one attribute on `<html>`, so the toggle in the header is how both are seen.
 * - **Kit v1**, the React Aria + Tailwind kit still holding the old sections up, rendered light and
 *   dark side by side as it always was. It goes at M-09, and this half of the page goes with it.
 *
 * This is the surface the owner reviews a phase on and the surface `pnpm test:visual` screenshots
 * and runs axe against.
 */
import { ActionIcon, Divider, Group, Stack, Text, Title, useMantineColorScheme } from '@mantine/core';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { KitStory } from './story';
import { mirrorThemeTokens } from './themeMirror';

/** Groups appear in this order; within a group, stories are sorted by name. */
const GROUP_ORDER: readonly KitStory['group'][] = ['kit', 'layout', 'domain', 'shell'];

/** The three frames the design plan reviews everything at. */
const WIDTHS = [390, 768, 1280] as const;

const legacyModules = import.meta.glob<{ default: KitStory }>('./stories/*.story.tsx', { eager: true });
const modules = import.meta.glob<{ default: KitStory }>('./stories2/*.story.tsx', { eager: true });

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

function entriesOf(found: Record<string, { default: KitStory }>, prefix: string): Entry[] {
  return Object.values(found)
    .map((module) => module.default)
    .filter((story): story is KitStory => Boolean(story))
    .sort(
      (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.name.localeCompare(b.name),
    )
    .map((story) => ({ id: `${prefix}-${slug(story.group)}-${slug(story.name)}`, story }));
}

const entries = entriesOf(modules, 'v2');
const legacyEntries = entriesOf(legacyModules, 'v1');

const LEGACY_WRAPPER = 'bg-bg text-fg rounded-card border-line min-w-0 border p-4';

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

  // The v1 palettes live on `:root` only; the nested light/dark previews need them on themselves.
  useEffect(() => {
    mirrorThemeTokens();
  }, []);

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
              {entries.length} Mantine stories and {legacyEntries.length} legacy ones. Development build only.
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
        <Stack gap="xl" mx="auto" pt="lg" style={{ maxWidth: `${width}px` }}>
          <section id="kit-v2-gallery" aria-labelledby="kit-v2">
            <Title order={2} size="h5" id="kit-v2" mb="xs">
              Kit v2 — Mantine
            </Title>
            <Stack gap="lg">
              {entries.map(({ id, story }) => (
                <section
                  key={id}
                  id={id}
                  data-story={id}
                  aria-labelledby={`${id}-label`}
                  style={{ minWidth: 0 }}
                >
                  <Group gap="xs" align="baseline" mb={6}>
                    <Title order={3} size="h6" id={`${id}-label`}>
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
          </section>

          <Divider />

          <section id="kit-v1-gallery" aria-labelledby="kit-v1">
            <Title order={2} size="h5" id="kit-v1" mb="xs">
              Kit v1 — React Aria (retired at M-09)
            </Title>
            <Stack gap="lg">
              {legacyEntries.map(({ id, story }) => (
                <section
                  key={id}
                  id={id}
                  data-story={id}
                  aria-labelledby={`${id}-label`}
                  style={{ minWidth: 0 }}
                >
                  <Group gap="xs" align="baseline" mb={6}>
                    <Title order={3} size="h6" id={`${id}-label`}>
                      {story.name}
                    </Title>
                    <Text size="xs" c="dimmed">
                      {story.group}
                    </Text>
                  </Group>
                  {/* The retired kit has rows that do not fit a phone; rather than fix a gallery
                      that dies at M-09, it scrolls inside itself so the page never does. */}
                  <div className="grid gap-3 lg:grid-cols-2" style={{ overflowX: 'auto', minWidth: 0 }}>
                    <div data-theme="light" className={LEGACY_WRAPPER}>
                      {story.render()}
                    </div>
                    <div data-theme="dark" className={LEGACY_WRAPPER}>
                      {story.render()}
                    </div>
                  </div>
                </section>
              ))}
            </Stack>
          </section>
        </Stack>
      </main>
    </div>
  );
}
