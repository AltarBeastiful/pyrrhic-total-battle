/**
 * What a bottom bar draws, as data: the frame config that lets the calculator and the Prime Arena share one
 * command bar and one phone bar (`CommandBar.tsx`, `BottomBar.tsx`).
 *
 * The bars are forms made of the same four things: the housing pools that apply, an objective control where the
 * fight has one, the answer, and Generate. The calculator's frame fills all four from the active march; another
 * fight fills them from its own state and leaves out what its rules do not have (the arena has no authority and
 * no objective). The bars know nothing else about either.
 */
import type { ReactNode } from 'react';

import type { Pool } from '@/engine/types';
import type { BattleSetup } from '@/state/schema';
import { MarchGenerateButton, MarchQuickSummary } from '@/ui/sections/march';

import { useCommandBar, POOLS } from './command';
import { useBarForm, type BarForm } from './useGenerateRun';

export interface BarObjective {
  priority: string;
  /** The chosen objective by name, for the phone's chip. */
  title: string;
  /** True while the plan decides it: the control reads, says why, and does not open. */
  locked: boolean;
  onChange: (value: string) => void;
}

/**
 * For a fight that works its pools out (the Prime Arena, B-43): the bonus % added on top of what the app knows, typed
 * beside the pools, and the button that puts the maximum back into them.
 */
export interface BarMaximum {
  /** The bonus field's name. */
  label: string;
  /** The same in a phone chip's worth of room. */
  short: string;
  percent: number;
  /** The most the field takes. */
  max: number;
  setPercent: (percent: number) => void;
  /** The button's accessible name; it reads "Max". */
  fillLabel: string;
  fill: () => void;
}

export interface BarFrame {
  /** The accessible name of the bar's form: "This march". */
  label: string;
  /** The pools that apply, in tab order. */
  pools: readonly Pool[];
  /** `null` while nothing is selected, the one state the bars draw nothing for. */
  housing: BattleSetup['housing'] | null;
  problems: Record<Pool, string | null>;
  message: string | null;
  setPool: (pool: Pool, value: number | null) => void;
  /** The pools' bonus and "Max", where the fight has them. */
  maximum?: BarMaximum;
  /** The objective control, or `null` where the fight has none. */
  objective: BarObjective | null;
  form: BarForm;
  /** Generate, already bound to what it runs. */
  generate: ReactNode;
  /** The answer in one line, where the bar carries it (below 1200 px and on phones). */
  answer: ReactNode;
  /** The answer's target, for a screen reader: "Open the march recap". */
  answerLabel: string;
}

/** The calculator's own bar: the active march's pools and objective, its Generate and its one-line answer. */
export function useCalculatorBar(): BarFrame {
  const bar = useCommandBar();
  const form = useBarForm();
  return {
    label: 'This march',
    pools: POOLS,
    housing: bar.housing,
    problems: bar.problems,
    message: bar.message,
    setPool: bar.setPool,
    objective: {
      priority: bar.priority,
      title: bar.objectiveTitle,
      locked: bar.objectiveLocked,
      onChange: bar.setObjective,
    },
    form,
    generate: <MarchGenerateButton size="sm" />,
    answer: <MarchQuickSummary />,
    answerLabel: 'Open the march recap',
  };
}
