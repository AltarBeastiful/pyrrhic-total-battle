import type { RecoveryMode } from '@/engine/types';
import { OBJECTIVES, RECOVERY_MODES } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { useResultStore } from '@/ui/resultStore';
import { Button, HelpNote, NativeSelect, Popover, Section } from '@/ui/primitives';

import { amount, ratio } from '../results/format';
import { cancelGenerate, runGenerate, SEARCH_BUDGET_MS } from '../results/generate';
import { IntegerField } from '../results/IntegerField';
import { useRunStore } from '../results/runStore';
import { unitName } from '../results/units';

type Priority = (typeof OBJECTIVES)[number] | 'none';

const PRIORITY_LABELS: Record<Priority, string> = {
  none: 'No priority — just size the stacks',
  avgDamage: 'Highest average damage',
  damagePerSilver: 'Most damage per silver',
  damagePerGold: 'Most damage per gold',
  damagePerDragonCoin: 'Most damage per dragon coin',
};

const RECOVERY_LABELS: Record<RecoveryMode, string> = {
  retrain: 'Retrain everything',
  revive: 'Revive everything',
  selective: 'Revive the top types, retrain the rest',
};

const POOL_HINTS = {
  leadership: 'Pays for troops.',
  authority: 'Pays for mercenaries.',
  dominance: 'Pays for monsters.',
} as const;

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
      <Section id="housing" title="Housing and march">
        <HelpNote tone="warn">No march is selected.</HelpNote>
      </Section>
    );
  }

  const { housing, priority, recoveryPlan } = setup;
  const searching = running && priority !== 'none';
  const selectiveTop = recoveryPlan.selectiveTop ?? 3;
  const score = (value: number): string => (priority === 'avgDamage' ? amount(value) : ratio(value));

  return (
    <Section
      id="housing"
      title="Housing and march"
      description="What this march can carry, what to optimise for, and how you will pay for the losses."
      summary={
        <span className="text-muted">
          {amount(housing.leadership)} leadership · {amount(housing.authority)} authority ·{' '}
          {amount(housing.dominance)} dominance
        </span>
      }
      help={
        <>
          <p>
            Where to find it in game: open the march window on the epic monster. The three capacities are
            printed above the unit list — leadership for troops, authority for mercenaries, dominance for
            monsters. They change with your castle, so check them before a big hit.
          </p>
          <p>
            A priority makes the calculator try formations instead of taking all your unit types: it drops the
            types that cost more than they add, keeps the best one it finds inside a{' '}
            {String(Math.round(SEARCH_BUDGET_MS / 1000))}-second budget, and tells you what it left out.
          </p>
          <p>
            The recovery plan decides what the summary charges you after the fight: retraining pays silver
            (and the monsters&apos; revive gold, since monsters cannot be retrained), reviving pays gold
            through your temple.
          </p>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <IntegerField
            label="Leadership"
            hint={POOL_HINTS.leadership}
            value={housing.leadership}
            max={100_000_000}
            onChange={(value) => {
              updateActiveSetup({ housing: { ...housing, leadership: value } });
            }}
          />
          <IntegerField
            label="Authority"
            hint={POOL_HINTS.authority}
            value={housing.authority}
            max={100_000_000}
            onChange={(value) => {
              updateActiveSetup({ housing: { ...housing, authority: value } });
            }}
          />
          <IntegerField
            label="Dominance"
            hint={POOL_HINTS.dominance}
            value={housing.dominance}
            max={100_000_000}
            onChange={(value) => {
              updateActiveSetup({ housing: { ...housing, dominance: value } });
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-muted text-xs font-medium">Priority</span>
            <NativeSelect
              label="Priority"
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
            <span className="text-muted text-xs font-medium">Recovery plan</span>
            <NativeSelect
              label="Recovery plan"
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
            {searchExcluded.length === 1 ? '' : 's'} out of this formation:{' '}
            {searchExcluded.map((id) => unitName(id, requestUnits)).join(', ')}.
          </HelpNote>
        )}

        {error !== null && <HelpNote tone="danger">{error}</HelpNote>}

        <HelpNote>
          Model confidence: stack sizes and per-hit damage reproduce the captured runs and both in-game
          reports; the average, the strike-two-squads chance and part of the recovery cost are still modelled
          rather than measured.{' '}
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
                modelNotes ?? ['Generate a stack to see the notes the engine attaches to its own numbers.']
              ).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Popover>
        </HelpNote>

        <div
          className={
            'border-line bg-surface sticky bottom-0 z-20 -mx-3 -mb-3 border-t px-3 py-3 ' +
            'sm:-mx-4 sm:-mb-4 sm:px-4 md:static md:m-0 md:border-0 md:bg-transparent md:p-0'
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" disabled={running} onClick={() => void runGenerate()}>
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
            {searching && (
              <p className="text-muted text-xs" role="status">
                {progress === null
                  ? 'Trying formations…'
                  : `Tried ${amount(progress.evaluated)} formations — best ${score(progress.bestScore)}`}
              </p>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
