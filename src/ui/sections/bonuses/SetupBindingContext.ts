/**
 * Which setup the Bonuses cards are bound to. `BonusesBody` provides its binding to the chips below it, so a
 * chip that toggles a source writes where the page says (the march, or the arena's squad) without the
 * binding being threaded through every prop. Outside a provider the calculator's store writer is used.
 */
import { createContext, useContext, useMemo } from 'react';

import { selectActiveSetup, useStore } from '@/state/store';
import { storeSetupWriter, type SetupBinding, type SetupWriter } from '@/state/setupBinding';

import { MAX_ACTIVE_ARTIFACTS, MAX_ACTIVE_CAPTAINS, MAX_EQUIPMENT } from './rows';

const SetupBindingContext = createContext<SetupBinding | null>(null);

export const SetupBindingProvider = SetupBindingContext.Provider;

/** How the chips below write the setup they sit on. */
export function useSetupWriter(): SetupWriter {
  return useContext(SetupBindingContext) ?? storeSetupWriter;
}

/** The calculator's limits: three captains, three artifacts, fifteen pieces. */
export const MARCH_CAPS = {
  captains: MAX_ACTIVE_CAPTAINS,
  artifacts: MAX_ACTIVE_ARTIFACTS,
  equipment: MAX_EQUIPMENT,
} as const;

/** The store-backed default: the active march's setup, or null while no account is loaded. */
export function useActiveSetupBinding(): SetupBinding | null {
  const setup = useStore(selectActiveSetup);
  return useMemo(
    () => (setup === undefined ? null : { setup, update: storeSetupWriter.update, caps: MARCH_CAPS }),
    [setup],
  );
}
