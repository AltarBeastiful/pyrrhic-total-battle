// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';

import { useResultStore } from '../resultStore';
import { ProfileBar } from './ProfileBar';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  useResultStore.getState().clear();
});

afterEach(() => {
  cleanup();
});

const profiles = () => useStore.getState().doc.profiles;
const active = () => selectActiveProfile(useStore.getState());

function openDialog(name: string): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name }));
  return screen.getByRole('dialog');
}

function typeName(dialog: HTMLElement, value: string): void {
  fireEvent.change(within(dialog).getByLabelText('Profile name'), { target: { value } });
}

test('shows the active profile and the save state', () => {
  render(<ProfileBar />);
  expect(screen.getByLabelText('Active profile').textContent).toContain('My account');
  expect(screen.getByText('Saved in this browser')).toBeTruthy();
});

test('creates a profile and makes it active', () => {
  render(<ProfileBar />);
  const dialog = openDialog('New profile');
  typeName(dialog, 'Second account');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

  expect(profiles()).toHaveLength(2);
  expect(active()?.name).toBe('Second account');
});

test('renames the active profile', () => {
  render(<ProfileBar />);
  const dialog = openDialog('Rename profile');
  typeName(dialog, 'Main account');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

  expect(profiles()).toHaveLength(1);
  expect(active()?.name).toBe('Main account');
});

test('duplicates the active profile with a fresh identity', () => {
  render(<ProfileBar />);
  const original = active();
  const dialog = openDialog('Duplicate profile');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Duplicate' }));

  expect(profiles()).toHaveLength(2);
  const copy = active();
  expect(copy?.name).toBe('My account (copy)');
  expect(copy?.id).not.toBe(original?.id);
  expect(copy?.setups[0]?.id).not.toBe(original?.setups[0]?.id);
});

test('deleting asks for confirmation and leaves a tombstone', () => {
  useStore.getState().createProfile('Throwaway');
  render(<ProfileBar />);
  const doomed = active();

  const dialog = openDialog('Delete profile');
  expect(dialog.textContent).toContain('Throwaway');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Delete profile' }));

  expect(profiles()).toHaveLength(1);
  expect(profiles().some((profile) => profile.id === doomed?.id)).toBe(false);
  expect(useStore.getState().doc.tombstones.map((entry) => entry.id)).toContain(doomed?.id);
});

test('cancelling the delete dialog keeps the profile', () => {
  render(<ProfileBar />);
  const dialog = openDialog('Delete profile');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(profiles()).toHaveLength(1);
});

test('the share dialog builds a profile link with a QR code', async () => {
  render(<ProfileBar />);
  const dialog = openDialog('Share profile or march');

  const link = await within(dialog).findByLabelText('Profile share link');
  expect((link as HTMLTextAreaElement).value).toContain('#c=');
  expect(within(dialog).getByText(/characters — budget/)).toBeTruthy();
  expect(within(dialog).getByRole('img', { name: /QR code/ })).toBeTruthy();
});

test('the battle tab explains that a result is needed first', async () => {
  render(<ProfileBar />);
  const dialog = openDialog('Share profile or march');
  fireEvent.mouseDown(within(dialog).getByRole('tab', { name: 'Battle link' }));

  await waitFor(() => {
    expect(within(dialog).getByText(/Generate a stack first/)).toBeTruthy();
  });
});
