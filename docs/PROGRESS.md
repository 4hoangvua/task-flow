# Progress Tracker

Track what has been built, modified, and proven to work throughout the project lifecycle.

## Completed Work

Record completed tasks or features here with timestamps and verifiable proof.

| #  | Feature / Task              | Date       | Proof                  |
| -- | --------------------------- | ---------- | ---------------------- |
| 1  | Khởi tạo tài liệu dự án     | 2026-05-20 | Tạo AGENTS.md và thư mục docs/ |
| 2  | Phân tích task-flow.md (F02) | 2026-05-20 | Tạo task_flow_analysis.md — xác định 13+ gaps |
| 3  | Khởi tạo GitHub repo & push | 2026-05-21 | Đã tạo repo task-flow và push code lên main |
| 4  | Thiết lập Rule Agent (.agents) | 2026-05-21 | Tạo main.md dưới .agents/rules/ dựa trên spec task-flow.md |
| 5  | Thiết lập cơ sở dữ liệu SQLite & Seed (F03) | 2026-05-21 | Chạy prisma migrate & db seed thành công, tạo dữ liệu mẫu cho Leader, Member, Projects, Tasks |
| 6  | Backend Auth & RBAC APIs (F04-F05) | 2026-05-21 | Đã hoàn thành các endpoint JWT & RBAC cho User, Project, Task, Comment, Notification |
| 7  | WebSocket Handlers (F06) | 2026-05-21 | Tích hợp Socket.io trên Backend cho real-time events |
| 8  | Frontend Integration & E2E (F07-F09) | 2026-05-21 | Toàn bộ 10 trang giao diện, Axios interceptor, Zustand stores, custom hooks, DnD Kanban board hoạt động và build thành công |
| 9  | Sửa cấu hình Tailwind CSS v4 & tích hợp Antd | 2026-05-21 | Cài đặt @tailwindcss/vite, cấu hình vite.config.ts & index.css, build thành công và chạy mượt |
| 10 | Sửa kích thước container và tối ưu responsive | 2026-05-21 | Bỏ width: 1126px cố định và text-align: center trên #root; kiểm tra responsive trên mobile/tablet/desktop mượt mà |
| 11 | Phân quyền hiển thị giao diện & Logic API (RBAC UI) | 2026-05-21 | Ẩn/hiển thị tab cấu hình, các hành động sửa/xóa/mời thành viên và vô hiệu hóa status select / drag-drop chặn cho Member |
| 12 | Cập nhật tài liệu dự án & tạo changelog workflow | 2026-05-21 | Viết lại task-flow.md theo thực tế, tạo docs/changelogs/, cập nhật AGENTS.md & PLAN.md 3.1, loại phần không dùng |
| 13 | Nâng cấp giao diện Header (tốt hơn, premium) | 2026-05-22 | Đã hoàn thành các cải tiến: Breadcrumb động, Theme Switcher Sun/Moon, Notification Bell, và User Card dropdown |
| 14 | Sửa lỗi cấu hình MCP Antd | 2026-05-22 | Đã cài đặt @ant-design/cli toàn cục và đổi lệnh khởi chạy sang antd |
| 15 | Hiện đại hóa Modals, trang Công việc, trang Cấu hình và sửa các lỗi biên dịch | 2026-05-22 | Đã sửa và hoàn thành cải tiến giao diện cho các modal chi tiết task, trang MyTasks, Settings |
| 16 | Dọn dẹp và chuẩn hóa mã màu Tailwind CSS không hợp lệ | 2026-05-22 | Thay đổi các class màu không chuẩn về hệ màu chuẩn trong các trang Dashboard, Projects, MyTasks, TaskDetailModal |
| 17 | Tạo thanh bộ lọc cố định (sticky top) trên trang Công việc, Dự án và bảng Kanban | 2026-05-23 | Đã thêm lớp CSS sticky top-0 z-10 cho Projects.tsx/MyTasks.tsx và top-[54px] z-10 cho TaskBoard.tsx (đã thu hồi và chuyển sang non-sticky) |
| 18 | Khắc phục lỗi hiển thị Kanban (bị bể và lệch), chỉ giữ tab dự án cố định | 2026-05-23 | Loại bỏ sticky khỏi thanh bộ lọc ở cả 3 trang, đổi Kanban columns từ Row/Col Antd sang flexbox shrink-0, tsc thành công |
| 19 | Sửa lỗi lộ nội dung cuộn bên dưới thanh tab sticky | 2026-05-23 | Sử dụng background: var(--bg) !important trong index.css, áp dụng kỹ thuật lề âm/đệm dương để phủ tràn viền ngang |


**Proof** = how we know it works. Examples: "tested manually", "unit test passes", "screenshot", "runs on localhost".

## Known Issues

Track outstanding bugs, pending fixes, or known system limitations.

| #  | Issue             | Severity   | Status         |
| -- | ----------------- | ---------- | -------------- |

**Severity:** `low` | `medium` | `high` | `blocker`
**Status:** `open` | `fixing` | `fixed` | `wont-fix`
