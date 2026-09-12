// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveSetup, useStore } from '@/state/store';

import { HousingSection } from './HousingSection';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const setup = () => selectActiveSetup(useStore.getState());

test('the three capacities are written to the active march', () => {
  render(<HousingSection />);
  fireEvent.change(screen.getByLabelText('Leadership'), { target: { value: '4100' } });
  fireEvent.change(screen.getByLabelText('Authority'), { target: { value: '1200' } });
  fireEvent.change(screen.getByLabelText('Dominance'), { target: { value: '200' } });

  expect(setup()?.housing).toEqual({ leadership: 4100, authority: 1200, dominance: 200 });
});

test('a cleared capacity counts as zero without fighting the field', () => {
  render(<HousingSection />);
  const leadership = screen.getByLabelText('Leadership');
  fireEvent.change(leadership, { target: { value: '4100' } });
  fireEvent.change(leadership, { target: { value: '' } });

  expect(setup()?.housing.leadership).toBe(0);
  expect((leadership as HTMLInputElement).value).toBe('');
});

test('the priority select writes the objective', () => {
  render(<HousingSection />);
  fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'damagePerSilver' } });
  expect(setup()?.priority).toBe('damagePerSilver');
});

test('the selective recovery plan asks how many unit types to revive', () => {
  render(<HousingSection />);
  expect(screen.queryByLabelText('Unit types to revive')).toBeNull();

  fireEvent.change(screen.getByLabelText('Recovery plan'), { target: { value: 'selective' } });
  expect(setup()?.recoveryPlan).toEqual({ mode: 'selective', selectiveTop: 3 });

  fireEvent.change(screen.getByLabelText('Unit types to revive'), { target: { value: '2' } });
  expect(setup()?.recoveryPlan).toEqual({ mode: 'selective', selectiveTop: 2 });
});

test('the model-confidence note is there, and the run is not', () => {
  render(<HousingSection />);
  expect(screen.getByText(/Model confidence/)).toBeTruthy();
  // The Generate button left with the sticky strip: the floating one owns the run (design plan §5.3).
  expect(screen.queryByRole('button', { name: /Generate/ })).toBeNull();
});

test('an empty housing says so until a capacity is entered', () => {
  render(<HousingSection />);
  expect(screen.getByText(/Enter your housing values from the march screen first/)).toBeTruthy();

  fireEvent.change(screen.getByLabelText('Dominance'), { target: { value: '200' } });

  expect(screen.queryByText(/Enter your housing values from the march screen first/)).toBeNull();
});
