# Performance Fix Implementation

## Context
- **Playbook:** Performance
- **Agent:** pyrrhic
- **Project:** /home/remi/projects/pyrrhic-totalbattle
- **Auto Run Folder:** /home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks
- **Loop:** 00001

## Objective

Implement ONE performance fix from `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md` that has status `PENDING`. Log all changes to `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/PERF_LOG_pyrrhic_2026-10-09.md`.

## Instructions

1. **Read `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md`** to find evaluated performance fixes
2. **Filter for actionable items**: Only consider fixes where:
   - **Status = `PENDING`** (exactly - not `PENDING - MANUAL REVIEW` or `WON'T DO`)
   - Complexity is in `[AUTO_IMPLEMENT_COMPLEXITY]` and gain is in `[AUTO_IMPLEMENT_GAIN]`
3. **Select ONE fix** that meets the criteria (prefer higher gain when ties)
4. **Implement the fix**: Make the code changes as specified in the proposed fix
5. **Verify the change**: Ensure the code still works (syntax check, no obvious errors)
6. **Log the change** to `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/PERF_LOG_pyrrhic_2026-10-09.md`
7. **Update status** in `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md` to `IMPLEMENTED`

## Task

- [x] **Read configured values**: Read the agent prompt for `[AUTO_IMPLEMENT_COMPLEXITY]` and `[AUTO_IMPLEMENT_GAIN]`. Use these values throughout this playbook wherever you see the corresponding placeholders.
  - Note: no `[AUTO_IMPLEMENT_COMPLEXITY]` / `[AUTO_IMPLEMENT_GAIN]` values in the agent prompt; no policy filter applied (same as earlier docs).

- [x] **Implement one PENDING fix (or skip if none)**: Read /home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md. If the file doesn't exist OR contains no items with status exactly `PENDING`, mark this task complete without changes. Otherwise, find an item with status exactly `PENDING`, implement the fix, log to /home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/PERF_LOG_pyrrhic_2026-10-09.md, and mark as IMPLEMENTED in /home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md.
  - Note: `LOOP_00001_PLAN.md` has no item with status exactly `PENDING` (only Finding 2, WON'T DO). No code changed; logged "No PENDING fixes available" in `PERF_LOG_pyrrhic_2026-10-09.md`.

## Implementation Checklist

Before implementing, verify:
- [ ] The status is exactly `PENDING` (not `PENDING - MANUAL REVIEW`)
- [ ] The fix is clearly specified with before/after code
- [ ] No other changes are required (no dependencies)

## Output Format

Append to `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/PERF_LOG_pyrrhic_2026-10-09.md` using this format:

```markdown
---

## [YYYY-MM-DD HH:MM] - [Brief Title]

**Agent:** pyrrhic
**Project:** pyrrhic
**Loop:** 00001
**File:** `path/to/file.ext`
**Line(s):** [line numbers affected]
**Change Type:** [caching | algorithm optimization | lazy loading | etc.]

### What Was Changed
[1-2 sentence description of the change]

### Before
```[language]
// Original code
```

### After
```[language]
// New code
```

### Expected Impact
[Brief description of expected performance improvement]

### Verification
- [ ] Code compiles/parses without errors
- [ ] No linter errors introduced
- [ ] Change matches the proposed fix from LOOP_00001_PLAN.md
```

## Guidelines

- **Only `PENDING` items**: Do NOT implement `PENDING - MANUAL REVIEW` or `WON'T DO` items
- **One fix per run**: Implement exactly ONE fix, then stop. This keeps changes small and reviewable.
- **Follow the plan**: Implement exactly what was proposed in `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md`, don't improvise
- **Update both files**: Log to `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/PERF_LOG_pyrrhic_2026-10-09.md` AND update status in `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md`
- **Be conservative**: If anything is unclear about the fix, skip it and note why in the log file

## How to Know You're Done

This task is complete when ONE of the following is true:

**Option A - Implemented a fix:**
1. You've implemented exactly ONE fix from `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md`
2. You've appended the change details to `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/PERF_LOG_pyrrhic_2026-10-09.md`
3. You've updated the item status in `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md` to `IMPLEMENTED`

**Option B - No PENDING fixes available:**
1. `LOOP_00001_PLAN.md` doesn't exist, OR
2. It contains no items with status exactly `PENDING`
3. Mark this task complete without making changes

This graceful handling allows the pipeline to continue when a loop iteration produces no actionable fixes.

## When No Fixes Are Available

If there are no items with status exactly `PENDING` in the plan file, append to `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/PERF_LOG_pyrrhic_2026-10-09.md`:

```markdown
---

## [YYYY-MM-DD HH:MM] - Loop 00001 Complete

**Agent:** pyrrhic
**Project:** pyrrhic
**Loop:** 00001
**Status:** No PENDING fixes available

**Summary:**
- Items IMPLEMENTED: [count]
- Items WON'T DO: [count]
- Items PENDING - MANUAL REVIEW: [count]

**Recommendation:** [Either "All automatable wins implemented" or "Remaining items need manual review"]
```

This signals to the pipeline that this loop iteration is complete.
