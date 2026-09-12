/**
 * S-13 — the custom kill-order editor.
 *
 * The list is a dnd-kit sortable so a mouse or a finger can drag a stack to a new position, and every row
 * also carries plain "move up" / "move down" buttons. That is not a nicety: dragging is the part of this
 * screen a keyboard or a screen reader handles worst, and the buttons are the guaranteed path (the drag
 * handle itself is keyboard-operable through dnd-kit's keyboard sensor, space to pick up, arrows to move).
 */
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { CSSProperties } from 'react';

import type { UnitDef } from '@/data/types';

import { ChevronDownIcon, ChevronUpIcon, PoolBadge, UnitBadge } from '../../icons';
import type { BadgeGroup } from '../../icons';
import { IconButton, cn } from '../../primitives';

/** Drag handle glyph, in the same inline-SVG style as `src/ui/icons.tsx` (which this story does not own). */
function GripIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      width="1.15em"
      height="1.15em"
    >
      <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />
    </svg>
  );
}

/** Mercenaries without a role tag still need a ring colour; their pool decides it. */
function badgeGroup(unit: UnitDef): BadgeGroup {
  if (unit.group !== undefined) return unit.group;
  return unit.pool === 'leadership' ? 'guardsmen' : 'monster';
}

export interface KillOrderListProps {
  /** Unit ids, first to die first. */
  order: string[];
  /** Every unit in `order`, by id. */
  units: Map<string, UnitDef>;
  onChange: (order: string[]) => void;
}

export function KillOrderList({ order, units, onChange }: KillOrderListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const move = (from: number, to: number): void => {
    if (to < 0 || to >= order.length || from === to) return;
    onChange(arrayMove(order, from, to));
  };

  const onDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (over === null || active.id === over.id) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onChange(arrayMove(order, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className="space-y-1">
          {order.map((id, index) => {
            const unit = units.get(id);
            if (unit === undefined) return null;
            return (
              <SortableRow
                key={id}
                unit={unit}
                index={index}
                total={order.length}
                onMove={(to) => {
                  move(index, to);
                }}
              />
            );
          })}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

interface SortableRowProps {
  unit: UnitDef;
  index: number;
  total: number;
  onMove: (to: number) => void;
}

function SortableRow({ unit, index, total, onMove }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: unit.id,
  });

  const style: CSSProperties = {};
  if (transform) style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0)`;
  if (transition) style.transition = transition;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-line bg-surface flex items-center gap-1.5 rounded-lg border px-1.5 py-1',
        isDragging && 'border-accent shadow-pop opacity-80',
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${unit.name}`}
        className="text-muted hover:text-accent tap flex w-9 shrink-0 cursor-grab items-center justify-center sm:w-7"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      <span className="text-muted nums w-5 shrink-0 text-right text-xs">{index + 1}</span>
      <UnitBadge
        group={badgeGroup(unit)}
        {...(unit.category === undefined ? {} : { category: unit.category })}
        tier={unit.tier}
        size="sm"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{unit.name}</span>
      <span className="text-muted nums hidden shrink-0 text-xs sm:inline">{unit.label}</span>
      <span className="hidden shrink-0 sm:inline-flex">
        <PoolBadge pool={unit.pool} size="sm" />
      </span>
      <IconButton
        label={`Move ${unit.name} up`}
        icon={<ChevronUpIcon />}
        size="sm"
        disabled={index === 0}
        onClick={() => {
          onMove(index - 1);
        }}
      />
      <IconButton
        label={`Move ${unit.name} down`}
        icon={<ChevronDownIcon />}
        size="sm"
        disabled={index === total - 1}
        onClick={() => {
          onMove(index + 1);
        }}
      />
    </li>
  );
}
