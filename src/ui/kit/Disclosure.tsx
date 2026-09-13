/**
 * A fold that keeps its summary visible (plan §3): the header says what is inside *and* what it
 * currently amounts to, so collapsing never hides the figure the player came for.
 *
 * Two shapes, because two situations. `Disclosure` is one fold — `Collapse` under a button that owns
 * `aria-expanded`, with the summary beside the title. `DisclosureGroup` is a set of folds that
 * belong together (the bonus families), which is what `Accordion` already is; using it there keeps
 * the roving keyboard behaviour and the single/multiple rule out of our hands.
 */
import { Accordion, Box, Collapse, Group, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export interface DisclosureProps {
  title: ReactNode;
  /** Stays visible when the fold is closed: the total, the count, the chosen value. */
  summary?: ReactNode;
  children: ReactNode;
  defaultOpened?: boolean;
  /** Controlled; leave both out to let the fold keep its own state. */
  opened?: boolean;
  onChange?: (opened: boolean) => void;
}

export function Disclosure({
  title,
  summary,
  children,
  defaultOpened = false,
  opened,
  onChange,
}: DisclosureProps) {
  const [uncontrolled, handlers] = useDisclosure(defaultOpened);
  const isOpen = opened ?? uncontrolled;

  return (
    <Box>
      <UnstyledButton
        aria-expanded={isOpen}
        w="100%"
        py="xs"
        onClick={() => {
          if (opened === undefined) handlers.toggle();
          onChange?.(!isOpen);
        }}
      >
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap={6} wrap="nowrap" miw={0}>
            <ChevronDown
              size={16}
              aria-hidden
              style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
            <Text span size="sm" fw={500}>
              {title}
            </Text>
          </Group>
          {summary !== undefined && (
            <Text span size="sm" c="dimmed">
              {summary}
            </Text>
          )}
        </Group>
      </UnstyledButton>
      <Collapse expanded={isOpen}>
        <Box pb="xs">{children}</Box>
      </Collapse>
    </Box>
  );
}

export interface DisclosureGroupItem {
  value: string;
  title: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
}

export interface DisclosureGroupProps {
  items: DisclosureGroupItem[];
  /** More than one open at a time. */
  multiple?: boolean;
  defaultValue?: string | string[] | null;
}

export function DisclosureGroup({ items, multiple = false, defaultValue }: DisclosureGroupProps) {
  const common = { chevronPosition: 'left' as const, variant: 'default' as const };
  const content = items.map((item) => (
    <Accordion.Item key={item.value} value={item.value}>
      <Accordion.Control>
        <Group justify="space-between" wrap="nowrap" gap="sm" pr="xs">
          <Text span size="sm" fw={500}>
            {item.title}
          </Text>
          {item.summary !== undefined && (
            <Text span size="sm" c="dimmed">
              {item.summary}
            </Text>
          )}
        </Group>
      </Accordion.Control>
      <Accordion.Panel>{item.children}</Accordion.Panel>
    </Accordion.Item>
  ));

  return multiple ? (
    <Accordion
      {...common}
      multiple
      defaultValue={Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []}
    >
      {content}
    </Accordion>
  ) : (
    <Accordion {...common} defaultValue={typeof defaultValue === 'string' ? defaultValue : null}>
      {content}
    </Accordion>
  );
}
