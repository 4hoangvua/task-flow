# TaskFlow - Agent Guidelines & Workflow Rules

Tài liệu này định nghĩa các quy tắc bắt buộc và hướng dẫn luồng làm việc của Agent trong dự án **TaskFlow**.

---

## 1. LUỒNG HOẠT ĐỘNG (WORKFLOW)

### Thứ tự đọc tài liệu (Read Order)
Trước khi thực hiện bất kỳ nhiệm vụ nào, bạn phải đọc các tài liệu theo thứ tự sau:
1. `AGENTS.md` - Quy tắc hoạt động của Agent.
2. `.agents/rules/main.md` (chính là tài liệu này).
3. `docs/PLAN.md` - Kế hoạch tổng thể và các tính năng tiếp theo.
4. `docs/PROGRESS.md` - Các công việc đã hoàn thành và chứng minh hoạt động (Proof).
5. [task-flow.md](file:///c:/project/task-flow/task-flow.md) - Tài liệu đặc tả kỹ thuật chi tiết nhất (Tech Stack, Schema, API, Pages).
6. Yêu cầu hiện tại của người dùng.

### Quy trình thực hiện Task (Execution Steps)
1. **Kiểm tra kế hoạch:** Đối chiếu yêu cầu với `docs/PLAN.md`.
2. **Phân loại quy mô (Size Rules):**
   * **Tiny:** Sửa lỗi nhanh, typos, CSS nhỏ, cập nhật tài liệu -> Làm trực tiếp.
   * **Normal:** Tính năng/hành vi mới -> Thêm một dòng vào `docs/PROGRESS.md` -> Code -> Cập nhật trạng thái hoàn thành.
   * **Big:** Liên quan Auth, Schema, RBAC, nhiều tính năng -> Cập nhật `docs/PLAN.md` -> Xác nhận với người dùng -> Ghi nhận vào `docs/DECISIONS.md`.
3. **Trong khi làm việc:** Tạo/Cập nhật file `task.md` (nếu có) làm TODO list để theo dõi tiến độ.
4. **Đồng bộ:** Sau khi hoàn thành và kiểm thử, commit và push toàn bộ thay đổi lên GitHub.

---

## 2. QUY TẮC PHÁT TRIỂN CỐT LÕI (DEVELOPMENT RULES)

Mọi mã nguồn được tạo ra phải tuân thủ nghiêm ngặt các quy tắc dưới đây. Chi tiết kỹ thuật cụ thể (Database, API, WebSocket, UI Pages) cần tham khảo trực tiếp tại [task-flow.md](file:///c:/project/task-flow/task-flow.md).

* **TypeScript:** Luôn sử dụng TypeScript chặt chẽ, tuyệt đối không dùng `any`. Khai báo rõ ràng interfaces/types cho props, state và API.
* **State Management:**
  * Chỉ dùng **Zustand** cho global UI state (theme, sidebar/modal toggle) và `authStore`.
  * Dùng **TanStack Query v5** cho toàn bộ dữ liệu từ server (tasks, projects, comments, notifications) với `staleTime: 5000`.
* **UI & Styling:**
  * **Ant Design 5** cho các UI component phức tạp (Table, Form, Select, Modal, DatePicker).
  * **TailwindCSS 4** cho layout, spacing, các thẻ nhiệm vụ (task cards) và responsive.
* **Định dạng API Response:** Luôn dùng cấu trúc chuẩn `{ success, data/error, meta? }`.
* **Auth & Phân quyền (RBAC):**
  * Sử dụng Access Token (15m, memory) và Refresh Token (7d, localStorage).
  * Phân quyền chặt chẽ trên cả Frontend (`RoleGuard`) và Backend (`rbacMiddleware`) theo ma trận quyền hạn (LEADER: toàn quyền dự án/task; MEMBER: chỉ tương tác với task được gán và reorder).
* **WebSocket:** Phát các sự kiện socket chuẩn (`task:created`, `task:updated`, `task:status-changed`, v.v.) vào room của `projectId`.
* **Error Handling:** Quản lý lỗi tập trung qua `AppError` và `errorHandler` (Backend), React `ErrorBoundary` và Ant Design message/notification (Frontend).
* **Trải nghiệm kéo thả:** Bắt buộc áp dụng **Optimistic Updates** thông qua TanStack Query khi kéo thả task trên Kanban Board.
