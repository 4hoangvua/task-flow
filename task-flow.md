# 📘 TaskFlow – Prompt Workflow Technical Guide

## 1. TECH STACK SUMMARY (Actual – verified on 2026-05-21)

```yaml
Frontend:
  framework: React 19 + TypeScript 6 + Vite 8
  state_management:
    - Zustand 5 (global: auth, theme/UI)
    - TanStack Query v5 (server: tasks, projects, comments, notifications, stats)
    - useState (local UI: modals, filters, search text)
  UI: Ant Design 6 + TailwindCSS 4 (via @tailwindcss/vite plugin)
  routing: React Router DOM v7
  http: Axios 1.16
  realtime: Socket.io-client v4.8
  forms: React Hook Form 7 + Zod 4 (registered in dependencies but Ant Design Form used in practice)
  drag_drop: "@dnd-kit/core 6 + @dnd-kit/sortable 10 + @dnd-kit/utilities 3"
  charts: Recharts 3
  icons: "@ant-design/icons 6"

Backend:
  runtime: Node.js 20 LTS + Express 4.19 + TypeScript 5.4
  orm: Prisma 5.14 (client + CLI)
  database: SQLite (local development via file:./dev.db)
  auth: JWT (jsonwebtoken 9) + bcrypt 5
  realtime: Socket.io v4.7
  validation: Zod 3
  logging: Winston 3
  environment: dotenv 16
  cors: cors 2.8

Database:
  provider: sqlite (local dev), postgresql (production-ready schema)
  tables: User, Project, ProjectMember, Task, TaskHistory, Comment, Notification
  note: |
    Prisma enum types replaced with String columns for SQLite compatibility.
    Values enforced at application level (see validation schemas).
    Enum values: Role(ADMIN|LEADER|MEMBER), MemberRole(LEADER|MEMBER),
    TaskStatus(TODO|IN_PROGRESS|REVIEW|DONE), Priority(LOW|MEDIUM|HIGH|URGENT),
    ProjectStatus(ACTIVE|ARCHIVED), NotificationType(TASK_ASSIGNED|TASK_UPDATED|COMMENT_ADDED|DEADLINE_APPROACHING)

DevOps:
  linting: ESLint 10 (frontend only)
  containerization: Not yet configured (F10 planned)
```

---

## 2. FOLDER STRUCTURE (Actual – verified on 2026-05-21)

### Frontend (`frontend/src/`)
```
src/
├── api/                 # Axios endpoint wrappers
│   ├── authApi.ts       # login, register, refresh, logout, profile
│   ├── commentApi.ts    # getComments, createComment, deleteComment
│   ├── notificationApi.ts # getNotifications, markRead, markAllRead
│   ├── projectApi.ts    # CRUD projects + members (add/update role/delete)
│   ├── statsApi.ts      # project stats + personal summary
│   └── taskApi.ts       # CRUD tasks + updateStatus + reorderTasks
├── components/
│   └── task/            # Task-related components
│       ├── TaskBoard.tsx        # Kanban board with 4 columns + DnD + RBAC
│       ├── TaskDetailModal.tsx  # Task details view + comments + history + RBAC
│       └── TaskFormModal.tsx    # Create/Edit task form modal
├── config/
│   └── axios.ts         # Axios instance + request/response interceptors + auto-refresh
├── hooks/               # TanStack Query custom hooks
│   ├── useAuth.ts       # login/register/logout/updateProfile/changePassword
│   ├── useNotifications.ts  # notifications query + mark read mutations
│   ├── useProjects.ts   # useProjects + useProjectDetail + useProjectMembers
│   └── useTasks.ts      # useTasks (with optimistic reorder) + useTaskDetail
├── layouts/
│   ├── AuthLayout.tsx         # Centered card layout for login/register
│   └── DashboardLayout.tsx    # Sidebar + Header + NotificationBell + Avatar dropdown
├── pages/               # 8 page components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx         # KPI cards + charts (Leader) / personal stats (Member)
│   ├── Projects.tsx          # Grid/List toggle + search + filter + create modal
│   ├── ProjectDetail.tsx     # Tabs: Overview | Board | Members | Settings (RBAC)
│   ├── MyTasks.tsx           # Table of assigned tasks + status update
│   ├── Settings.tsx          # Profile form + password change + theme toggle
│   └── NotFound.tsx          # 404 page
├── providers/
│   ├── QueryProvider.tsx      # TanStack Query client provider
│   ├── SocketProvider.tsx     # Socket.io connection provider with JWT auth
│   └── ThemeProvider.tsx      # Ant Design ConfigProvider + dark/light theme
├── routes/
│   ├── PrivateRoute.tsx       # Redirect to /login if not authenticated
│   └── RoleGuard.tsx          # Redirect to /dashboard if role insufficient
├── stores/               # Zustand global stores
│   ├── authStore.ts      # user, accessToken, login/logout/setAccessToken
│   └── uiStore.ts        # sidebarCollapsed, theme (dark/light)
├── types/
│   └── index.ts          # All TypeScript interfaces: User, Project, Task, Comment, etc.
├── utils/
│   └── helpers.ts        # formatDate, getPriorityColor, getStatusColor, getRoleColor
├── App.tsx               # Main router setup
├── App.css               # Custom CSS overrides (Ant Design theme adjustments)
├── index.css             # Tailwind CSS v4 import + global resets
└── main.tsx              # React entry point
```

### Backend (`backend/src/`)
```
src/
├── controllers/          # Request handlers (no business logic separation – direct Prisma calls)
│   ├── authController.ts       # register, login, refresh, logout, getMe, updateMe, changePassword
│   ├── commentController.ts    # getComments, createComment, deleteComment
│   ├── notificationController.ts # getNotifications, markRead, markAllRead
│   ├── projectController.ts    # CRUD projects + addMember, updateMemberRole, deleteMember
│   ├── statsController.ts      # projectStats, mySummary
│   └── taskController.ts       # CRUD tasks + updateStatus + reorderTasks + Socket.io events
├── lib/
│   └── prisma.ts         # Prisma client singleton
├── middlewares/
│   ├── auth.ts           # JWT token verification middleware
│   ├── errorHandler.ts   # Centralized error response handler
│   └── rbac.ts           # Role-based access control middleware (project + global level)
├── routes/
│   ├── index.ts          # Main router – mounts all sub-routers under /api
│   ├── authRoutes.ts
│   ├── commentRoutes.ts
│   ├── notificationRoutes.ts
│   ├── projectRoutes.ts
│   ├── statsRoutes.ts
│   └── taskRoutes.ts
├── sockets/
│   └── socketHandler.ts  # Socket.io setup + JWT handshake auth + join/leave rooms
├── types/
│   └── express.d.ts      # Express Request augmentation (user property)
├── utils/
│   ├── errors.ts         # AppError class
│   ├── jwt.ts            # generateAccessToken, generateRefreshToken, verifyToken
│   ├── logger.ts         # Winston logger configuration
│   └── validation.ts     # Zod schemas for all API inputs
└── index.ts              # Express app + HTTP server + Socket.io + CORS setup

prisma/
├── schema.prisma         # Database models (SQLite provider, String columns for enums)
├── migrations/           # Prisma migration history
├── seed.ts               # Test data: Admin, Leader, Member users + 2 projects + sample tasks
└── dev.db                # SQLite database file (gitignored)
```

> **Note:** Backend does NOT have a `services/` layer or `config/` directory.
> Controllers interact directly with Prisma client. Configuration is handled
> via `.env` + `dotenv` in `index.ts` and utility files under `utils/`.

---

## 3. DATABASE SCHEMA (Actual Prisma – SQLite)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  avatar       String?
  role         String   @default("MEMBER")   // ADMIN | LEADER | MEMBER
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  projects      ProjectMember[]
  assignedTasks Task[]          @relation("TaskAssignee")
  createdTasks  Task[]          @relation("TaskCreator")
  comments      Comment[]
  notifications Notification[]
  taskHistory   TaskHistory[]
  ownedProjects Project[]
}

model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  status      String   @default("ACTIVE")    // ACTIVE | ARCHIVED
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  members     ProjectMember[]
  tasks       Task[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProjectMember {
  id        String   @id @default(uuid())
  projectId String
  userId    String
  role      String   @default("MEMBER")      // LEADER | MEMBER
  joinedAt  DateTime @default(now())
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])

  @@unique([projectId, userId])
}

model Task {
  id          String    @id @default(uuid())
  title       String
  description String?
  status      String    @default("TODO")     // TODO | IN_PROGRESS | REVIEW | DONE
  priority    String    @default("MEDIUM")   // LOW | MEDIUM | HIGH | URGENT
  order       Int       @default(0)
  deadline    DateTime?
  projectId   String
  assigneeId  String?
  creatorId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee    User?     @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  creator     User      @relation("TaskCreator", fields: [creatorId], references: [id])
  comments    Comment[]
  history     TaskHistory[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  taskId    String
  userId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TaskHistory {
  id        String   @id @default(uuid())
  taskId    String
  userId    String
  field     String   // e.g. "status", "priority", "assignee"
  oldValue  String?
  newValue  String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}

model Notification {
  id        String  @id @default(uuid())
  userId    String
  type      String  // TASK_ASSIGNED | TASK_UPDATED | COMMENT_ADDED | DEADLINE_APPROACHING
  title     String
  message   String
  taskId    String?
  projectId String?
  isRead    Boolean @default(false)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

---

## 4. API ENDPOINTS (full CRUD)

### Standard Response Format
```typescript
// Success
{ success: true, data: T, message?: string }
// Error
{ success: false, error: string, code: string, details?: any }
// Paginated
{ success: true, data: T[], meta: { page: number, limit: number, total: number, totalPages: number } }
```

### Auth
| Method | Endpoint | Body | Response | Auth |
|--------|----------|------|----------|------|
| POST | `/api/auth/register` | `{email, password, name}` | `{data: {user, accessToken, refreshToken}}` | No |
| POST | `/api/auth/login` | `{email, password}` | `{data: {user, accessToken, refreshToken}}` | No |
| POST | `/api/auth/refresh` | `{refreshToken}` | `{data: {accessToken}}` | No |
| POST | `/api/auth/logout` | - | `{message}` | Yes |
| GET | `/api/auth/me` | - | `{data: User}` | Yes |
| PATCH | `/api/auth/me` | `{name?, avatar?}` | `{data: User}` | Yes |
| PATCH | `/api/auth/password` | `{oldPassword, newPassword}` | `{message}` | Yes |

### Projects
| Method | Endpoint | Body/Query | Response | Access |
|--------|----------|------------|----------|--------|
| GET | `/api/projects` | `?status=&page=&limit=` | `{data: Project[], meta}` | All |
| POST | `/api/projects` | `{name, description?}` | `{data: Project}` | LEADER+ |
| GET | `/api/projects/:id` | - | `{data: Project}` | Member |
| PATCH | `/api/projects/:id` | `{name?, description?, status?}` | `{data: Project}` | Owner |
| DELETE | `/api/projects/:id` | - | `{message}` | Owner |

### Project Members
| Method | Endpoint | Body | Response | Access |
|--------|----------|------|----------|--------|
| GET | `/api/projects/:id/members` | - | `{data: Member[]}` | Member |
| POST | `/api/projects/:id/members` | `{email, role?}` | `{data: Member}` | LEADER |
| PATCH | `/api/projects/:id/members/:uid` | `{role}` | `{data: Member}` | LEADER |
| DELETE | `/api/projects/:id/members/:uid` | - | `{message}` | LEADER |

### Tasks
| Method | Endpoint | Body/Query | Response | Access |
|--------|----------|------------|----------|--------|
| GET | `/api/tasks` | `?projectId=&status=&assigneeId=&priority=&page=&limit=&sort=` | `{data: Task[], meta}` | Member |
| POST | `/api/tasks` | `{title, description?, projectId, assigneeId?, priority?, deadline?}` | `{data: Task}` | LEADER |
| GET | `/api/tasks/:id` | - | `{data: Task (includes comments, history)}` | Member |
| PATCH | `/api/tasks/:id` | `{title?, description?, priority?, deadline?, assigneeId?}` | `{data: Task}` | LEADER |
| DELETE | `/api/tasks/:id` | - | `{message}` | LEADER |
| PATCH | `/api/tasks/:id/status` | `{status}` | `{data: Task}` | Assignee/LEADER |
| PATCH | `/api/tasks/reorder` | `{taskId, newOrder, status}` | `{message}` | Member |

### Comments
| Method | Endpoint | Body | Response | Access |
|--------|----------|------|----------|--------|
| GET | `/api/tasks/:id/comments` | - | `{data: Comment[]}` | Member |
| POST | `/api/tasks/:id/comments` | `{content}` | `{data: Comment}` | Member |
| DELETE | `/api/comments/:id` | - | `{message}` | Author |

### Notifications
| Method | Endpoint | Body | Response | Access |
|--------|----------|------|----------|--------|
| GET | `/api/notifications` | `?page=&limit=` | `{data: Notification[], unreadCount}` | Self |
| PATCH | `/api/notifications/:id/read` | - | `{message}` | Self |
| PATCH | `/api/notifications/read-all` | - | `{message}` | Self |

### Stats / Dashboard
| Method | Endpoint | Response | Access |
|--------|----------|----------|--------|
| GET | `/api/stats/project/:id` | `{total, byStatus, byPriority, overdue, recentActivity[]}` | Member |
| GET | `/api/stats/my-summary` | `{assigned, completed, overdue}` | Self |

---

## 5. WEBSOCKET EVENTS (real-time)

```javascript
// === Connection (JWT-authenticated) ===
const socket = io(SOCKET_URL, {
  auth: { token: authStore.token },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

// === Client → Server ===
socket.emit('join-project', { projectId })   // join project room
socket.emit('leave-project', { projectId })  // leave project room

// === Server → Project Room ===
socket.on('task:created', (task) => { /* add to board */ })
socket.on('task:updated', ({ taskId, changes }) => { /* update card */ })
socket.on('task:deleted', ({ taskId }) => { /* remove from board */ })
socket.on('task:status-changed', ({ taskId, oldStatus, newStatus, userId }) => { /* move card */ })
socket.on('task:reordered', ({ taskId, newOrder, status }) => { /* reorder column */ })
socket.on('comment:added', ({ taskId, comment }) => { /* update detail modal */ })
socket.on('member:added', ({ projectId, member }) => { /* update member list */ })
socket.on('member:removed', ({ projectId, userId }) => { /* update member list */ })

// === Server → Specific User ===
socket.on('notification', (notification) => { /* show toast + update bell */ })

// === Error & Reconnection ===
socket.on('connect_error', (err) => { /* handle auth error, redirect login */ })
socket.io.on('reconnect', () => { /* rejoin active project rooms */ })
```

---

## 6. UI PAGES & LAYOUT

### Global Layout
```
┌──────────────────────────────────────────────────┐
│  Header: Logo | Search | NotificationBell | Avatar ▾  │
├──────────┬───────────────────────────────────────┤
│ Sidebar  │  Main Content Area                    │
│          │                                       │
│ - Dashboard                                      │
│ - Projects                                       │
│ - My Tasks                                       │
│ - Settings                                       │
└──────────┴───────────────────────────────────────┘
(Auth pages use separate AuthLayout: centered card, no sidebar)
```

### Page Details
| # | Page | Route | Layout | Purpose |
|---|------|-------|--------|---------|
| 1 | Login | `/login` | Auth | Email + password form, link to Register, error toast |
| 2 | Register | `/register` | Auth | Name + email + password + confirm, default role MEMBER |
| 3 | Dashboard | `/dashboard` | Dashboard | LEADER: 4 KPI cards + Bar chart + Pie chart + Recent activity. MEMBER: personal stats |
| 4 | Projects | `/projects` | Dashboard | Grid/List toggle, search + filter, "Create Project" (LEADER+ only via RBAC) |
| 5 | ProjectDetail | `/projects/:id` | Dashboard | Tabs: Overview \| Board \| Members \| Settings (Settings hidden for MEMBER) |
| 6 | TaskBoard | (embedded tab) | Dashboard | 4 columns: TODO → IN_PROGRESS → REVIEW → DONE, drag-drop + RBAC, "Add Task" (LEADER only) |
| 7 | MyTasks | `/my-tasks` | Dashboard | Table of assigned tasks with status dropdown |
| 8 | Settings | `/settings` | Dashboard | Profile form + Change password + Theme toggle |
| 9 | NotFound | `*` | Auth | 404 illustration + "Back to Dashboard" |

**Modals:** TaskDetailModal (view/edit + comments + history + RBAC), TaskFormModal (create/edit), Popconfirm (delete actions)

---

## 7. ENVIRONMENT VARIABLES

### Frontend
No `.env` file. Axios base URL defaults to `http://localhost:5000/api` via:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### Backend `.env`
```env
NODE_ENV=development
DATABASE_URL="postgresql://user:pass@localhost:5432/taskflow"   # Not used – SQLite via schema.prisma
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
CLIENT_URL="http://localhost:5173"
```

> **Note:** `EMAIL_USER` and `EMAIL_PASS` removed – Nodemailer is NOT installed.
> Database is SQLite configured directly in `schema.prisma`, not via `DATABASE_URL`.

---

## 8. AUTH & RBAC

### JWT Strategy
- **Access Token**: 15 minutes, stored in Zustand memory (`authStore.accessToken`)
- **Refresh Token**: 7 days, stored in `localStorage`
- Axios interceptor: on 401 → queue requests → attempt refresh → retry all → if fail → logout

### Protected Routes (Frontend)
```typescript
// PrivateRoute: redirect to /login if no token
// RoleGuard: redirect to /dashboard if role insufficient
<Route element={<PrivateRoute />}>
  <Route element={<DashboardLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    ...
  </Route>
</Route>
```

### RBAC Matrix (Frontend + Backend aligned)
| Action | ADMIN | Project LEADER | MEMBER |
|--------|-------|----------------|--------|
| Create Project | ✅ | ✅ | ❌ (button hidden) |
| Edit/Delete Project | ✅ | Owner only | ❌ |
| Add/Remove Members | ✅ | Owner/LEADER | ❌ (form hidden) |
| Change Member Role | ✅ | Owner/LEADER | ❌ (Tag replaces Select) |
| Create/Edit Task | ✅ | Project LEADER | ❌ (buttons hidden) |
| Delete Task | ✅ | Project LEADER | ❌ (button hidden) |
| Update Task Status | ✅ | ✅ | Assigned tasks only (Select disabled otherwise) |
| Drag-drop column change | ✅ | ✅ | Assigned tasks only (blocked + error toast) |
| Reorder Tasks (same column) | ✅ | ✅ | ✅ |
| Add Comment | ✅ | ✅ | ✅ |
| Delete Comment | ✅ | Project LEADER | Own comments only |
| View Settings Tab | ✅ | Project LEADER | ❌ (tab hidden) |
| View Dashboard Stats | ✅ (full) | ✅ (full) | ✅ (personal) |

---

## 9. KNOWN FIXES & GOTCHAS (for future agent reference)

### 9.1 Tailwind CSS v4 + Ant Design Setup
- **Issue:** Tailwind CSS v4 does not use `tailwind.config.js`. Uses CSS-first config via `@import "tailwindcss"`.
- **Fix:** Install `@tailwindcss/vite` plugin and register in `vite.config.ts`. Add `@import "tailwindcss";` in `index.css`.
- **Rule:** Never create `tailwind.config.js` for Tailwind v4 projects.

### 9.2 CORS – Dynamic Port Matching
- **Issue:** Vite may start on port 5174 if 5173 is busy, causing CORS failures.
- **Fix:** Backend CORS uses regex `/^http:\/\/localhost:\d+$/` to allow all localhost ports dynamically.
- **Rule:** Do not hardcode `CLIENT_URL` as the only allowed origin.

### 9.3 SQLite Enum Workaround
- **Issue:** SQLite does not support Prisma `enum` types. Migration fails with native enums.
- **Fix:** Replace all `enum Xxx { ... }` with `String` column types. Enforce values via Zod validation schemas.
- **Rule:** When switching back to PostgreSQL, convert `String` fields back to `enum` types.

### 9.4 Port Conflicts (EADDRINUSE)
- **Issue:** Running `npm run dev` when port 5000 is already in use crashes the server.
- **Fix:** Always check background tasks before starting. Kill stale processes if needed.
- **Rule:** Do NOT run `npm run build` in frontend unless explicitly requested. Only use `npm run dev`.

### 9.5 Seed Data – Owner Must Be a Member
- **Issue:** Project owner not appearing in member list because `ProjectMember` record was missing.
- **Fix:** `seed.ts` now adds the owner as a `LEADER` member of each project they create.

### 9.6 `url.parse()` Deprecation Warning
- **Issue:** Node.js shows `[DEP0169] DeprecationWarning: url.parse()` on backend startup.
- **Status:** Cosmetic warning from Express/Socket.io internals. No fix needed unless upgrading.

---

## 10. QUICK START COMMANDS

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed          # Creates Admin/Leader/Member + sample data
npm run dev                  # Starts on port 5000

# Frontend
cd frontend
npm install
npm run dev                  # Starts on port 5173 (or 5174 if busy)

# Test Accounts (from seed.ts)
# admin@taskflow.com / password123   (role: ADMIN)
# leader@taskflow.com / password123  (role: LEADER)
# member@taskflow.com / password123  (role: MEMBER)
```

---

## 11. KEY RULES FOR AI AGENT

1. **Always use TypeScript** – define interfaces for all props/state/API responses
2. **Zustand for global only** – auth, theme, UI state (sidebar collapsed, modals)
3. **TanStack Query for server** – all API calls go through useQuery/useMutation hooks
4. **Ant Design for complex UI** – Table, Form, Modal, Select, Tabs, Popconfirm, message
5. **Tailwind v4 for layout** – flex, grid, spacing, responsive. Use `@tailwindcss/vite` plugin. NO `tailwind.config.js`
6. **Socket.io events** – task:created/updated/deleted, task:status-changed, task:reordered, comment:added, notification
7. **Validate inputs** – Zod schemas in `backend/src/utils/validation.ts`
8. **RBAC on both layers** – `rbacMiddleware` on backend, conditional rendering + `isProjectLeader` prop on frontend
9. **Standard response format** – all API responses use `{ success, data/error, meta? }`
10. **Optimistic updates** – TanStack Query optimistic updates for drag-drop reorder in `useTasks.ts`
11. **Timestamps everywhere** – all models have `createdAt` + `updatedAt`
12. **Do NOT run `npm run build`** in frontend unless explicitly asked – only `npm run dev`
13. **Do NOT push to GitHub** unless explicitly asked by the user
14. **Check port conflicts** before starting any server (backend 5000, frontend 5173)
15. **Changelog entries** – When fixing UI/styling/RBAC issues, log daily entries in `docs/changelogs/YYYY-MM-DD.md`

---

## 12. ERROR HANDLING STRATEGY

### Backend
```typescript
// Centralized error handler middleware (middlewares/errorHandler.ts)
class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message)
  }
}
// Error codes: AUTH_INVALID, AUTH_EXPIRED, FORBIDDEN, NOT_FOUND,
//              VALIDATION_ERROR, DUPLICATE_ENTRY, INTERNAL_ERROR
```

### Frontend
- **Axios interceptor**: catch 401 → refresh token queue → retry; catch 403 → show "Access Denied" toast
- **Form errors**: display inline via Ant Design Form validation rules
- **Toast notifications**: `message.error()` for API errors, `message.success()` for actions
- **RBAC errors**: `message.error()` shown on unauthorized drag-drop or API failures
