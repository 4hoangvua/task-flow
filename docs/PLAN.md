# Project Plan - TaskFlow

This document outlines the product roadmap, technology stack, features, and detailed tasks breakdown for **TaskFlow**. It serves as the primary source of truth for the project's roadmap and direction.

---

## 1. Product Summary

**TaskFlow** là ứng dụng quản lý công việc (Task Management) thời gian thực (real-time). Ứng dụng hỗ trợ bảng Kanban (Kanban board), phân quyền LEADER/MEMBER, và thông báo tức thì qua WebSocket. 
* **Mục tiêu:** Giúp các đội nhóm nhỏ quản lý dự án một cách đơn giản, trực quan và hiệu quả.

---

## 2. Tech Stack

| Layer      | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Frontend   | React 18 + TypeScript + Vite                              |
| UI         | Ant Design 5 + TailwindCSS 4                              |
| State      | Zustand (global) + TanStack Query (server)                 |
| Backend    | Node.js 20 LTS + Express + TypeScript                      |
| ORM        | Prisma 5                                                  |
| Database   | PostgreSQL 16                                             |
| Auth       | JWT (Access Token in memory + Refresh Token in localStorage) |
| Realtime   | Socket.io v4                                              |
| Charts     | Recharts 2                                                |
| Drag-Drop  | @dnd-kit/core + @dnd-kit/sortable                         |

---

## 3. Features & Tasks Breakdown

Dưới đây là chi tiết phân chia công việc từ F01 đến F10 dựa trên tài liệu đặc tả `task-flow.md`:

### F01. Project Setup [done]
- [x] Khởi tạo cấu trúc thư mục monorepo gốc.
- [x] Tạo file hướng dẫn Agent (`AGENTS.md`).
- [x] Tạo file quy chuẩn hoạt động Agent thu gọn (`.agents/rules/main.md`).

### F02. Spec Analysis [done]
- [x] Phân tích đặc tả kỹ thuật `task-flow.md`.
- [x] Xác định các gaps và giải pháp kiến trúc trong `task_flow_analysis.md`.

### F03. Database Schema [planned]
- [ ] Thiết lập tệp `prisma/schema.prisma` với 7 bảng: `User`, `Project`, `ProjectMember`, `Task`, `TaskHistory`, `Comment`, `Notification`.
- [ ] Cấu hình các Enums cần thiết: `Role`, `MemberRole`, `TaskStatus`, `Priority`, `ProjectStatus`, `NotificationType`.
- [ ] Thiết lập ràng buộc khóa ngoại (ví dụ: quan hệ creator/assignee giữa `User` và `Task`, onDelete Cascade cho các quan hệ phụ thuộc).
- [ ] Thực hiện chạy Migration khởi tạo cơ sở dữ liệu: `npx prisma migrate dev --name init`.
- [ ] Viết script gieo dữ liệu thử nghiệm `prisma/seed.ts` (tạo sẵn Leader, Member, các Projects và Tasks mẫu để phục vụ test).

### F04. Auth & RBAC [planned]
- [ ] Thiết lập cơ chế tạo JWT Access Token (15 phút, lưu trong memory) và Refresh Token (7 ngày, lưu ở localStorage).
- [ ] Viết middleware xác thực token `authMiddleware` trên Backend.
- [ ] Viết middleware phân quyền `rbacMiddleware` kiểm soát quyền hạn (LEADER/MEMBER) đối với tài nguyên dự án và task.
- [ ] Thiết lập bảo vệ định tuyến trên Frontend bằng cách sử dụng `PrivateRoute` (nếu chưa đăng nhập) và `RoleGuard` (nếu vai trò không được cấp quyền).

### F05. API Endpoints [planned]
- [ ] **Auth APIs:** Đăng ký (mặc định role MEMBER), Đăng nhập, Làm mới token (`/api/auth/refresh`), Đăng xuất, và Profile (lấy/cập nhật thông tin cá nhân).
- [ ] **Project APIs:** CRUD dự án (LEADER mới được tạo; chỉ Owner của dự án mới được sửa/xóa).
- [ ] **Project Member APIs:** Thêm thành viên bằng email, sửa vai trò member, và xóa thành viên khỏi dự án (LEADER/Owner only).
- [ ] **Task APIs:** CRUD nhiệm vụ (Project LEADER được tạo/sửa/xóa; Assignee/LEADER cập nhật status; Member sắp xếp vị trí).
- [ ] **Comment APIs:** Thêm bình luận vào task, xóa bình luận (chỉ tác giả được quyền xóa).
- [ ] **Notification APIs:** Lấy danh sách thông báo và đánh dấu đã đọc (`/api/notifications/:id/read` và `/api/notifications/read-all`).
- [ ] **Stats/Dashboard APIs:** Xem thống kê chi tiết dự án (dành cho Leader) hoặc thống kê cá nhân (dành cho Member).

### F06. WebSocket Events [planned]
- [ ] Khởi chạy máy chủ Socket.io trên Backend tích hợp xác thực JWT qua handshake.
- [ ] Xử lý sự kiện Client tham gia/rời phòng dự án (`join-project`, `leave-project`).
- [ ] Phát các sự kiện thay đổi công việc realtime đến các thành viên trong room dự án:
  - `task:created`, `task:updated`, `task:deleted`
  - `task:status-changed` (khi di chuyển cột Kanban)
  - `task:reordered` (khi đổi thứ tự trong cột)
  - `comment:added` (khi có bình luận mới)
  - `member:added`, `member:removed` (khi thay đổi nhân sự dự án)
- [ ] Phát thông báo cá nhân (`notification`) trực tiếp đến client của người dùng.

### F07. UI/Pages Detail [planned]
- [ ] Thiết kế Layout dùng chung: `AuthLayout` (centered card) và `DashboardLayout` (Sidebar + Header tích hợp NotificationBell và Avatar dropdown).
- [ ] Dựng khung định tuyến cho 10 trang giao diện chính:
  1. **Login:** Đăng nhập hệ thống.
  2. **Register:** Đăng ký (mặc định role MEMBER).
  3. **Dashboard:** Thống kê dự án dạng biểu đồ (Leader) hoặc thống kê cá nhân (Member).
  4. **Projects:** Danh sách dự án dạng Grid/List kèm thanh tìm kiếm & bộ lọc.
  5. **ProjectDetail:** Quản lý dự án với cấu trúc Tabs (Overview, Board, Members, Settings).
  6. **TaskBoard:** Bảng Kanban 4 cột (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`) hỗ trợ kéo thả.
  7. **MyTasks:** Bảng danh sách nhiệm vụ được giao cho cá nhân.
  8. **Members:** Quản lý danh sách thành viên dự án.
  9. **Settings:** Chỉnh sửa thông tin, đổi mật khẩu, và chuyển theme (sáng/tối).
  10. **NotFound:** Trang hiển thị lỗi 404.
- [ ] Thiết kế các Modals: `TaskDetailModal` (chứa bình luận và lịch sử `TaskHistory`), `TaskFormModal` (tạo/sửa task).

### F08. Backend Implementation [planned]
- [ ] Cài đặt cấu trúc dự án `backend/` và cài đặt các dependencies (express, prisma, socket.io, jsonwebtoken, bcrypt, zod, winston).
- [ ] Tạo file cấu hình môi trường `.env.development`.
- [ ] Khởi tạo Prisma client singleton trong file `src/lib/prisma.ts`.
- [ ] Viết trình ghi log lỗi bằng Winston logger.

### F09. Frontend Implementation [planned]
- [ ] Khởi tạo thư mục `frontend/` bằng Vite (React + TypeScript).
- [ ] Cài đặt dependencies (zustand, @tanstack/react-query, axios, socket.io-client, antd, tailwindcss, @dnd-kit/core, react-hook-form, zod, recharts).
- [ ] Cấu hình Axios instance kèm interceptor tự động gọi API refresh token khi gặp lỗi 401.
- [ ] Xây dựng các Zustand stores (`authStore`, `uiStore`).
- [ ] Tạo các custom hooks sử dụng TanStack Query v5 để quản lý cache dữ liệu từ Server.
- [ ] Tích hợp kéo thả trên Kanban board dùng `@dnd-kit/core` kết hợp cơ chế **Optimistic Updates** qua React Query.

### F10. Testing & Deployment [planned]
- [ ] Viết Unit Test cho Frontend sử dụng Vitest và React Testing Library.
- [ ] Viết Integration Test cho các API Backend sử dụng Vitest và Supertest.
- [ ] Thiết lập Docker cấu hình `Dockerfile` và `docker-compose.yml` để chạy ứng dụng ở môi trường local.

---

## 4. Resolved Decisions (Quyết định thiết kế đã chốt)

Dựa trên đặc tả dự án tại [task-flow.md](file:///c:/project/task-flow/task-flow.md), các câu hỏi thiết kế đã được thống nhất như sau:
* **Quyền truy cập Dashboard:** Member có quyền truy cập Dashboard nhưng chỉ hiển thị số liệu thống kê cá nhân (số task được gán, hoàn thành, quá hạn). Leader/Admin sẽ xem được biểu đồ thống kê tổng quan của toàn bộ dự án.
* **Quy trình đăng ký:** Đăng ký tài khoản mới mặc định nhận vai trò `MEMBER`. Vai trò `LEADER` hoặc `ADMIN` sẽ được gán thủ công trong cơ sở dữ liệu.
* **Giao diện chi tiết dự án:** Sử dụng mô hình Tabs tích hợp (`Overview`, `Board`, `Members`, `Settings`) ngay tại trang ProjectDetail giúp trải nghiệm liền mạch.
* **Tính năng upload:** Trường `avatar` trong bảng User hỗ trợ dạng chuỗi (URL ảnh).
* **Cấu trúc Token:** Áp dụng cơ chế đôi JWT (Access Token 15 phút lưu trong bộ nhớ ứng dụng; Refresh Token 7 ngày lưu ở `localStorage`).

---

## 5. Architecture & Technical Rules

* **Monorepo:** Cả `frontend/` và `backend/` nằm trong cùng thư mục gốc của dự án.
* **Bảo mật:** Mọi API thay đổi trạng thái hoặc chỉnh sửa dữ liệu bắt buộc đi qua bộ lọc middleware RBAC để kiểm soát quyền chặt chẽ.
* **Kiểm thử:** Độc lập kiểm thử frontend với Vitest & Testing Library; kiểm thử backend với Vitest & Supertest.
