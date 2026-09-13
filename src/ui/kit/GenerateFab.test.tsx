// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { GenerateFab } from './GenerateFab';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

test('the ready button runs the stacker', async () => {
  const user = userEvent.setup();
  const onGenerate = vi.fn();
  renderWithTheme(<GenerateFab label="Generate" state="ready" onGenerate={onGenerate} />);
  await user.click(screen.getByRole('button', { name: 'Generate' }));
  expect(onGenerate).toHaveBeenCalledTimes(1);
});

test('blocked cannot be pressed, and the reason is written beside it', async () => {
  const user = userEvent.setup();
  const onGenerate = vi.fn();
  renderWithTheme(
    <GenerateFab
      label="Generate"
      state="blocked"
      hint="Choose at least one unit first."
      onGenerate={onGenerate}
    />,
  );
  const button = screen.getByRole('button', { name: 'Generate' });
  expect(button.hasAttribute('disabled')).toBe(true);
  await user.click(button);
  expect(onGenerate).not.toHaveBeenCalled();
  expect(screen.getByText('Choose at least one unit first.')).toBeTruthy();
});

test('running says so and refuses a second press', async () => {
  const user = userEvent.setup();
  const onGenerate = vi.fn();
  renderWithTheme(<GenerateFab label="Generate" state="running" onGenerate={onGenerate} />);
  await user.click(screen.getByRole('button', { name: 'Generate' }));
  expect(onGenerate).not.toHaveBeenCalled();
});

test('it stays inside the page rather than portalling out of every landmark', () => {
  const { container } = renderWithTheme(
    <main>
      <GenerateFab label="Generate" state="ready" onGenerate={() => {}} />
    </main>,
  );
  expect(container.querySelector('main button')).toBeTruthy();
});
