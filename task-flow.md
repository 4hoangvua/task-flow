# 📘 TaskFlow – Prompt Workflow Technical Guide

## 1. TECH STACK SUMMARY (for AI to generate code)

```yaml
Frontend:
  framework: React 18 + TypeScript + Vite
  state_management:
    - Zustand (global: auth, theme, workspace)
    - TanStack Query v5 (server: tasks, projects)
    - useState (local UI)
  UI: Ant Design 5 (Table, Form, Modal) + TailwindCSS 4 (layout, board)
  routing: React Router DOM v6
  http: Axios + Socket.io-client v4
  forms: React Hook Form + Zod v3
  drag_drop: "@dnd-kit/core + @dnd-kit/sortable"
  charts: Recharts 2
  testing: Vitest + React Testing Library
  devtools: React Query DevTools

Backend:
  runtime: Node.js 20 LTS + Express + TypeScript
  orm: Prisma 5
  database: PostgreSQL 16
  auth: JWT (access + refresh) + bcrypt
  realtime: Socket.io v4
  validation: Zod v3
  email: Nodemailer
  logging: Winston
  testing: Vitest + Supertest

Database:
  provider: postgresql
  tables: User, Project, ProjectMember, Task, TaskHistory, Comment, Notification

DevOps:
  linting: ESLint + Prettier
  containerization: Docker + docker-compose (dev)
```

---

## 2. FOLDER STRUCTURE (for AI to scaffold)

### Frontend
```
src/
├── api/             # axios instance + endpoint functions (authApi, taskApi, projectApi)
├── components/
│   ├── common/      # Button, Loading, ErrorBoundary, EmptyState
│   ├── task/        # TaskCard, TaskColumn, TaskDetailModal, TaskForm
│   ├── project/     # ProjectCard, ProjectForm, ProjectHeader
│   └── layout/      # Sidebar, Header, Breadcrumb, NotificationBell
├── config/          # axios interceptors, socket config, constants
├── hooks/           # useAuth, useTasks, useProjects, useSocket, useNotifications
├── layouts/         # AuthLayout, DashboardLayout (sidebar + header wrapper)
├── pages/           # 10 pages: Login, Dashboard, Projects, TaskBoard, etc.
├── providers/       # QueryProvider, SocketProvider, ThemeProvider
├── stores/          # Zustand: authStore, uiStore
├── types/           # User, Task, Project, Notification interfaces
├── utils/           # formatDate, priorityColor, roleCheck helpers
└── routes/          # Router config + PrivateRoute + RoleGuard
```

### Backend
```
src/
├── config/          # database.ts, jwt.ts, email.ts, cors.ts
├── controllers/     # auth, task, project, comment, notification controllers
├── lib/             # prisma client singleton
├── middlewares/     # auth, rbac, validation, errorHandler, rateLimiter
├── routes/          # Express routers
├── services/        # business logic layer
├── sockets/         # Socket.io handlers + auth middleware
├── utils/           # token, hash, validation schemas, logger
└── types/           # custom types + express augmentation

prisma/
├── schema.prisma    # database models
├── migrations/
└── seed.ts          # test data seeding
```

---

## 3. DATABASE SCHEMA (Prisma - copy directly)

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  avatar        String?
  role          Role      @default(MEMBER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  projects      ProjectMember[]
  assignedTasks Task[]          @relation("TaskAssignee")
  createdTasks  Task[]          @relation("TaskCreator")
  comments      Comment[]
  notifications Notification[]
  taskHistory   TaskHistory[]
}

model Project {
  id          String        @id @default(uuid())
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  ownerId     String
  owner       User          @relation(fields: [ownerId], references: [id])
  members     ProjectMember[]
  tasks       Task[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model ProjectMember {
  id        String     @id @default(uuid())
  projectId String
  userId    String
  role      MemberRole @default(MEMBER)
  joinedAt  DateTime   @default(now())
  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User       @relation(fields: [userId], references: [id])
  @@unique([projectId, userId])
}

model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  order       Int        @default(0)
  deadline    DateTime?
  projectId   String
  assigneeId  String?
  creatorId   String
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee    User?      @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  creator     User       @relation("TaskCreator", fields: [creatorId], references: [id])
  comments    Comment[]
  history     TaskHistory[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
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
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  taskId    String?
  projectId String?
  isRead    Boolean          @default(false)
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime         @default(now())
}

enum Role              { ADMIN LEADER MEMBER }
enum MemberRole        { LEADER MEMBER }
enum TaskStatus        { TODO IN_PROGRESS REVIEW DONE }
enum Priority          { LOW MEDIUM HIGH URGENT }
enum ProjectStatus     { ACTIVE ARCHIVED }
enum NotificationType  { TASK_ASSIGNED TASK_UPDATED COMMENT_ADDED DEADLINE_APPROACHING }
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

## 6. STATE MANAGEMENT PATTERNS (code template)

### Zustand Store Example
```typescript
// stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' }
  )
)
```

### TanStack Query Hook
```typescript
// hooks/useTasks.ts
export const useTasks = (projectId: string) => {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskApi.getByProject(projectId),
    staleTime: 5000, // refetch after 5s
  })
}

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => taskApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  })
}
```

---

## 7. UI PAGES & LAYOUT

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
| 1 | Login | `/login` | Auth | Email + password form, "Remember me", link to Register, error toast |
| 2 | Register | `/register` | Auth | Name + email + password + confirm password, mặc định role MEMBER, link to Login |
| 3 | Dashboard | `/dashboard` | Dashboard | LEADER: 4 KPI cards + Bar chart (tasks by project) + Pie chart (status) + Recent activity. MEMBER: simplified personal stats (assigned/completed/overdue) |
| 4 | Projects | `/projects` | Dashboard | Grid/List toggle, cards: name + description + member count + progress bar, "Create Project" (LEADER+), search + filter |
| 5 | ProjectDetail | `/projects/:id` | Dashboard | Project header + Tabs: Overview \| Board \| Members \| Settings |
| 6 | TaskBoard | `/projects/:id/board` | Dashboard | 4 columns: TODO → IN_PROGRESS → REVIEW → DONE, drag-drop cards, filter bar (assignee, priority, search), "Add Task" button |
| 7 | MyTasks | `/my-tasks` | Dashboard | Ant Design Table: Title, Project, Status, Priority, Deadline, Actions. Filters + Sort |
| 8 | Members | `/projects/:id/members` | Dashboard | Table: Avatar, Name, Email, Role, Joined. "Add Member" (search by email modal), Remove (LEADER only) |
| 9 | Settings | `/settings` | Dashboard | Profile form (name, avatar) + Change password form + Theme toggle |
| 10 | NotFound | `*` | Auth | 404 illustration + "Back to Dashboard" button |

**Total: 10 pages + Modals: TaskDetailModal (view/edit task + comments + history), TaskFormModal (create task), ConfirmModal (delete actions), AddMemberModal**

---

## 8. ENVIRONMENT VARIABLES (.env templates)

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Backend `.env`
```env
NODE_ENV=development
DATABASE_URL="postgresql://user:pass@localhost:5432/taskflow"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
CLIENT_URL="http://localhost:5173"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="app-password"
```

---

## 9. AI PROMPT TEMPLATE (for generating this project)

```
You are a senior fullstack developer. Generate code for TaskFlow app with:

Tech:
- Frontend: React 18 + TypeScript + Vite + Zustand + TanStack Query v5 + Ant Design 5 + TailwindCSS 4
- Backend: Node.js 20 + Express + TypeScript + Prisma 5 + PostgreSQL 16 + Socket.io v4
- Auth: JWT (access + refresh tokens) + bcrypt

Features:
1. Login/Register (default role: MEMBER, LEADER/ADMIN assigned manually)
2. LEADER: create project, add members, create/assign tasks
3. MEMBER: view assigned tasks, update status (TODO→IN_PROGRESS→REVIEW→DONE)
4. Real-time: WebSocket notifies on task changes, comments, assignments
5. Kanban board with drag-drop (@dnd-kit) + optimistic reorder
6. Dashboard with charts (Recharts) – LEADER: full stats, MEMBER: personal stats
7. Comments on tasks with real-time updates
8. Notification system (bell icon + toast)
9. RBAC enforcement on both frontend (RoleGuard) and backend (rbacMiddleware)

Structure: use the folder structure in Section 2
Database: use the Prisma schema in Section 3 (includes timestamps, TaskHistory, Notification)
API: implement all endpoints in Section 4 with standard response format
WebSocket: implement all events in Section 5 with JWT auth
Auth: implement JWT flow in Section 12 with RBAC matrix

Generate step by step:
1. Prisma schema + migrations + seed
2. Backend config + auth middleware + RBAC middleware + error handler
3. Auth APIs (register, login, refresh, logout, profile)
4. Project + Member CRUD APIs
5. Task CRUD APIs + reorder + Socket.io events
6. Comment + Notification APIs
7. React layouts (AuthLayout, DashboardLayout)
8. Zustand stores (authStore, uiStore) + axios interceptors
9. TanStack Query hooks for all APIs
10. React pages (Login, Register, Dashboard, Projects, TaskBoard, MyTasks, Settings)
11. Socket.io client integration + real-time updates
```

---

## 10. QUICK START COMMANDS

```bash
# Backend
cd backend
npm init -y
npm i express prisma @prisma/client socket.io jsonwebtoken bcrypt cors dotenv zod winston
npm i -D typescript @types/node @types/express @types/jsonwebtoken @types/bcrypt ts-node nodemon
npx prisma init
npx prisma generate
npx prisma migrate dev --name init

# Frontend
cd frontend
npm create vite@latest . -- --template react-ts
npm i zustand @tanstack/react-query axios socket.io-client react-router-dom antd tailwindcss @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-hook-form @hookform/resolvers zod recharts
npm i -D @types/node
```

---

## 11. KEY RULES FOR AI

1. **Always use TypeScript** – define interfaces for all props/state/API responses
2. **Zustand for global** – only auth, theme, UI state (sidebar, modals)
3. **React Query for server** – all API calls go through useQuery/useMutation
4. **Ant Design for complex components** – Table, DatePicker, Select, Modal, Form
5. **Tailwind for layout** – flex, grid, spacing, custom task cards, responsive
6. **Socket.io events** – task:created, task:updated, task:deleted, task:status-changed, task:reordered, comment:added, notification
7. **Validate all inputs** – Zod schemas shared between frontend and backend where possible
8. **Role-based access** – enforce via `rbacMiddleware` on backend, hide UI elements on frontend
9. **Standard response format** – all API responses use `{ success, data/error, meta? }` shape
10. **Error handling** – global ErrorBoundary on frontend, centralized `errorHandler` middleware on backend
11. **Optimistic updates** – use TanStack Query optimistic updates for drag-drop reorder
12. **Timestamps everywhere** – all models must have `createdAt` + `updatedAt`

---

## 12. AUTH & RBAC (authorization flow)

### JWT Strategy
- **Access Token**: 15 minutes, stored in memory (Zustand store)
- **Refresh Token**: 7 days, stored in `localStorage`
- Axios interceptor: on 401 → attempt refresh → retry request → if fail → logout

### Protected Routes (Frontend)
```typescript
// PrivateRoute: redirect to /login if no token
// RoleGuard: redirect to /dashboard if role insufficient
<Route element={<PrivateRoute />}>
  <Route element={<DashboardLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route element={<RoleGuard roles={['LEADER', 'ADMIN']} />}>
      <Route path="/projects/new" element={<CreateProject />} />
    </Route>
  </Route>
</Route>
```

### RBAC Matrix
| Action | ADMIN | LEADER | MEMBER |
|--------|-------|--------|--------|
| Create Project | ✅ | ✅ | ❌ |
| Edit/Delete Project | ✅ | Owner only | ❌ |
| Add/Remove Members | ✅ | Owner only | ❌ |
| Create/Edit Task | ✅ | Project LEADER | ❌ |
| Delete Task | ✅ | Project LEADER | ❌ |
| Assign Task | ✅ | Project LEADER | ❌ |
| Update Task Status | ✅ | ✅ | Assigned tasks only |
| Reorder Tasks (drag-drop) | ✅ | ✅ | ✅ |
| Add Comment | ✅ | ✅ | ✅ |
| Delete Comment | ✅ | ✅ | Own comments only |
| View Dashboard Stats | ✅ | ✅ (full) | ✅ (personal) |

---

## 13. ERROR HANDLING STRATEGY

### Backend
```typescript
// Centralized error handler middleware
class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message)
  }
}

// Error codes: AUTH_INVALID, AUTH_EXPIRED, FORBIDDEN, NOT_FOUND,
//              VALIDATION_ERROR, DUPLICATE_ENTRY, INTERNAL_ERROR
```

### Frontend
- **Axios interceptor**: catch 401 → refresh token; catch 403 → show "Access Denied" toast
- **React ErrorBoundary**: catch render errors → show fallback UI
- **Form errors**: display inline via React Hook Form `errors` object
- **Toast notifications**: Ant Design `message.error()` for API errors, `message.success()` for actions
