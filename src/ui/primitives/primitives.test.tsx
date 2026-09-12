// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import { Drawer } from './Drawer';
import { NumberField } from './NumberField';
import { Pill } from './Pill';
import { RangeSelect, type TierRangeValue } from './RangeSelect';
import { Section } from './Section';
import { Toggle } from './Toggle';

afterEach(() => {
  cleanup();
});

function ControlledNumber({ decimal = false }: { decimal?: boolean }) {
  const [value, setValue] = useState<number | null>(10);
  return (
    <>
      <NumberField label="Leadership" value={value} onChange={setValue} min={0} max={100} decimal={decimal} />
      <output>{value === null ? 'empty' : String(value)}</output>
    </>
  );
}

test('NumberField keeps an empty field empty instead of inventing a zero', () => {
  render(<ControlledNumber />);
  const input = screen.getByLabelText('Leadership');
  fireEvent.change(input, { target: { value: '' } });
  expect(screen.getByRole('status').textContent).toBe('empty');
});

test('NumberField parses integers and clamps to the range on blur', () => {
  render(<ControlledNumber />);
  const input = screen.getByLabelText('Leadership');
  fireEvent.change(input, { target: { value: '250' } });
  fireEvent.blur(input);
  expect(screen.getByRole('status').textContent).toBe('100');
  expect((input as HTMLInputElement).value).toBe('100');
});

test('NumberField accepts a decimal comma and uses a numeric keyboard', () => {
  render(<ControlledNumber decimal />);
  const input = screen.getByLabelText('Leadership');
  expect(input.getAttribute('inputmode')).toBe('decimal');
  fireEvent.change(input, { target: { value: '39,5' } });
  expect(screen.getByRole('status').textContent).toBe('39.5');
});

test('Pill toggles and exposes its gear as a separate button', () => {
  const onToggle = vi.fn();
  const onEdit = vi.fn();
  render(<Pill label="Aydae" detail="lvl 20" on={false} onToggle={onToggle} onEdit={onEdit} />);

  const pill = screen.getByRole('button', { name: 'Aydae lvl 20' });
  expect(pill.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(pill);
  expect(onToggle).toHaveBeenCalledWith(true);

  fireEvent.click(screen.getByRole('button', { name: 'Edit Aydae' }));
  expect(onEdit).toHaveBeenCalledTimes(1);
});

test('a locked Pill has no toggle, only a gear', () => {
  render(<Pill label="Hall of Fame" on locked onToggle={vi.fn()} onEdit={vi.fn()} />);
  expect(screen.queryByRole('button', { name: /^Hall of Fame$/ })).toBeNull();
  expect(screen.getByRole('button', { name: 'Edit Hall of Fame' })).toBeTruthy();
});

test('Toggle is a switch that reports its state', () => {
  const onChange = vi.fn();
  render(<Toggle label="Round to 10s" checked onChange={onChange} />);
  const toggle = screen.getByRole('switch', { name: 'Round to 10s' });
  expect(toggle.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(toggle);
  expect(onChange).toHaveBeenCalledWith(false);
});

function ControlledRange() {
  const [value, setValue] = useState<TierRangeValue | null>({ min: 2, max: 4 });
  return (
    <>
      <RangeSelect label="Guardsmen" value={value} onChange={setValue} min={1} max={6} allowNone />
      <output>{value === null ? 'none' : `${String(value.min)}-${String(value.max)}`}</output>
    </>
  );
}

test('RangeSelect pushes the other end instead of inverting the range', () => {
  render(<ControlledRange />);
  fireEvent.change(screen.getByLabelText('Guardsmen lowest tier'), { target: { value: '5' } });
  expect(screen.getByRole('status').textContent).toBe('5-5');

  fireEvent.change(screen.getByLabelText('Guardsmen highest tier'), { target: { value: '3' } });
  expect(screen.getByRole('status').textContent).toBe('3-3');
});

test('RangeSelect can be switched off entirely', () => {
  render(<ControlledRange />);
  fireEvent.click(screen.getByRole('switch', { name: 'Guardsmen unlocked' }));
  expect(screen.getByRole('status').textContent).toBe('none');
});

test('Section collapses its body and keeps the help popover reachable', () => {
  render(
    <Section id="troops" title="Troops" help={<p>Where to find it in game.</p>}>
      <p>body</p>
    </Section>,
  );
  expect(screen.getByText('body')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Troops' }));
  expect(screen.getByRole('button', { name: 'Troops', expanded: false })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'About Troops' }));
  expect(screen.getByText('Where to find it in game.')).toBeTruthy();
});

test('Drawer renders a titled dialog when open', () => {
  render(
    <Drawer open onOpenChange={vi.fn()} title="Bonus breakdown" description="Per source">
      <p>rows</p>
    </Drawer>,
  );
  const dialog = screen.getByRole('dialog');
  expect(dialog.textContent).toContain('Bonus breakdown');
  expect(dialog.textContent).toContain('rows');
});
