# Agent Guide

Copy this file to your project root as `AGENTS.md` when starting a new project.

## Read Order

1. This file — how agents work.
2. `docs/PLAN.md` — what we're building and what's next.
3. `docs/PROGRESS.md` — what's done and what's proven.
4. `docs/DECISIONS.md` — why important choices were made.
5. The user prompt — what the human wants right now.

## Task Loop

For every task:

1. Read the user's request.
2. Check `PLAN.md` for context — does this fit an existing feature?
3. Classify: is this **tiny** (quick fix), **normal** (a feature), or **big** (risky/multi-part)?
4. Do the work.
5. Update `PLAN.md`, `PROGRESS.md`, or `DECISIONS.md` if anything changed.
6. Say what you did and what you didn't attempt.

## Size Rules

### Tiny

Quick fixes, typos, small style changes, doc updates.
→ Just do it. Update docs if needed.

### Normal

A single feature or behavior change.
→ Add a row to `PROGRESS.md`. Implement. Mark done.

### Big

Touches auth, data model, security, or multiple features at once.
→ Add to `PLAN.md` first. Ask the human before starting if direction is unclear.
→ Record the decision in `DECISIONS.md`.

## When To Ask The Human

- Changing what the product does (not just how).
- Removing features or validation.
- Choosing between two very different approaches.
- Anything touching login, passwords, payments, or user data.

## Done Definition

A task is done when:

- The requested work is completed or the blocker is documented.
- `PLAN.md` and `PROGRESS.md` are up to date.
- You said what changed and what was skipped.
