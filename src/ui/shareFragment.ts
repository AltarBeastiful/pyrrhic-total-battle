/**
 * Load-from-URL flow (ADR-0005). The fragment is decoded and parked in the UI store, which opens
 * `LoadSharedDialog`; nothing stored is touched until the user answers. The fragment is removed from
 * the address bar first, so a reload does not ask twice and a copied address carries nothing.
 */
import { decodeShare, parseLocationHash } from '@/share/codec';

import { useUiStore } from './uiStore';

/** Returns true when a share code was present (whatever the outcome of decoding it). */
export async function consumeShareFragment(win: Window = window): Promise<boolean> {
  const code = parseLocationHash(win.location.hash);
  if (code === null) return false;

  win.history.replaceState(null, '', `${win.location.pathname}${win.location.search}`);
  try {
    useUiStore.getState().setPendingShare(await decodeShare(code));
  } catch (error) {
    useUiStore
      .getState()
      .setShareError(
        error instanceof Error
          ? `This share link could not be read: ${error.message}`
          : 'This share link could not be read.',
      );
  }
  return true;
}
