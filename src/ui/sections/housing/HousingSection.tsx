import type { Pool, RecoveryMode } from '@/engine/types';
import { OBJECTIVES, RECOVERY_MODES } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { GenerateIcon, HousingIcon, PoolBadge } from '@/ui/icons';
import { useResultStore } from '@/ui/resultStore';
import { Button, HelpNote, NativeSelect, Popover, Section } from '@/ui/primitives';

import { amount, ratio } from '../results/format';
import { cancelGenerate, runGenerate, SEARCH_BUDGET_MS } from '../results/generate';
import { IntegerField } from '../results/IntegerField';
import { useRunStore } from '../results/runStore';
import { unitName } from '../results/units';

type Priority = (typeof OBJECTIVES)[number] | 'none';

/** What the priority select offers, and the short form the section header shows. */
const PRIORITY_LABELS: Record<Priority, string> = {
  none: 'No priority — march with every unit type',
  avgDamage: 'Best expected damage',
  minDamage: 'Best worst case — most damage if the monster strikes first',
  damagePerSilver: 'Best value per silver',
  damagePerGold: 'Best value per gold',
  damagePerDragonCoin: 'Best value per dragon coin',
};

const PRIORITY_SHORT: Record<Priority, string> = {
  none: 'No priority',
  avgDamage: 'Best expected damage',
  minDamage: 'Best worst case',
  damagePerSilver: 'Best value per silver',
  damagePerGold: 'Best value per gold',
  damagePerDragonCoin: 'Best value per dragon coin',
};

const RECOVERY_LABELS: Record<RecoveryMode, string> = {
  retrain: 'Retrain everything',
  revive: 'Revive everything',
  selective: 'Revive the top types, retrain the rest',
};

const POOL_LABELS: Record<Pool, string> = {
  leadership: 'Leadership',
  authority: 'Authority',
  dominance: 'Dominance',
};

const POOL_HINTS: Record<Pool, string> = {
  leadership: 'Pays for troops.',
  authority: 'Pays for mercenaries.',
  dominance: 'Pays for monsters.',
};

const POOLS = Object.keys(POOL_LABELS) as Pool[];

const isPriority = (value: string): value is Priority =>
  value === 'none' || (OBJECTIVES as readonly string[]).includes(value);

const isRecoveryMode = (value: string): value is RecoveryMode =>
  (RECOVERY_MODES as readonly string[]).includes(value);

/** Housing, priority, recovery plan and the Generate button (PLAN §4.7). */
export function HousingSection() {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const updateActiveSetup = useStore((state) => state.updateActiveSetup);
  const running = useResultStore((state) => state.running);
  const error = useResultStore((state) => state.error);
  const modelNotes = useResultStore((state) => state.last?.summary.modelNotes);
  const requestUnits = useResultStore((state) => state.last?.request.units);
  const progress = useRunStore((state) => state.progress);
  const searchExcluded = useRunStore((state) => state.searchExcluded);

  if (!profile || !setup) {
    return (
      <Section id="housing" title="Housing and march" icon={<HousingIcon />}>
        <HelpNote tone="warn">No march is selected.</HelpNote>
      </Section>
    );
  }

  const { housing, priority, recoveryPlan } = setup;
  // Nothing to fill: the engine would answer with an empty march and a list of ten identical reasons.
  const noHousing = housing.leadership + housing.authority + housing.dominance === 0;
  const searching = running && priority !== 'none';
  const selectiveTop = recoveryPlan.selectiveTop ?? 3;
  const score = (value: number): string => (priority === 'avgDamage' ? amount(value) : ratio(value));

  return (
    <Section
      id="housing"
      title="Housing and march"
      icon={<HousingIcon />}
      description="What this march can carry, what to aim for, and how you will pay for the losses."
      summary={
        <span className="text-muted nums">
          {POOLS.map((pool) => `${POOL_LABELS[pool]} ${amount(housing[pool])}`).join(' · ')} ·{' '}
          {PRIORITY_SHORT[priority]}
        </span>
      }
      help={
        <>
          <p>
            <strong>Where to find it in game:</strong> open the march window on the epic monster — the three
            capacities sit above the unit list, and they change with your castle.
          </p>
          <p>
            Leadership pays for troops, authority for mercenaries, dominance for monsters. Without a priority
            you march with every unit type you own; pick one and the calculator tries combinations instead,
            drops the types that cost more than they add, keeps the best it finds inside{' '}
            {String(Math.round(SEARCH_BUDGET_MS / 1000))} seconds, and shows you what that choice cost you.
          </p>
          <p>
            <strong>Best worst case</strong> is the cautious one: it maximises the damage you do when the
            monster strikes first, which keeps the army wide instead of betting everything on winning the coin
            flip.
          </p>
          <p>
            The recovery plan decides what the summary charges you after the fight: retraining pays silver
            (plus revive gold for monsters, which cannot be retrained), reviving pays gold through your
            temple.
          </p>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {POOLS.map((pool) => (
            <IntegerField
              key={pool}
              label={POOL_LABELS[pool]}
              hint={POOL_HINTS[pool]}
              prefix={<PoolBadge pool={pool} size="sm" />}
              value={housing[pool]}
              max={100_000_000}
              onChange={(value) => {
                updateActiveSetup({ housing: { ...housing, [pool]: value } });
              }}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <NativeSelect
              label="Priority"
              hideLabel={false}
              value={priority}
              options={(Object.keys(PRIORITY_LABELS) as Priority[]).map((value) => ({
                value,
                label: PRIORITY_LABELS[value],
              }))}
              onChange={(event) => {
                const next = event.target.value;
                if (isPriority(next)) updateActiveSetup({ priority: next });
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <NativeSelect
              label="Recovery plan"
              hideLabel={false}
              value={recoveryPlan.mode}
              options={RECOVERY_MODES.map((value) => ({
                value,
                label: RECOVERY_LABELS[value],
              }))}
              onChange={(event) => {
                const next = event.target.value;
                if (!isRecoveryMode(next)) return;
                updateActiveSetup({
                  recoveryPlan:
                    next === 'selective' ? { mode: next, selectiveTop: selectiveTop } : { mode: next },
                });
              }}
            />
            {recoveryPlan.mode === 'selective' && (
              <IntegerField
                label="Unit types to revive"
                hint="The highest tiers are revived, everything else is retrained."
                value={selectiveTop}
                min={1}
                max={20}
                className="mt-2"
                onChange={(value) => {
                  updateActiveSetup({ recoveryPlan: { mode: 'selective', selectiveTop: value } });
                }}
              />
            )}
          </div>
        </div>

        {searchExcluded.length > 0 && !running && (
          <HelpNote>
            The search left {String(searchExcluded.length)} unit type
            {searchExcluded.length === 1 ? '' : 's'} out of this march:{' '}
            {searchExcluded.map((id) => unitName(id, requestUnits)).join(', ')}. Results shows what that
            bought you, and lets you keep any of them in.
          </HelpNote>
        )}

        {error !== null && (
          <div role="alert">
            <HelpNote tone="danger">{error}</HelpNote>
          </div>
        )}

        <HelpNote>
          Model confidence: stack sizes and per-hit damage reproduce the captured runs and both in-game
          reports; the expected damage, the strike-two-squads chance and part of the recovery cost are still
          modelled rather than measured.{' '}
          <Popover
            label="What the battle model is sure of"
            trigger={
              <button type="button" className="underline underline-offset-2">
                What is modelled
              </button>
            }
          >
            <ul className="text-muted list-disc space-y-1 pl-4 text-xs">
              {(
                modelNotes ?? ['Generate a march to see the notes the engine attaches to its own numbers.']
              ).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Popover>
        </HelpNote>

        <div
          className={
            'border-line bg-surface sticky bottom-0 z-20 -mx-3 -mb-3 border-t px-3 py-3 ' +
            'pb-[max(0.75rem,env(safe-area-inset-bottom))] ' +
            'sm:-mx-4 sm:-mb-4 sm:px-4 md:static md:m-0 md:border-0 md:bg-transparent md:p-0 md:pb-0'
          }
        >
          {noHousing && (
            <HelpNote tone="warn" className="mb-2">
              Enter your housing values from the march screen first: with no leadership, authority or
              dominance there is nothing to fill.
            </HelpNote>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={<GenerateIcon />}
              disabled={running || noHousing}
              className="md:w-auto"
              onClick={() => void runGenerate()}
            >
              {running ? 'Generating…' : 'Generate'}
            </Button>
            {running && (
              <Button
                onClick={() => {
                  cancelGenerate();
                }}
              >
                Cancel
              </Button>
            )}
            <p className="text-muted nums text-xs" role="status">
              {!running
                ? ''
                : !searching
                  ? 'Generating…'
                  : progress === null
                    ? 'Trying formations…'
                    : `Tried ${amount(progress.evaluated)} formations — best ${score(progress.bestScore)}`}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
