/**
 * The March section's contract (M-08). The shell renders the four components below — the section in
 * the page flow or under the pane header, the recap in the pane header and in the phone's recap
 * sheet, the quick summary and Generate in the bottom app bar — and reads the run from the same
 * store the section writes to. Names and props are fixed; do not rename.
 */
export { MarchSection } from './MarchSection';
export { MarchQuickSummary } from './MarchQuickSummary';
export type { MarchQuickSummaryProps } from './MarchQuickSummary';
export { MarchRecap } from './MarchRecap';
export type { MarchRecapProps } from './MarchRecap';
export { MarchGenerateButton } from './MarchGenerateButton';
export type { MarchGenerateButtonProps } from './MarchGenerateButton';

// What the frame reads to know where a run stands (the fingerprint, the progress, the previous
// summary) and how it starts or stops one. The section owns the engine call; the shell owns the
// keyboard shortcut and the status line, so both need the same handful of exports.
export { cancelGenerate, restoreLastResult, runGenerate, SEARCH_BUDGET_MS } from './generate';
export { setupFingerprint, tradeoffFigures, useRunStore } from './runStore';
export type { RemovedMercenary, RunState, SearchTradeoff, TradeoffFigures } from './runStore';
export { amount, compact, duration, percent, ratio, relativeTime } from './format';
export { useMarch } from './useMarch';
export type { MarchView } from './useMarch';
