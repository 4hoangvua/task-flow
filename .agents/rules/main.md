# TaskFlow - Agent Working Rules & Domain Knowledge

Chào mừng Agent! Đây là cẩm nang quy chuẩn hoạt động và kiến thức kỹ thuật cốt lõi của dự án **TaskFlow**. Hãy tuân thủ nghiêm ngặt các quy tắc này trong suốt quá trình phát triển mã nguồn.

---

## 1. HƯỚNG DẪN HOẠT ĐỘNG (AGENT WORKFLOW)

### Thứ tự đọc tài liệu (Read Order)
Trước khi thực hiện bất kỳ nhiệm vụ nào, bạn phải đọc các tài liệu theo thứ tự sau:
1. `AGENTS.md` - Quy tắc hoạt động của Agent.
2. `.agents/rules/main.md` (chính là tài liệu này) - Quy chuẩn kỹ thuật & Luồng hoạt động của ứng dụng.
3. `docs/PLAN.md` - Kế hoạch tổng thể và các tính năng tiếp theo.
4. `docs/PROGRESS.md` - Danh sách công việc đã hoàn thành và chứng minh hoạt động (Proof).
5. `docs/DECISIONS.md` - Các quyết định thiết kế quan trọng.
6. Yêu cầu hiện tại của người dùng.

### Quy tắc phân loại quy mô công việc (Size Rules)
* **Tiny (Nhỏ):** Sửa lỗi nhanh, sửa lỗi chính tả, thay đổi CSS nhỏ, cập nhật docs.
  * *Hành động:* Tiến hành làm trực tiếp. Cập nhật tài liệu nếu cần.
* **Normal (Vừa):** Triển khai một tính năng hoặc thay đổi hành vi cụ thể (ví dụ: tạo 1 endpoint mới, viết 1 UI component).
  * *Hành động:* Thêm một hàng vào `docs/PROGRESS.md`. Implement. Đánh dấu hoàn thành.
* **Big (Lớn):** Các thay đổi ảnh hưởng tới xác thực (auth), database schema, phân quyền (RBAC), bảo mật, hoặc nhiều tính năng cùng lúc.
  * *Hành động:* Cập nhật kế hoạch vào `docs/PLAN.md` trước. Hỏi ý kiến người dùng nếu hướng đi chưa rõ ràng. Ghi nhận quyết định vào `docs/DECISIONS.md`.

---

## 2. KIẾN THỨC NỀN TẢNG & TECH STACK (DOMAIN KNOWLEDGE)

Dự án **TaskFlow** được xây dựng dưới dạng Monorepo gồm hai phần chính:
* `frontend/`: React 18, Vite, TypeScript, Zustand, TanStack Query v5, Ant Design 5, TailwindCSS 4, React Router v6.
* `backend/`: Node.js 20, Express, TypeScript, Prisma 5, PostgreSQL 16, Socket.io v4.

### 2.1 Cấu trúc Thư mục Quy chuẩn
Hãy tuân thủ cấu trúc thư mục sau khi tạo file mới:

**Frontend (`frontend/src/`):**
* `api/`: Các hàm gọi API sử dụng instance Axios (`authApi`, `taskApi`, `projectApi`).
* `components/`:
  * `common/`: Button, Loading, ErrorBoundary, EmptyState.
  * `task/`: TaskCard, TaskColumn, TaskDetailModal, TaskForm.
  * `project/`: ProjectCard, ProjectForm, ProjectHeader.
  * `layout/`: Sidebar, Header, Breadcrumb, NotificationBell.
* `config/`: Cấu hình Axios interceptor, Socket client, constants.
* `hooks/`: Custom React hooks (`useAuth`, `useTasks`, `useProjects`, `useSocket`, `useNotifications`).
* `layouts/`: AuthLayout, DashboardLayout (sidebar + header wrapper).
* `pages/`: Gồm 10 trang (Login, Register, Dashboard, Projects, TaskBoard, MyTasks, Members, Settings, NotFound).
* `providers/`: QueryProvider, SocketProvider, ThemeProvider.
* `stores/`: Zustand store quản lý global state (`authStore`, `uiStore`).
* `types/`: Định nghĩa TypeScript interfaces cho User, Task, Project, Notification.
* `utils/`: Helpers chung (`formatDate`, `priorityColor`, `roleCheck`).
* `routes/`: Router config, `PrivateRoute`, `RoleGuard`.

**Backend (`backend/src/`):**
* `config/`: database, jwt, email, cors.
* `controllers/`: auth, task, project, comment, notification controllers.
* `lib/`: Prisma client singleton.
* `middlewares/`: auth, rbac, validation, errorHandler, rateLimiter.
* `routes/`: Express routers.
* `services/`: Lớp logic nghiệp vụ (business logic layer).
* `sockets/`: Socket.io handlers + auth middleware.
* `utils/`: JWT token helper, bcrypt hash helper, Zod validation schemas, logger (Winston).
* `types/`: Custom type definitions & Express requests augmentation.

---

## 3. CÁC QUY TẮC PHÁT TRIỂN CỐT LÕI (DEVELOPMENT RULES)

### Quy tắc 1: Luôn sử dụng TypeScript & Khai báo Kiểu dữ liệu (TypeScript Everywhere)
* Tuyệt đối không sử dụng kiểu dữ liệu `any`.
* Định nghĩa rõ ràng `interface` hoặc `type` cho mọi Props, State, API Request và API Response.

### Quy tắc 2: Phân chia State trên Frontend (State Management Split)
* **Zustand:** Chỉ dùng cho global UI state (theme, trạng thái đóng/mở sidebar, modal) và thông tin đăng nhập (`authStore`).
* **TanStack Query (React Query) v5:** Sử dụng để quản lý toàn bộ dữ liệu từ server (tasks, projects, comments, notifications). Cấu hình `staleTime: 5000` làm mặc định.
* **useState:** Chỉ dùng cho local UI state (như giá trị input tạm thời, trạng thái hover, expand).

### Quy tắc 3: Thiết kế UI đồng bộ (UI Consistency)
* Sử dụng **Ant Design 5** cho các component phức tạp: Table, DatePicker, Select, Modal, Form.
* Sử dụng **TailwindCSS 4** cho việc dựng layout (flex, grid), spacing, các thẻ nhiệm vụ (task cards), và đảm bảo hiển thị Responsive tốt.

### Quy tắc 4: Quy chuẩn API & Định dạng Response (API Standard Response)
Tất cả các API Endpoints phải trả về định dạng JSON đồng nhất:
* **Thành công (Success):** `{ success: true, data: T, message?: string }`
* **Lỗi (Error):** `{ success: false, error: string, code: string, details?: any }`
* **Phân trang (Paginated):** `{ success: true, data: T[], meta: { page: number, limit: number, total: number, totalPages: number } }`

### Quy tắc 5: Xác thực và Phân quyền (Auth & RBAC Matrix)
* **JWT Flow:**
  * **Access Token:** Có hạn 15 phút, lưu trong Memory (Zustand store).
  * **Refresh Token:** Có hạn 7 ngày, lưu trong `localStorage`.
  * **Axios Interceptor:** Khi gặp lỗi HTTP 401 (Unauthorized) -> tiến hành gọi API refresh token -> nếu thành công thì thử lại request; nếu thất bại thì tự động logout.
* **Kiểm soát quyền truy cập trên Frontend:**
  * Sử dụng `PrivateRoute` (chặn nếu chưa đăng nhập) và `RoleGuard` (chặn dựa trên role của ProjectMember).
* **Phân quyền Backend (RBAC Matrix):**
  Phải kiểm tra quyền thông qua `rbacMiddleware` tại các API Endpoint:
  * `LEADER` (chủ dự án): Toàn quyền quản trị dự án, thêm/xóa thành viên, tạo/gán task, xóa task.
  * `MEMBER`: Chỉ xem dự án/task được gán, cập nhật trạng thái các task được gán cho chính mình, reorder task, bình luận.
  * `ADMIN` (hệ thống): Có toàn quyền trên hệ thống.

*Chi tiết quyền hạn cần đối chiếu:*
* Tạo dự án: `LEADER` trở lên.
* Sửa/Xóa dự án: Chỉ Owner (chủ dự án).
* Thêm/Xóa thành viên: Chỉ Owner.
* Tạo/Sửa/Xóa/Gán Task: Chỉ Project LEADER.
* Cập nhật trạng thái Task (TODO -> IN_PROGRESS -> REVIEW -> DONE): `LEADER` hoặc `MEMBER` được gán cho task đó.

### Quy tắc 6: Luồng hoạt động Real-time qua WebSocket (Socket.io)
Mọi thay đổi liên quan đến Task, Member, Comment phải được phát đi (emit) cho các client trong cùng phòng dự án (`projectId` room):
* Kết nối Socket phải được xác thực bằng JWT (`token` truyền qua `auth`).
* Khi truy cập trang chi tiết dự án, client phải gửi event `join-project` và gửi `leave-project` khi rời đi.
* Các event Server phát đi:
  * `task:created`, `task:updated`, `task:deleted`
  * `task:status-changed` (chuyển cột Kanban)
  * `task:reordered` (sắp xếp lại thứ tự task trong cột)
  * `comment:added` (cập nhật bình luận theo thời gian thực)
  * `member:added`, `member:removed`
  * `notification` (gửi trực tiếp đến userId cụ thể)

### Quy tắc 7: Quản lý Lỗi tập trung (Error Handling)
* **Backend:** Sử dụng lớp `AppError` kế thừa `Error` và middleware `errorHandler` tập trung.
  * Mã lỗi định danh quy chuẩn: `AUTH_INVALID`, `AUTH_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `DUPLICATE_ENTRY`, `INTERNAL_ERROR`.
* **Frontend:**
  * Bắt lỗi render bằng React `ErrorBoundary` ở các vùng quan trọng.
  * Hiển thị lỗi form trực quan bằng React Hook Form `errors`.
  * Hiển thị thông báo API lỗi qua Ant Design `message.error()`.

### Quy tắc 8: Cập nhật Trực quan & Tối ưu Trải nghiệm (UX Optimization)
* Khi kéo thả task trên Kanban board (sử dụng `@dnd-kit`), hãy thực hiện **Optimistic Updates** qua TanStack Query để giao diện di chuyển mượt mà ngay lập tức trước khi API phản hồi.
* Tự động tạo bản ghi lịch sử công việc (`TaskHistory`) khi các trường dữ liệu quan trọng như `status`, `priority`, hoặc `assigneeId` thay đổi.
