/**
 * Sets of equipment (B-19). A set is the player's own grouping of pieces: it exists as long as one
 * piece carries its `setId`, and the only thing stored beside the pieces is the name the player gave it.
 * Nothing here touches what a total is made of: which pieces are on is still `setup.active.equipment`.
 */
import type { ProfileSources } from '../schema';
import { useStore } from '../store';
import { mintSourceId, removeSourceEntry, updateSources } from './bonuses';

/** A name that is only spaces is no name: the set goes back to being suggested one. */
const clean = (name: string): string => name.trim();

/**
 * The names worth keeping. A name is what makes an empty set exist, so a named set survives losing its
 * last piece; only a blank name goes, and a set dissolved on purpose is taken out by `withoutSet`.
 */
function prune(sources: ProfileSources): ProfileSources {
  const names = sources.equipmentSetNames;
  if (names === undefined) return sources;
  const alive = new Set(
    sources.equipment.flatMap((piece) => (piece.setId === undefined ? [] : [piece.setId])),
  );
  const kept = Object.entries(names).filter(([id, name]) => name !== '' || alive.has(id) === false);
  const named = kept.filter(([, name]) => name !== '');
  const { equipmentSetNames: _names, ...rest } = sources;
  return named.length === 0 ? rest : { ...rest, equipmentSetNames: Object.fromEntries(named) };
}

/** A set taken out of the names, as ungrouping or deleting it does. */
function withoutSet(sources: ProfileSources, setId: string): ProfileSources {
  const { [setId]: _gone, ...names } = sources.equipmentSetNames ?? {};
  return { ...sources, equipmentSetNames: names };
}

/** A fresh set id; the set exists once a piece is moved into it. */
export const mintSetId = (): string => mintSourceId();

/** Put one piece into a set, or take it out of any (`null`). */
export function moveToSet(profileId: string, pieceId: string, setId: string | null): void {
  updateSources(profileId, (sources) =>
    prune({
      ...sources,
      equipment: sources.equipment.map((piece) => {
        if (piece.id !== pieceId) return piece;
        const { setId: _old, ...rest } = piece;
        return setId === null ? rest : { ...rest, setId };
      }),
    }),
  );
}

/** Name a set; an empty name asks for the suggestion again. */
export function renameSet(profileId: string, setId: string, name: string): void {
  updateSources(profileId, (sources) => {
    // An empty set has no pieces to suggest a name from, so it keeps the one it has.
    if (clean(name) === '' && !sources.equipment.some((piece) => piece.setId === setId)) return sources;
    const names = { ...sources.equipmentSetNames, [setId]: clean(name) };
    return prune({ ...sources, equipmentSetNames: names });
  });
}

/** Dissolve a set and keep its pieces, which become loose. */
export function ungroupSet(profileId: string, setId: string): void {
  updateSources(profileId, (sources) =>
    prune(
      withoutSet(
        {
          ...sources,
          equipment: sources.equipment.map((piece) => {
            if (piece.setId !== setId) return piece;
            const { setId: _old, ...rest } = piece;
            return rest;
          }),
        },
        setId,
      ),
    ),
  );
}

/** An empty set the player can move pieces into: "New set", "New set 2"… the first title not worn yet. */
export function addEmptySet(profileId: string, takenNames: readonly string[]): void {
  let name = 'New set';
  for (let n = 2; takenNames.includes(name); n += 1) name = `New set ${String(n)}`;
  updateSources(profileId, (sources) => ({
    ...sources,
    equipmentSetNames: { ...sources.equipmentSetNames, [mintSetId()]: name },
  }));
}

/** Delete a set with every piece in it, switching them off in every battle setup. */
export function deleteSetAndPieces(profileId: string, setId: string): void {
  const profile = useStore.getState().doc.profiles.find((candidate) => candidate.id === profileId);
  const ids =
    profile?.sources.equipment.filter((piece) => piece.setId === setId).map((piece) => piece.id) ?? [];
  for (const id of ids) removeSourceEntry(profileId, 'equipment', id);
  updateSources(profileId, (sources) => prune(withoutSet(sources, setId)));
}

/** Switch every piece of a set on or off in the active setup, in one write. */
export function setPiecesOn(pieceIds: readonly string[], on: boolean): void {
  useStore.getState().updateActiveSetup((setup) => {
    const kept = setup.active.equipment.filter((id) => !pieceIds.includes(id));
    const equipment = on ? [...kept, ...pieceIds] : kept;
    return { active: { ...setup.active, equipment } };
  });
}
