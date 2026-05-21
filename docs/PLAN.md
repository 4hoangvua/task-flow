# Project Plan - TaskFlow

This document outlines the product roadmap, technology stack, features, and detailed 11-phase implementation plan for **TaskFlow**. It serves as the primary source of truth for the project's roadmap and direction.

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

## 3. Features & Status

| #   | Feature                   | Status      | Description / Reference                                            |
| --- | ------------------------- | ----------- | ------------------------------------------------------------------ |
| F01 | Project Setup             | done        | Khởi tạo cấu trúc dự án và tài liệu hướng dẫn cho agent             |
| F02 | Spec Analysis             | done        | Phân tích đặc tả dự án và lập kế hoạch thực hiện                   |
| F03 | Database Schema           | planned     | Xây dựng Prisma schema và cơ sở dữ liệu (Phiai đoạn 1)              |
| F04 | Auth & RBAC               | planned     | Xác thực JWT và ma trận phân quyền (Giai đoạn 2, 3)                |
| F05 | API Endpoints             | planned     | Xây dựng các API Projects, Members, Tasks, Comments (Giai đoạn 4-6) |
| F06 | WebSocket Events          | planned     | Tích hợp Socket.io để xử lý đồng bộ thời gian thực (Giai đoạn 5)    |
| F07 | UI/Pages Detail           | planned     | Xây dựng Layouts và 10 Pages nghiệp vụ (Giai đoạn 7, 10)           |
| F08 | Backend Implementation    | planned     | Express + Prisma + Socket.io hoàn chỉnh (Giai đoạn 1-6)            |
| F09 | Frontend Implementation   | planned     | React pages + stores + hooks (Giai đoạn 7-11)                      |
| F10 | Testing & Deployment      | planned     | Vitest, Docker, CI/CD                                               |

---

## 4. Detailed 11-Phase Implementation Roadmap

Dưới đây là kế hoạch triển khai chi tiết từng bước dựa trên đặc tả kỹ thuật của dự án:

### Giai đoạn 1: Thiết lập Cơ sở dữ liệu & Prisma Schema
* **Mục tiêu:** Cài đặt Prisma ORM, định nghĩa Schema và chuẩn bị dữ liệu mẫu.
* **Chi tiết công việc:**
  1. Thiết lập tệp `prisma/schema.prisma` với đầy đủ các bảng: `User`, `Project`, `ProjectMember`, `Task`, `TaskHistory`, `Comment`, `Notification` cùng các Enums tương ứng.
  2. Tạo migrations ban đầu bằng Prisma (`npx prisma migrate dev`).
  3. Viết script `prisma/seed.ts` để gieo dữ liệu thử nghiệm (tạo sẵn tài khoản admin, leader, member, các dự án mẫu và task mẫu).

### Giai đoạn 2: Cấu hình Backend Core & Middlewares
* **Mục tiêu:** Dựng khung ứng dụng Express và viết các middleware nền tảng.
* **Chi tiết công việc:**
  1. Khởi tạo Express với TypeScript, cấu hình CORS, rate limiter, và Winston logger.
  2. Xây dựng lớp xử lý lỗi tập trung `AppError` và middleware `errorHandler`.
  3. Viết `authMiddleware` (xác thực token JWT).
  4. Viết `rbacMiddleware` (kiểm tra quyền truy cập dựa trên vai trò hệ thống hoặc vai trò trong dự án).

### Giai đoạn 3: Xây dựng API Xác thực (Authentication APIs)
* **Mục tiêu:** Hoàn thiện luồng đăng ký, đăng nhập và cấp phát JWT.
* **Chi tiết công việc:**
  1. API Đăng ký (`/api/auth/register`): Mặc định gán vai trò `MEMBER`.
  2. API Đăng nhập (`/api/auth/login`): Trả về `accessToken` (15m, in memory) và `refreshToken` (7d, cookie/localStorage).
  3. API Làm mới token (`/api/auth/refresh`): Sử dụng `refreshToken` để cấp lại `accessToken`.
  4. API Đăng xuất (`/api/auth/logout`) và API lấy thông tin cá nhân (`/api/auth/me`).

### Giai đoạn 4: API Dự án & Quản lý Thành viên (Project & Member APIs)
* **Mục tiêu:** Cung cấp đầy đủ các thao tác quản trị dự án.
* **Chi tiết công việc:**
  1. API CRUD cho Projects (chỉ LEADER trở lên được quyền tạo; chỉnh sửa/xóa yêu cầu quyền Owner của dự án).
  2. API quản lý thành viên dự án: Thêm thành viên bằng email, sửa vai trò thành viên (`LEADER`/`MEMBER`), và xóa thành viên khỏi dự án.

### Giai đoạn 5: API Nhiệm vụ & Sự kiện Real-time (Task CRUD & WebSocket)
* **Mục tiêu:** Quản lý Tasks, kéo thả trên Kanban và đồng bộ qua socket.
* **Chi tiết công việc:**
  1. API CRUD cho Tasks (yêu cầu quyền LEADER của dự án).
  2. API cập nhật trạng thái Task dành cho thành viên được gán (`/api/tasks/:id/status`).
  3. API sắp xếp thứ tự Task (`/api/tasks/reorder`) để lưu vị trí kéo thả trên giao diện.
  4. Tích hợp Socket.io: Gửi tín hiệu realtime khi task được tạo, cập nhật, đổi trạng thái hoặc reorder tới các thành viên cùng phòng dự án.

### Giai đoạn 6: API Bình luận & Thông báo (Comment & Notification APIs)
* **Mục tiêu:** Xử lý trao đổi trên task và hệ thống thông báo cho người dùng.
* **Chi tiết công việc:**
  1. API đăng/xóa bình luận trên task (chỉ xóa được bình luận của chính mình).
  2. API lấy danh sách thông báo và đánh dấu đã đọc (`/api/notifications`).
  3. Tự động tạo và gửi thông báo qua socket khi có hoạt động gán task, cập nhật task, hoặc bình luận mới.

### Giai đoạn 7: Xây dựng Layout & Định tuyến Frontend (Layout & Navigation)
* **Mục tiêu:** Tạo khung giao diện ứng dụng.
* **Chi tiết công việc:**
  1. Cấu hình định tuyến bằng `react-router-dom v6` với các route bảo vệ (`PrivateRoute`, `RoleGuard`).
  2. Thiết kế `AuthLayout` (giao diện trung tâm không sidebar cho Login/Register).
  3. Thiết kế `DashboardLayout` gồm: Sidebar (điều hướng nhanh), Header (tìm kiếm, avatar, và NotificationBell hiển thị số thông báo chưa đọc).

### Giai đoạn 8: Tích hợp API & Quản lý State Frontend
* **Mục tiêu:** Kết nối API và quản lý dữ liệu toàn cục.
* **Chi tiết công việc:**
  1. Cấu hình instance Axios với interceptors: tự động đính kèm `accessToken` vào Header, tự động bắt mã lỗi 401 để gọi API refresh token và thử lại request bị lỗi.
  2. Thiết kế Zustand store `authStore` để quản lý thông tin đăng nhập trong bộ nhớ tạm và `uiStore` để quản lý theme (light/dark) hoặc sidebar.

### Giai đoạn 9: Viết Custom Hooks cho TanStack Query v5
* **Mục tiêu:** Quản lý cache và truy vấn dữ liệu từ Server.
* **Chi tiết công việc:**
  1. Viết custom hooks cho các API Projects (`useProjects`, `useProjectDetail`).
  2. Viết custom hooks cho API Tasks (`useTasks`, `useUpdateTaskStatus`).
  3. Áp dụng cơ chế **Optimistic Updates** cho thao tác kéo thả task để đảm bảo UI cập nhật ngay lập tức trước khi API phản hồi.

### Giai đoạn 10: Xây dựng 10 Trang giao diện & Modals
* **Mục tiêu:** Hoàn thiện toàn bộ các trang chức năng.
* **Chi tiết công việc:**
  1. Login, Register, NotFound pages.
  2. Dashboard: Biểu đồ thống kê (Recharts) chi tiết cho LEADER (thống kê dự án, trạng thái) và tối giản cho MEMBER (cá nhân).
  3. Projects (dạng Grid/List) & ProjectDetail (gồm các tab: Overview, Board, Members, Settings).
  4. TaskBoard (bảng Kanban 4 cột kéo thả).
  5. MyTasks (bảng Table hiển thị các công việc cá nhân).
  6. Xây dựng các Modals: `TaskDetailModal` (hiển thị lịch sử thay đổi TaskHistory, phần bình luận), `TaskFormModal` (tạo/sửa task), `AddMemberModal`.

### Giai đoạn 11: Tích hợp Socket.io Client & Hoàn thiện ứng dụng
* **Mục tiêu:** Đồng bộ real-time trên Client và kiểm thử tổng thể.
* **Chi tiết công việc:**
  1. Tạo `SocketProvider` bao bọc ứng dụng để quản lý kết nối socket dựa trên JWT token.
  2. Lắng nghe các sự kiện socket (`task:updated`, `comment:added`, v.v.) để tự động cập nhật cache của TanStack Query và hiển thị thông báo toast (Ant Design `message`).

---

## 5. Resolved Decisions (Quyết định thiết kế đã chốt)

Dựa trên đặc tả dự án tại [task-flow.md](file:///c:/project/task-flow/task-flow.md), các câu hỏi thiết kế đã được thống nhất như sau:
* **Quyền truy cập Dashboard:** Member có quyền truy cập Dashboard nhưng chỉ hiển thị số liệu thống kê cá nhân (số task được gán, hoàn thành, quá hạn). Leader/Admin sẽ xem được biểu đồ thống kê tổng quan của toàn bộ dự án.
* **Quy trình đăng ký:** Đăng ký tài khoản mới mặc định nhận vai trò `MEMBER`. Vai trò `LEADER` hoặc `ADMIN` sẽ được gán thủ công trong cơ sở dữ liệu.
* **Giao diện chi tiết dự án:** Sử dụng mô hình Tabs tích hợp (`Overview`, `Board`, `Members`, `Settings`) ngay tại trang ProjectDetail giúp trải nghiệm liền mạch.
* **Tính năng upload:** Trường `avatar` trong bảng User hỗ trợ dạng chuỗi (URL ảnh).
* **Cấu trúc Token:** Áp dụng cơ chế đôi JWT (Access Token 15 phút lưu trong bộ nhớ ứng dụng; Refresh Token 7 ngày lưu ở `localStorage`).

---

## 6. Architecture & Technical Rules

* **Monorepo:** Cả `frontend/` và `backend/` nằm trong cùng thư mục gốc của dự án.
* **Bảo mật:** Mọi API thay đổi trạng thái hoặc chỉnh sửa dữ liệu bắt buộc đi qua bộ lọc middleware RBAC để kiểm soát quyền chặt chẽ.
* **Kiểm thử:** Độc lập kiểm thử frontend với Vitest & Testing Library; kiểm thử backend với Vitest & Supertest.
