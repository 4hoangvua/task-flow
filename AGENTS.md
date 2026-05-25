# Agent Guide

Copy this file to your project root as `AGENTS.md` when starting a new project.

## Read Order

1. This file — how agents work.
2. `task-flow.md` — complete technical spec, folder structure, libraries, known fixes & gotchas.
3. `.agents/rules/analysis.md` — guidelines for core tech stack and libraries (antd, zustand, query, etc.) to stick to during research.
4. `docs/PLAN.md` — what we're building and what's next.
5. `docs/PROGRESS.md` — what's done and what's proven.
6. `docs/DECISIONS.md` — why important choices were made.
7. `docs/analysis/` — daily detailed research analysis files.
8. `docs/changelogs/` — daily logs of UI/styling/config fixes (read the latest file for recent context).
9. `docs/testing/` — daily functional testing logs to confirm no runtime issues.
10. The user prompt — what the human wants right now.

## Task Loop

For every task:

1. Read the user's request.
2. Check `PLAN.md` for context — does this fit an existing feature?
3. Classify: is this **tiny** (quick fix), **normal** (a feature), or **big** (risky/multi-part)?
4. Do the work.
5. Update `PLAN.md`, `PROGRESS.md`, or `DECISIONS.md` if anything changed.
6. If the work involved UI/styling/config fixes, update `docs/changelogs/YYYY-MM-DD.md`.
7. Say "Đã xong" and reference the changelog file date for fixes, or outline what was done/skipped for new features.

## Development Rules

- **Do NOT run `npm run build`** in the frontend unless explicitly requested. Only use `npm run dev` for local development.
- **Do NOT push to GitHub** unless the user explicitly requests it.
- **Port Conflicts:** Before starting any server, check if it is already running in background tasks (e.g. Node backend on port `5000`, Vite frontend on port `5173`) to avoid `EADDRINUSE` errors.
- **Tailwind v4:** Uses `@tailwindcss/vite` plugin. NO `tailwind.config.js`. CSS-first config via `@import "tailwindcss"` in `index.css`.
- **SQLite:** Prisma uses String columns instead of enums. Values enforced by Zod schemas.

## Changelog Rules

When fixing UI, styling, responsive layout, RBAC display, CORS, or any configuration issues:

1. **Create or update** `docs/changelogs/YYYY-MM-DD.md` (use today's date).
2. Document each fix/maintenance category as a checklist task group:
   - Use `### [x] Category Name` for headers.
   - Use `- [x] Technical task description` for detail items.
   - Avoid verbose explanations. Focus on technical clarity, listing modified files with absolute paths in the markdown link format (e.g. `[filename](file:///path/to/file)`).
3. **Update `docs/PLAN.md` section 3.1** with only a summary line (done/in-progress). Do NOT put detailed logs in PLAN.md.
4. This keeps PLAN.md clean and changelogs technical, readable for both developers and future AI agents.

## Testing Rules

For all new features or significant changes:

1. **Perform functional testing**: Test functional logic, API endpoints, permissions, and runtime code behaviors to ensure no API crashes, database errors, runtime logic bugs, or React Hook rule violations.
   - *Note*: Do NOT write code/script tests for the UI layout/visuals (giao diện) since using API call scripts to test visual UI is illogical. Automated testing code must only target APIs, business rules, and backend/frontend data integration logic.
2. **Create or update** `docs/testing/YYYY-MM-DD.md`.
3. Document each test case, expected results, actual results, and status (PASS/FAIL).
4. If testing fails, debug, fix, compile, and re-test until all cases pass 100%.


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
- You confirmed completion (For fixes, say "Đã xong" and reference the changelog file date).

## Communication Rules

- **Conciseness on Done**: When replying to the user after completing repair, UI, styling, or configuration fixes, simply state "Đã xong" (Done) and reference the specific changelog date (e.g. `docs/changelogs/YYYY-MM-DD.md`). Do NOT write long summaries of what was modified.
- **Exceptions**: This brevity rule does NOT apply when asking the user questions, seeking clarification, or design approval.
