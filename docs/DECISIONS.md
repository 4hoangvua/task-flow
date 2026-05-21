# Decisions

Record important architectural, design, or implementation choices here so future agents (and humans) understand WHY specific paths were chosen.

## Template

```
### D-XXX: Title

**Date:** YYYY-MM-DD
**Context:** What problem or question came up?
**Decision:** What did we choose?
**Why:** Why this over other options?
```

## Log

### D-001: Expanded Spec with Default Decisions

**Date:** 2026-05-20
**Context:** Original task-flow.md had critical gaps (broken Prisma relations, missing models, incomplete API, no auth flow). Several open questions existed (Member dashboard? Register role? ADMIN panel? JWT strategy?).
**Decision:** Applied reasonable defaults to unblock development:
- Member gets simplified personal dashboard (not redirected away)
- Register defaults to MEMBER role (LEADER/ADMIN assigned manually)
- No separate Admin Panel (ADMIN uses same UI with elevated permissions)
- JWT: Access Token (15m, in memory) + Refresh Token (7d, localStorage)
- Added REVIEW status to TaskStatus enum for 4-column Kanban
- Added URGENT to Priority enum
- ProjectDetail uses Tabs (Overview | Board | Members | Settings)
**Why:** Waiting for human answers on all questions would delay the entire project. These defaults are the most common patterns for task management apps and can be adjusted later.
