# TaskFlow - Research & Analysis Guidelines

Tài liệu này định nghĩa cấu trúc dự án hiện tại và các công nghệ cốt lõi làm nền tảng để Agent bám sát khi tự động nghiên cứu, đề xuất tính năng mới hoặc nâng cấp giao diện.

---

## 1. CẤU TRÚC DỰ ÁN HIỆN TẠI (PROJECT STRUCTURE)

### Frontend (`frontend/src/`)
*   `api/`: Các tệp giao tiếp API với Backend (`authApi.ts`, `projectApi.ts`, `taskApi.ts`, `commentApi.ts`, `notificationApi.ts`, `statsApi.ts`, `adminApi.ts`).
*   `components/`: Các component dùng chung và component theo tính năng (`common/`, `task/`).
*   `config/`: Cấu hình chung, ví dụ Axios interceptors (`config/axios.ts`).
*   `hooks/`: TanStack Query custom hooks (`useAuth.ts`, `useProjects.ts`, `useTasks.ts`, `useNotifications.ts`, `useAdmin.ts`).
*   `layouts/`: Bố cục giao diện chính (`AuthLayout.tsx`, `DashboardLayout.tsx`).
*   `pages/`: Các trang giao diện chính (`Login.tsx`, `Register.tsx`, `Dashboard.tsx`, `Projects.tsx`, `ProjectDetail.tsx`, `MyTasks.tsx`, `Settings.tsx`, `AdminDashboard.tsx`, `NotFound.tsx`).
*   `providers/`: Các React context providers (`QueryProvider.tsx`, `SocketProvider.tsx`, `ThemeProvider.tsx`).
*   `stores/`: Quản lý client state bằng Zustand (`authStore.ts`, `uiStore.ts`).
*   `utils/` & `types/`: Tiện ích bổ trợ và định nghĩa TypeScript types (`helpers.ts`, `types/index.ts`).

### Backend (`backend/src/`)
*   `controllers/`: Xử lý logic yêu cầu HTTP, tương tác trực tiếp với Prisma Client.
*   `routes/`: Định tuyến các endpoint API.
*   `middlewares/`: Bộ lọc kiểm soát trung gian (`auth.ts`, `rbac.ts`, `errorHandler.ts`).
*   `sockets/`: Quản lý sự kiện WebSocket kết nối thời gian thực (`socketHandler.ts`).
*   `utils/`: Tiện ích mã hóa JWT, Winston logs, kiểm tra dữ liệu đầu vào bằng Zod.
*   `prisma/`: File `schema.prisma` và script gieo dữ liệu `seed.ts`.

---

## 2. CÔNG NGHỆ & THƯ VIỆN CỐT LÕI (CORE TECH STACK)

Khi nghiên cứu tính năng mới hoặc tối ưu giao diện, Agent **bắt buộc** phải bám sát hệ sinh thái thư viện đã được cài đặt sẵn:

### A. Giao diện (UI) & Thiết kế (Aesthetics)
*   **Thư viện chính: Ant Design (Antd)**: Toàn bộ form, modal, table, dropdown, select, autocomplete, notification và message phải sử dụng Ant Design để đảm bảo tính nhất quán và đồng bộ token màu sắc.
*   **Styling: TailwindCSS v4**: Sử dụng TailwindCSS để căn chỉnh layout (grid, flex), khoảng cách (padding, margin), font-size, và xây dựng giao diện responsive (mobile/tablet/desktop). Không tự ý viết CSS thủ công trừ khi cấu hình biến CSS trong `index.css`.
*   **Phong cách Obsidian Premium**: Tông màu Obsidian thẳm (Executive Obsidian Workspace), bo góc đồng bộ ở mức 6px đến 12px, độ tương phản cao ở cả chế độ sáng và chế độ tối.

### B. Quản lý trạng thái (State Management)
*   **Zustand**: Dành riêng cho global UI states (ví dụ: thu gọn sidebar, chuyển theme sáng/tối) và lưu trữ access token tạm thời (`authStore`).
*   **TanStack Query v5**: Dành cho tất cả các thao tác gọi API lấy dữ liệu từ server (chỉ sử dụng query/mutation hooks, không lưu trữ dữ liệu server trong Zustand).

### C. Thời gian thực (Real-time)
*   **Socket.io**: Sử dụng Socket.io-client trên frontend và Socket.io trên backend để phát/nhận các sự kiện thời gian thực.

### D. Cơ sở dữ liệu & Backend
*   **Prisma ORM**: Truy vấn dữ liệu qua Prisma client.
*   **SQLite/PostgreSQL**: Thiết kế schema tương thích với cả 2 hệ quản trị cơ sở dữ liệu.
*   **Express & Zod**: Định tuyến router bằng Express và validate dữ liệu đầu vào chặt chẽ qua Zod schemas.

---

## 3. QUY TRÌNH NGHIÊN CỨU & PHÂN TÍCH (RESEARCH PROCESS)
1. **Xác định vấn đề/gap nghiệp vụ hoặc các điểm giao diện chưa được tối ưu**: Chủ động tìm kiếm và đề xuất các tính năng/chức năng mới cần nghiên cứu (chứ không chỉ sửa lỗi vặt).
2. **Làm rõ phạm vi nghiên cứu**: Xác định rõ xem tính năng/đề xuất thuộc phạm vi **Frontend**, **Backend**, hay **Cả hai** (đặc biệt đối với chức năng mới hoàn toàn).
3. **Thiết kế giao diện trước (Design-First với Stitch)**: Nếu đề xuất liên quan đến giao diện mới hoặc nâng cấp/cải tiến giao diện, bắt buộc dùng Stitch MCP (như `generate_screen_from_text`, `edit_screens`, v.v.) để vẽ/phác thảo trước khi viết code frontend.
4. **Đề xuất giải pháp bám sát các công nghệ cốt lõi** ở phần 2.
5. **Ghi lại báo cáo phân tích chi tiết** ý tưởng đó vào tệp: `/docs/analysis/YYYY-MM-DD.md` (sử dụng ngày hiện tại) trước khi tiến hành viết code, bao gồm cả phạm vi nghiên cứu và mockup giao diện từ Stitch (nếu có giao diện).

