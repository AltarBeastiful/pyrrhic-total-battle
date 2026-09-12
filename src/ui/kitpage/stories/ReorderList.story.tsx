import { useState } from 'react';

import { Badge, IconButton, ReorderItem, ReorderList } from '../../kit';
import { PinIcon } from '../../icons';
import type { KitStory } from '../story';

const ROWS: Record<string, { name: string; pool: string }> = {
  'archer-3': { name: 'Archer III', pool: 'Leadership' },
  'pikeman-2': { name: 'Pikeman II', pool: 'Leadership' },
  'bone-golem-6': { name: 'Bone Golem VI', pool: 'Dominance' },
  'bear-5': { name: 'Bear V', pool: 'Dominance' },
};

function Order() {
  const [order, setOrder] = useState(Object.keys(ROWS));

  return (
    <ReorderList label="Order of the fall" order={order} onReorder={setOrder}>
      {order.map((id) => {
        const row = ROWS[id];
        if (row === undefined) return null;
        return (
          <ReorderItem
            key={id}
            id={id}
            label={row.name}
            actions={
              <IconButton label={`Keep ${row.name} in the march`} size="sm">
                <PinIcon />
              </IconButton>
            }
          >
            <span className="min-w-0 flex-1 truncate">{row.name}</span>
            <Badge size="sm">{row.pool}</Badge>
          </ReorderItem>
        );
      })}
    </ReorderList>
  );
}

const story: KitStory = {
  name: 'ReorderList',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-4">
      <Order />
      <ReorderList
        label="Nothing to order"
        order={[]}
        onReorder={() => {}}
        emptyState="There is no stack to order yet."
      >
        {[]}
      </ReorderList>
    </div>
  ),
};

export default story;
