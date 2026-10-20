---
type: reference
title: "B-20 Drag a piece onto a set"
created: 2026-10-20
tags: [backlog, ui, bonuses, equipment, ready-for-agent]
related: ['[[README]]', '[[B-19-equipment-sets]]', '[[design-rules]]']
---

# B-20 Drag a piece onto a set

Status: ready-for-agent, after B-19 has shipped (it needs the sets and the move menu).

## Problem Statement

With sets in place, the move menu moves a piece reliably but takes a few taps. The owner wants to move one piece to another set by drag and drop when that is cheap.

## Solution

A piece can be dragged onto another set's card, or onto the "No set" card, and lands there. The move menu stays as the keyboard and touch route and keeps working untouched.

## User Stories

1. As a desktop player, I want to drag a piece onto another set, so that I move it in one gesture.
2. As a desktop player, I want to drag a piece onto "No set", so that I take it out of its set.
3. As a player, I want the drop target to show it will accept the piece while I drag, so that I know where it lands.
4. As a phone player, I want scrolling the row to keep working, so that dragging never traps a swipe.
5. As a keyboard or touch player, I want the move menu to remain, so that nothing depends on a mouse.
6. As a player, I want a piece dropped where it came from to change nothing, so that a slip is harmless.
7. As a player, I want a drag never to change what is switched on, so that moving is only regrouping.

## Implementation Decisions

- The drop calls the same "move piece to set X" action the menu calls: no data or schema change.
- The app has no drag-and-drop library (it left with the old kit, see the kill-order list notes). Choosing one, or writing pointer handling by hand, is the first decision of this item and is the owner's call.
- Touch: the gesture must not capture a scroll swipe; if it cannot be made safe on touch, it ships for pointer devices only and the menu stays the touch route.
- Drop targets: each set card and the "No set" card.

## Testing Decisions

- Behavioural tests at the Bonuses section seam: dropping a piece on a set moves it, on "No set" ungroups it, on its own set changes nothing, and the on/off state of every piece is unchanged. The move menu tests of B-19 stay as they are.
- A check that a vertical swipe on touch still scrolls (prior art: the existing e2e phone tests).

## Out of Scope

- Reordering pieces inside a set, dragging whole sets, any data change, any engine change.

## Further Notes

- If the library choice is heavy, the owner may drop this item; the menu alone fulfils B-19.
