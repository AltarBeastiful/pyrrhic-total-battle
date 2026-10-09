---
type: reference
title: "B-06 Remove em dashes from the UI (and perhaps every file)"
created: 2026-10-09
tags: [backlog, wording, ui]
related: ['[[00-inventory]]', 'T-15']
---

# B-06 Remove em dashes from the UI (and perhaps every file)

## Context

Measured 2026-10-09: 2,483 em dashes in `src/`, 1,089 in `src/ui` non-test code, about 120 on lines that are not obvious comments (JSX text and strings); 2,642 in `docs/*.md`; 1 in `todos.md`.

## Problem

The owner does not want em dashes in the UI, perhaps nowhere.

## Proposal

Phase one: rewrite the user-visible strings only (about 120 lines). Phase two, only on the owner's say: comments and docs, mechanically.

## First step

List the candidate lines to `tools/theorycraft/out/em-dash-ui-lines.md` so the owner sees what changes before the rewrite.

## Acceptance criteria

- [ ] No em dash appears in rendered UI text (a grep guard over `src/ui` string literals and the e2e text).
- [ ] Tests that pin the old strings are updated, not loosened.
- [ ] Phase two is not started without an answer to the scope question.

## Design rules touched

Rule 26 (our own words, plain verbs). Do not rewrite history-bearing docs.

## Size

S: phase one is about 120 lines; phase two would be L and is blocked.

## Dependencies

None.

## Open questions for the owner

1. Scope: UI strings only, or also comments and docs? (also in [[03-needs-owner]])
