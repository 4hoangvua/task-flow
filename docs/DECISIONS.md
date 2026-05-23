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

### D-002: SQLite for Local Development

**Date:** 2026-05-21
**Context:** Local PostgreSQL and Docker environments are not running on the system, which blocked database migrations and verification of the backend and frontend.
**Decision:** Migrated the Prisma database provider to SQLite using a local file database (`dev.db`), and converted custom schema enums to SQLite-compatible String types.
**Why:** Enables running the database, migrations, and seeding scripts locally. This provides a self-contained, lightweight development and testing workspace that works out-of-the-box. The schema can easily be pointed back to PostgreSQL for production environments.

### D-003: Frontend Role-Based Access Control (RBAC) Alignment

**Date:** 2026-05-21
**Context:** The application UI had some visual actions (like settings tab, inviting members, updating task status, editing tasks, deleting members) visible to normal project members even though the backend correctly restricts these operations. This can lead to confusing UI interactions (clicks that end up failing with API errors).
**Decision:** Fully align the frontend UI with backend RBAC checks:
- Hide "Create Project" button on Projects list page for global `MEMBER`s.
- Hide "Settings" tab in `ProjectDetail` for non-leaders.
- Hide Member invitation and delete/role change actions for non-leaders.
- Hide "Add Task" buttons on Task board and column headers for non-leaders.
- Hide "Edit Task" and "Delete Task" in Task details modal for non-leaders.
- Disable changing task status dropdown unless the user is the project leader/admin OR the task assignee.
- Block drag-and-drop column transitions unless the user is the project leader/admin OR the task assignee.
**Why:** Improves UX by hiding options that users don't have access to execute, preventing "permission denied" error popups and enhancing security and interface cleanliness.

### D-004: Kanban DragOverlay and Backend Permissions Synchronization

**Date:** 2026-05-23
**Context:** Dragging task cards inside overflow-y scrollable columns caused visual clipping and hiding of the active card. In addition, the backend `/reorder` endpoint lacked permission checks for column status changes, leaving a security mismatch between frontend and backend.
**Decision:** Refactored the Kanban board to use a visual-only `<TaskCard>` rendering inside `@dnd-kit`'s `<DragOverlay>` (mounted to viewport body), escaping container clipping. Synchronized backend permissions inside the `reorderTasks` controller to deny status changes (column transitions) unless the caller is a Project Leader, Owner, Admin, or the task assignee.
**Why:** Fixes the UI clipping bug natively while maintaining a clean, floaty feel. Resolves the security gap between frontend client-side validation and backend API enforcement.

