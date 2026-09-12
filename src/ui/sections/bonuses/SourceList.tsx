/**
 * One group of bonus sources, as a titled list of rows (design plan §7.3).
 *
 * A source is a **row**, not a chip: a switch on the left carrying the source's own name, what it is
 * worth on the right in tabular figures, and a gear at the end opening its editor. The switch's
 * button fills the line, so the row is the target everywhere except on the value and on the gear.
 * A permanent source counts on every march and has no switch at all — it wears the tack that means
 * "on every march" everywhere else in the app.
 *
 * The caption under the title is where the game's own limits are said out loud ("2 of 3 captains
 * on"), and the button at the end of the list is how the group grows.
 */
import { setActiveFlag, toggleActiveSource } from '@/state/actions/bonuses';
import { Button, IconButton, Switch } from '@/ui/kit';
import { Stack } from '@/ui/layout';

import { GearIcon, PinIcon, PlusIcon } from '../../icons';
import type { EditorTarget, SourceGroup, SourceRow, ToggleTarget } from './rows';

/**
 * The switch's own name is the only thing in a row that may be cut short; the value carries its
 * full text as a title. The kit's `Switch` renders a `<label>` holding the hidden input, the track
 * and the name, so the name is that label's last child.
 */
const TRUNCATE_LABEL = '[&>label>span:last-child]:truncate';

function apply(target: ToggleTarget, on: boolean): void {
  if ('flag' in target) setActiveFlag(target.flag, on);
  else toggleActiveSource(target.list, target.id, on);
}

function Row({ row, onEdit }: { row: SourceRow; onEdit: (target: EditorTarget) => void }) {
  const value = row.value === '' ? 'nothing yet' : row.value;
  return (
    <li className="border-line flex items-center gap-1 border-b last:border-b-0 sm:gap-2">
      {row.locked === true ? (
        <span className="text-fg flex min-h-11 min-w-0 flex-1 items-center gap-3 text-sm font-medium sm:min-h-10">
          <PinIcon className="text-muted shrink-0" />
          <span className="truncate">{row.name}</span>
        </span>
      ) : (
        <Switch
          label={row.name}
          isSelected={row.on}
          isDisabled={row.isDisabled ?? false}
          className={`min-w-0 flex-1 ${TRUNCATE_LABEL}`}
          onChange={(on) => {
            if (row.toggle !== undefined) apply(row.toggle, on);
          }}
        />
      )}
      {/*
        The name and the value share the room that is left over equally (`flex-1` on both, from a
        zero basis), so a long value can never squeeze a source's own name out of its row; each
        wears the ellipsis when it runs out, and the full text stays in its `title`.
      */}
      <span className="text-muted nums min-w-0 flex-1 truncate text-right text-xs sm:text-sm" title={value}>
        {value}
      </span>
      {row.editor === undefined ? (
        // A row with nothing to edit keeps the gear's room, so every value in a list lines up.
        <span aria-hidden="true" className="w-11 shrink-0 sm:w-8" />
      ) : (
        <IconButton
          label={`Edit ${row.name}`}
          size="sm"
          onPress={() => {
            if (row.editor !== undefined) onEdit(row.editor);
          }}
        >
          <GearIcon />
        </IconButton>
      )}
    </li>
  );
}

export interface SourceListProps {
  group: SourceGroup;
  onEdit: (target: EditorTarget) => void;
  onAdd: (group: SourceGroup) => void;
}

export function SourceList({ group, onEdit, onAdd }: SourceListProps) {
  return (
    <Stack gap={1} as="section" aria-labelledby={`bonuses-${group.id}`}>
      <h4 id={`bonuses-${group.id}`} className="text-base font-medium">
        {group.title}
      </h4>
      {/* A group with no rows says what it is for instead of counting to zero. */}
      <p className="text-muted text-sm">{group.rows.length === 0 ? group.empty : group.caption}</p>
      {group.rows.length === 0 ? null : (
        <ul>
          {group.rows.map((row) => (
            <Row key={row.id} row={row} onEdit={onEdit} />
          ))}
        </ul>
      )}
      {group.add !== undefined && (
        <Button
          variant="quiet"
          size="sm"
          icon={<PlusIcon />}
          isDisabled={group.add.isDisabled}
          className="self-start"
          onPress={() => {
            onAdd(group);
          }}
        >
          {group.add.label}
        </Button>
      )}
    </Stack>
  );
}
