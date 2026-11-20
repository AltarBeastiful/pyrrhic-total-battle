/**
 * The page in the address bar (owner, 2026-11-19): `#talents` is the hero talent planner, so a reload or a saved
 * link comes back to it; the calculator has no fragment. The fragment is only a mirror of the UI store's `page`:
 * `replaceState`, so Back keeps meaning what it does for the dialogs and sheets (`backCloses`). A share link
 * (`#c=...`) and the style kit (`#kit`) are other users of the fragment and are neither read nor rewritten here.
 * The talents page also names its open tree, `#talents/economy` (B-30); a bare `#talents` opens Battle.
 */
import { TALENT_TREES, type TalentTree } from '@/data/types';

import { useUiStore, type Page } from './uiStore';

const PAGE_HASHES: Readonly<Record<Exclude<Page, 'calculator'>, string>> = { talents: 'talents' };

/** The page a fragment names; anything else (empty, a share code, the kit, nonsense) is the calculator. */
export function pageFromHash(hash: string): Page {
  const name = hash.replace(/^#\/?/, '').toLowerCase().split('/')[0]!;
  const hit = (Object.entries(PAGE_HASHES) as [Exclude<Page, 'calculator'>, string][]).find(
    ([, value]) => value === name,
  );
  return hit === undefined ? 'calculator' : hit[0];
}

/** The tree a talents fragment names; Battle when it names none or an unknown one. */
export function treeFromHash(hash: string): TalentTree {
  const tree = hash.replace(/^#\/?/, '').toLowerCase().split('/')[1];
  return TALENT_TREES.find((t) => t === tree) ?? 'battle';
}

/** Whether the fragment is ours to read: empty, or a page name. Share codes carry `=`; the kit is `#kit`. */
function isPageFragment(hash: string): boolean {
  const name = hash.replace(/^#\/?/, '').toLowerCase().split('/')[0]!;
  return name === '' || name === 'calculator' || Object.values(PAGE_HASHES).includes(name);
}

/** Reads the page and the tree the address names into the store. */
function readAddress(win: Window): void {
  if (!isPageFragment(win.location.hash)) return;
  const { setPage, setTalentsTree } = useUiStore.getState();
  const page = pageFromHash(win.location.hash);
  if (page === 'talents') setTalentsTree(treeFromHash(win.location.hash));
  setPage(page);
}

/** Opens the page the address names, then keeps the address on the page. Returns the unbinder. */
export function bindPageToHash(win: Window = window): () => void {
  readAddress(win);

  const write = (): void => {
    const { page, talentsTree } = useUiStore.getState();
    const fragment = page === 'calculator' ? '' : `#${PAGE_HASHES[page]}/${talentsTree}`;
    win.history.replaceState(null, '', `${win.location.pathname}${win.location.search}${fragment}`);
  };
  // A bare `#talents` is completed to the tree it opens.
  if (useUiStore.getState().page === 'talents' && isPageFragment(win.location.hash)) write();

  const unsubscribe = useUiStore.subscribe((state, previous) => {
    if (state.page === previous.page && state.talentsTree === previous.talentsTree) return;
    write();
  });

  const onHashChange = (): void => {
    readAddress(win);
  };
  win.addEventListener('hashchange', onHashChange);
  return () => {
    unsubscribe();
    win.removeEventListener('hashchange', onHashChange);
  };
}
