/**
 * The March section's contract (M-08). The shell renders the four components below — the section
 * under the pane's header on a desktop and inside the phone's sheet, the recap in the pane header,
 * the quick summary and Generate in the bottom app bar — and reads the run from the same store the
 * section writes to. Names are fixed; do not rename.
 *
 * `MarchRecap` lost its `variant` on 2026-09-13: the sheet is now the whole March section, so the
 * "sheet" shape of the recap was the duplication design rule 5 forbids (investigation 0011).
 */
export { MarchSection } from './MarchSection';
// The March's second half, drawn at the foot of the setup column from 1200 px up (owner, 2026-09-15).
export { MarchFoot } from './MarchFoot';
export { MarchQuickSummary } from './MarchQuickSummary';
export type { MarchQuickSummaryProps } from './MarchQuickSummary';
export { MarchRecap } from './MarchRecap';
export { MarchGenerateButton } from './MarchGenerateButton';
export type { MarchGenerateButtonProps } from './MarchGenerateButton';

// What the shell reads besides the components: how a cached run is restored, and the one formatter the
// command bar and the bottom bar share. Everything else the section owns it imports from its own files;
// the re-exports nothing outside read were pruned on 2026-09-18.
export { restoreLastResult } from './generate';
export { amount } from './format';
