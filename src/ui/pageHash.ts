/**
 * The page in the address bar (owner, 2026-11-19): `#talents` is the hero talent planner, so a reload or a saved
 * link comes back to it; the calculator has no fragment. The fragment is only a mirror of the UI store's `page`:
 * `replaceState`, so Back keeps meaning what it does for the dialogs and sheets (`backCloses`). A share link
 * (`#c=...`) and the style kit (`#kit`) are other users of the fragment and are neither read nor rewritten here.
 */
import { useUiStore, type Page } from './uiStore';

const PAGE_HASHES: Readonly<Record<Exclude<Page, 'calculator'>, string>> = { talents: 'talents' };

/** The page a fragment names; anything else (empty, a share code, the kit, nonsense) is the calculator. */
export function pageFromHash(hash: string): Page {
  const name = hash.replace(/^#\/?/, '').toLowerCase();
  const hit = (Object.entries(PAGE_HASHES) as [Exclude<Page, 'calculator'>, string][]).find(
    ([, value]) => value === name,
  );
  return hit === undefined ? 'calculator' : hit[0];
}

/** Whether the fragment is ours to read: empty, or a page name. Share codes carry `=`; the kit is `#kit`. */
function isPageFragment(hash: string): boolean {
  const name = hash.replace(/^#\/?/, '').toLowerCase();
  return name === '' || name === 'calculator' || Object.values(PAGE_HASHES).includes(name);
}

/** Opens the page the address names, then keeps the address on the page. Returns the unbinder. */
export function bindPageToHash(win: Window = window): () => void {
  const { setPage } = useUiStore.getState();
  if (isPageFragment(win.location.hash) && useUiStore.getState().page !== pageFromHash(win.location.hash))
    setPage(pageFromHash(win.location.hash));

  const unsubscribe = useUiStore.subscribe((state, previous) => {
    if (state.page === previous.page) return;
    const fragment = state.page === 'calculator' ? '' : `#${PAGE_HASHES[state.page]}`;
    win.history.replaceState(null, '', `${win.location.pathname}${win.location.search}${fragment}`);
  });

  const onHashChange = (): void => {
    if (isPageFragment(win.location.hash)) setPage(pageFromHash(win.location.hash));
  };
  win.addEventListener('hashchange', onHashChange);
  return () => {
    unsubscribe();
    win.removeEventListener('hashchange', onHashChange);
  };
}
