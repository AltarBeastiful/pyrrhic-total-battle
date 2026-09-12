# ADR-0003 — Application stack

Status: Accepted (2026-09-12)

## Context
A single-page calculator with ~10 form sections, many small editors (popovers, drag-to-reorder lists, searchable
pickers), a results view, and a pure computation core that must be unit-testable and run off the main thread.
Contributors will be hobbyist players; familiarity matters more than novelty. Must build to static files.

## Options considered
| Concern | Chosen | Alternatives and why not |
|---|---|---|
| Build tool | **Vite** | Next.js/Remix: server-oriented, SSR machinery we do not need. Parcel/webpack: fine but Vite is the current default, has first-class worker (`new Worker(new URL(...), {type:'module'})`) and Vitest integration. |
| UI framework | **React 19 + TypeScript (strict)** | Svelte 5 / SolidJS: smaller bundles and nice ergonomics, but a smaller contributor pool and fewer drop-in libraries for drag-and-drop and accessible popovers. Preact + compat: could be adopted later as a build-time swap if bundle size matters (it should not: no heavy deps). Vanilla TS: too much hand-written DOM for ~40 editors. |
| Styling | **Tailwind CSS v4** | CSS Modules / vanilla CSS: workable, but Tailwind gives consistent spacing/colour tokens and dark mode with the least ceremony; shadcn-style components are copied into the repo (no runtime UI framework dependency). |
| Accessible primitives | **Radix UI primitives** (Popover, Dialog, Select, Tabs, Tooltip) | Headless UI (fewer components), hand-rolled (accessibility is easy to get wrong). |
| Drag and drop | **dnd-kit** | react-beautiful-dnd (unmaintained), HTML5 DnD (poor on touch). |
| State | **Zustand** with `persist` middleware and selectors | React context + useReducer: the config is one large object edited from many places; context re-renders everything on each keystroke unless split by hand. Redux Toolkit: more ceremony than needed. Jotai/Valtio: fine too; Zustand is the simplest with a persistence story built in. |
| Validation / schemas | **zod** | Valibot (smaller, less known), TypeBox, hand-written guards. zod gives types + runtime validation for stored data, imports and share links in one place. |
| Unit tests | **Vitest** | Jest: slower with Vite/ESM. |
| E2E smoke | **Playwright** (a handful of flows) | Cypress: heavier. |
| Lint/format | ESLint (typescript-eslint, react-hooks) + Prettier | Biome: attractive single tool; revisit when Tailwind class sorting is supported to our satisfaction. |
| Charts | none in v1 | The summary is numbers and a hit list; avoid a charting dependency until a story needs one. |

## Decision
Vite + React 19 + TypeScript strict, Tailwind v4, Radix primitives, dnd-kit, Zustand, zod, Vitest, Playwright,
ESLint + Prettier, pnpm as package manager, Node LTS. No UI kit as a runtime dependency; components live in
`src/ui/primitives`.

## Consequences
- Familiar stack for most web contributors; abundant documentation.
- The engine (`src/engine`) has **no** dependency on any of the above (plain TS, tested by Vitest), so the UI
  layer could be replaced without touching the math.
- Keep the dependency list short and audited; every new runtime dependency needs a one-line justification in the PR.
