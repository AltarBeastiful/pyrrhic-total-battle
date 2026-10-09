# Performance Candidate Evaluation

## Context
- **Playbook:** Performance
- **Agent:** pyrrhic
- **Project:** /home/remi/projects/pyrrhic-totalbattle
- **Auto Run Folder:** /home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks
- **Loop:** 00001

## Objective

Evaluate candidates from `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_CANDIDATES.md`, assess the fix complexity and performance gain, and output actionable items to `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md`.

## Instructions

1. **Read `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_CANDIDATES.md`** to see discovered performance issues
2. **Read `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md`** (if it exists) to see which candidates have already been evaluated
3. **Select ONE unevaluated candidate** (one that doesn't appear in the plan yet)
4. **Investigate the fix**:
   - Read the actual code in the file
   - Understand what change would fix the issue
   - Assess the complexity and risk of making that change
   - Estimate the performance gain
5. **Document the evaluation** in `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md`

## Task

- [ ] **Read configured values**: Read the agent prompt for `[AUTO_IMPLEMENT_COMPLEXITY]` and `[AUTO_IMPLEMENT_GAIN]`. Use these values throughout this playbook wherever you see the corresponding placeholders.
  - Note: neither value appeared in the agent prompt; no policy filter applied (same as loop docs 1-2).

- [ ] **Evaluate one candidate (or skip if empty)**: Read /home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_CANDIDATES.md. If it contains no findings OR all findings have already been evaluated in LOOP_00001_PLAN.md, mark this task complete without changes. Otherwise, pick one unevaluated finding, investigate the fix, assess complexity/gain, and append to /home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md.
  - Done: evaluated Finding 2 (eager boot of all pool workers) -> WON'T DO - Low impact; boots are hidden behind the one-job baseline, lazy start would put them on the fan-out's critical path. Findings 1, 3-6 remain unevaluated.

## Rating Criteria

### Complexity Rating (effort + risk of breakage)

| Rating | Description |
|--------|-------------|
| **LOW** | Mechanical change, no behavioral impact. Examples: wrapping with useCallback, adding React.memo, extracting a constant. Safe to apply without deep understanding. |
| **MEDIUM** | Requires understanding of data flow. Examples: restructuring state, changing component hierarchy, modifying effect dependencies. Could introduce bugs if done wrong. |
| **HIGH** | Architectural change or touches critical paths. Examples: changing state management approach, refactoring core algorithms, modifying shared utilities. High risk of regression. |

### Gain Rating (expected performance improvement)

| Rating | Description |
|--------|-------------|
| **LOW** | Minor improvement, may not be noticeable. Affects rarely-rendered components or infrequent operations. |
| **MEDIUM** | Noticeable improvement in specific scenarios. Reduces re-renders in moderately-used components or optimizes common operations. |
| **HIGH** | Significant improvement in hot paths. Affects frequently-rendered components, large lists, or operations that run on every interaction. |

## Output Format

Append to `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md` using this format:

```markdown
---

## [Issue Title] - Evaluated [YYYY-MM-DD HH:MM]

**Source:** [Reference to the finding in LOOP_00001_CANDIDATES.md]
**File:** `path/to/file.ext`
**Line(s):** [line numbers]

### Current Code
```[language]
// Paste the problematic code snippet
```

### Proposed Fix
```[language]
// Show the fixed code
```

### Assessment
- **Complexity:** [LOW/MEDIUM/HIGH] - [Brief justification]
- **Gain:** [LOW/MEDIUM/HIGH] - [Brief justification]
- **Dependencies:** [Any files/components that would also need changes]

### Implementation Notes
[Any special considerations, edge cases, or testing requirements]

### Status: [PENDING | WON'T DO - reason]
```

## Guidelines

- **One candidate per run**: Only evaluate ONE finding, then stop. This allows incremental progress.
- **Read the actual code**: Don't guess - look at the real implementation
- **Be conservative with ratings**: When in doubt, rate complexity higher and gain lower
- **Include working code**: The proposed fix should be copy-paste ready
- **Consider side effects**: Note if the fix could affect other parts of the system

## Status Values

After evaluation, set the status based on the ratings:

| Complexity | Gain | Status |
|------------|------|--------|
| LOW | HIGH | `PENDING` - Ready for auto-implementation |
| LOW | MEDIUM | `PENDING` - Ready for auto-implementation |
| LOW | LOW | `WON'T DO - Low impact` |
| MEDIUM | HIGH | `PENDING - MANUAL REVIEW` - Too risky for auto-implementation |
| MEDIUM | MEDIUM | `WON'T DO - Risk/reward ratio unfavorable` |
| MEDIUM | LOW | `WON'T DO - Low impact, medium risk` |
| HIGH | * | `WON'T DO - Too complex for automation` |

**Important:** Items marked `WON'T DO` will not be revisited. Only `PENDING` items will be considered for implementation.

## How to Know You're Done

This task is complete when ONE of the following is true:

**Option A - Evaluated a candidate:**
1. You've evaluated exactly ONE candidate from `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_CANDIDATES.md`
2. You've appended a complete evaluation to `/home/remi/projects/pyrrhic-totalbattle/.maestro/playbooks/LOOP_00001_PLAN.md`
3. The evaluation includes both complexity and gain ratings
4. The status is set according to the table above

**Option B - No candidates to evaluate:**
1. `LOOP_00001_CANDIDATES.md` contains no findings, OR
2. All findings have already been evaluated in `LOOP_00001_PLAN.md`
3. Mark this task complete without making changes

This graceful handling of empty states prevents the pipeline from stalling when a tactic yields no candidates.
