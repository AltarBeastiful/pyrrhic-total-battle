/**
 * `waitFor` and `findBy*` give up after 1 s by default, which a full-suite run overshoots on a lazy section.
 * Only jsdom files need the library, so a node test does not load it.
 */
if (typeof document !== 'undefined') {
  const { configure } = await import('@testing-library/react');
  configure({ asyncUtilTimeout: 10_000 });
}
