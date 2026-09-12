/**
 * The kit page (`/#kit`, dev only — `docs/plans/ui-foundation.md` §5). Every story under
 * `./stories` is rendered twice, light and dark, at a width you pick; this is the surface the owner
 * reviews a phase on and the surface `pnpm test:visual` screenshots and runs axe against.
 */
import { useEffect, useState } from 'react';

import type { KitStory } from './story';
import { mirrorThemeTokens } from './themeMirror';

/** Groups appear in this order; within a group, stories are sorted by name. */
const GROUP_ORDER: readonly KitStory['group'][] = ['kit', 'layout', 'domain', 'shell'];

/** The three frames the design plan reviews everything at. */
const WIDTHS = [390, 768, 1280] as const;

const modules = import.meta.glob<{ default: KitStory }>('./stories/*.story.tsx', { eager: true });

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface Entry {
  id: string;
  story: KitStory;
}

const entries: Entry[] = Object.values(modules)
  .map((module) => module.default)
  .filter((story): story is KitStory => Boolean(story))
  .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.name.localeCompare(b.name))
  .map((story) => ({ id: `${slug(story.group)}-${slug(story.name)}`, story }));

const WRAPPER = 'bg-bg text-fg rounded-card border-line min-w-0 border p-4';

export function KitPage() {
  const [width, setWidth] = useState<number>(1280);

  // The palettes live on `:root` only; the nested previews need them on themselves.
  useEffect(() => {
    mirrorThemeTokens();
  }, []);

  return (
    <div className="bg-bg text-fg min-h-dvh">
      <header className="border-line border-b px-4 py-4 sm:px-6">
        <h1 className="text-xl">Pyrrhic kit</h1>
        <p className="text-muted text-sm">
          {entries.length} stories, each shown light and dark. Development build only.
        </p>
        <div role="group" aria-label="Story width" className="mt-3 flex flex-wrap gap-2">
          {WIDTHS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === width}
              onClick={() => setWidth(option)}
              className="border-field rounded-card aria-pressed:bg-accent aria-pressed:text-accent-fg border px-3 py-1 text-sm"
            >
              {option} px
            </button>
          ))}
        </div>
      </header>

      <nav aria-labelledby="kit-contents" className="border-line border-b px-4 py-4 sm:px-6">
        <h2 id="kit-contents" className="text-lg">
          Contents
        </h2>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {entries.map(({ id, story }) => (
            <li key={id}>
              <a href={`#${id}`} className="text-accent underline">
                {story.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main className="px-4 pb-24 sm:px-6">
        <div className="mx-auto flex flex-col gap-10 pt-6" style={{ maxWidth: `${width}px` }}>
          {entries.length === 0 ? (
            <p className="text-muted text-sm">No stories yet.</p>
          ) : (
            entries.map(({ id, story }) => (
              <section key={id} id={id} data-story={id} aria-labelledby={`${id}-label`}>
                <h2 id={`${id}-label`} className="mb-2 text-lg">
                  {story.name} <span className="text-muted font-sans text-xs">{story.group}</span>
                </h2>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div data-theme="light" className={WRAPPER}>
                    {story.render()}
                  </div>
                  <div data-theme="dark" className={WRAPPER}>
                    {story.render()}
                  </div>
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
