import { CaptainTile } from '../../domain';
import { Grid } from '../../layout';
import type { KitStory } from '../story';

const noop = () => {};

const story: KitStory = {
  name: 'CaptainTile',
  group: 'domain',
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-muted text-sm">the four states, as the grid lays them out</p>
        <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap={2}>
          <CaptainTile
            name="Beowulf"
            bonusKey="army"
            meta="Army"
            isEnlisted
            onEnlist={noop}
            badge={{ text: '20 ★3', isSet: true, onPress: noop }}
          />
          <CaptainTile
            name="Aydae"
            bonusKey="guardsmen"
            meta="Guardsmen"
            isEnlisted={false}
            onEnlist={noop}
            badge={{ text: 'Set level', isSet: false, onPress: noop }}
          />
          <CaptainTile name="Hercules" meta="No stack bonus" isEnlisted={false} onEnlist={noop} />
          <CaptainTile name="Tengel" meta="No stack bonus" isEnlisted onEnlist={noop} />
        </Grid>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-muted text-sm">the hero, and one tile per key a captain can boost</p>
        <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap={2}>
          <CaptainTile
            name="Svyatogor"
            bonusKey="army"
            meta="Army"
            isEnlisted
            onEnlist={noop}
            badge={{ text: 'Change hero', isSet: true, label: 'Change the hero', onPress: noop }}
          />
          {(
            [
              ['Leonidas', 'melee', 'Melee'],
              ['Bernard', 'ranged', 'Ranged'],
              ['Alexander', 'mounted', 'Mounted'],
              ['Brunhild', 'flying', 'Flying'],
              ['Logos', 'specialist', 'Specialists'],
              ['Brann', 'engineers', 'Engineers'],
              ['Ingrid', 'monster', 'Monsters'],
            ] as const
          ).map(([name, bonusKey, meta]) => (
            <CaptainTile
              key={name}
              name={name}
              bonusKey={bonusKey}
              meta={meta}
              isEnlisted={false}
              onEnlist={noop}
              badge={{ text: '12 ★1', isSet: true, onPress: noop }}
            />
          ))}
        </Grid>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-muted text-sm">a long name, at the width a phone gives a tile</p>
        <Grid cols={2} gap={2}>
          <CaptainTile
            name="Ye Ho-Sung"
            bonusKey="melee"
            meta="Melee"
            isEnlisted={false}
            onEnlist={noop}
            badge={{ text: '120 ★6', isSet: true, onPress: noop }}
          />
          <CaptainTile
            name="Xi Guiying"
            bonusKey="ranged"
            meta="Ranged"
            isEnlisted
            onEnlist={noop}
            badge={{ text: 'Set level', isSet: false, onPress: noop }}
          />
        </Grid>
      </div>
    </div>
  ),
};

export default story;
