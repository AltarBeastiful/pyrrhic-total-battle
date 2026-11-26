/**
 * The seam under the Bonuses cards: which battle setup they read, how they write it, and the limits that
 * setup plays by. The calculator binds the active march's setup in the store; the Prime Arena page binds its
 * own squad (five captains instead of three). The cards never reach for the store's active setup themselves.
 */
import type { BattleSetup, SyncMeta } from './schema';
import { useStore } from './store';

/** A setup without the revision stamp the store keeps for itself. */
export type EditableSetup = Omit<BattleSetup, keyof SyncMeta>;

/** How a setup is written: a function of the current one returning the fields that change. */
export type SetupEdit = (setup: EditableSetup) => Partial<EditableSetup>;

/** The write half of a binding, which is all the toggle actions need. */
export interface SetupWriter {
  update(edit: SetupEdit): void;
}

/** The limits the rules of the fight put on one setup. */
export interface SetupCaps {
  /** Captains that may ride at once: three on a march, five in the arena. */
  captains: number;
  /** Artifacts that may count at once. */
  artifacts: number;
  /** Equipment pieces an account may hold; the calculator's fifteen when absent. */
  equipment?: number;
}

export interface SetupBinding extends SetupWriter {
  setup: BattleSetup;
  caps: SetupCaps;
}

/** The calculator's writer: the active setup of the active profile, in the store. */
export const storeSetupWriter: SetupWriter = {
  update: (edit) => {
    useStore.getState().updateActiveSetup(edit);
  },
};
