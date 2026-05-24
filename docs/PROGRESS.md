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
| 20 | Hỗ trợ cấu hình LAN chạy trên 2 máy cùng mạng | 2026-05-23 | Cấu hình server.host: true trong vite.config.ts, dynamic CORS cho LAN IPs trong index.ts, và tạo template cho frontend/.env |
| 21 | Cải tiến giao diện theo thiết kế Stitch | 2026-05-23 | Cập nhật CSS variables, antd tokens (borders, border-radius, active sidebar) và đồng bộ qua layout |
| 22 | Tinh chỉnh độ bo góc & palette obsidian | 2026-05-23 | Loại bỏ các class rounded-2xl thô cứng, tinh chỉnh antd tokens sang 8px/6px và chuyển đổi sang palette màu obsidian thẳm |
| 23 | Cải thiện bảng màu chủ đề & độ tương phản | 2026-05-23 | Điều chỉnh ConfigProvider tokens sang Zinc/Slate, đồng bộ hóa index.css và thay thế mã màu cứng |
| 24 | Sửa lỗi highlight active menu Sidebar | 2026-05-23 | Tính toán selectedKeys trong DashboardLayout.tsx dựa trên tiền tố tuyến đường /projects |
| 25 | Thiết kế lại giao diện dự án dạng Grid | 2026-05-23 | Thay thế giao diện card cũ trong Projects.tsx bằng khối thống kê hiện đại, hover co giãn nút vào dự án |
| 26 | Đồng bộ hóa nhãn trạng thái dự án | 2026-05-23 | Thống nhất nhãn văn bản sang "Đang hoạt động" / "Đã lưu trữ" ở cả header breadcrumbs và grid card |
| 27 | Tích hợp DragOverlay trong Kanban | 2026-05-23 | Dùng DragOverlay trong TaskBoard.tsx kéo thả mượt mà không bị méo, giật hoặc che khuất bởi cột cuộn |
| 28 | Phân quyền thay đổi trạng thái Backend | 2026-05-23 | Ràng buộc quyền thay đổi cột trạng thái trong reorderTasks tại taskController.ts |
| 29 | Cải thiện độ hiển thị văn bản (Typography) | 2026-05-23 | Tăng cỡ chữ tag trạng thái, ID, nhãn mô tả, và menu dropdown giúp chữ to rõ, đồng bộ hơn |
| 30 | Tách biệt các component UI dùng chung | 2026-05-23 | Tạo ProjectStatusTag, PriorityTag và TaskIdBadge dưới components/common để dễ bảo trì tập trung |
| 31 | Khắc phục màu sắc Tag & Dọn dẹp Card Kanban | 2026-05-23 | Dùng !important cho Tag để giữ màu, ẩn Task ID khỏi Kanban card và Việt hóa nhãn chi tiết |
| 32 | Cập nhật quy tắc phản hồi trong AGENTS.md | 2026-05-23 | Thêm quy định trả lời ngắn gọn "Đã xong" và chỉ ra ngày của file log khi hoàn tất sửa chữa |
| 33 | Sửa lỗi warning Antd, chữ mờ và responsive mobile | 2026-05-24 | Đã sửa bodyStyle, thêm biến màu `--text-secondary`/`--text-tertiary`, tích hợp Drawer menu, Segmented columns và card list |
| 34 | Tính năng Tìm kiếm Email & Tự động gợi ý thành viên dự án | 2026-05-24 | Đã tích hợp AutoComplete gợi ý email khi Leader click vào trường mời thành viên |
| 35 | Cấu hình địa chỉ IP AWS mới | 2026-05-24 | Đã cập nhật IP trên server AWS (Nginx & Backend) và frontend env ở local |
| 36 | Chuyển đổi công cụ Tìm kiếm sang AutoComplete gợi ý | 2026-05-24 | Đã tạo component chung SearchAutoComplete và tích hợp thành công trên các trang Dự án, Công việc của tôi và Kanban, tsc thành công |
| 37 | Dịch vụ chạy ngầm kiểm tra Hạn chót công việc | 2026-05-24 | Thiết lập startDeadlineScheduler kiểm tra các task sắp hết hạn dưới 24h và tạo/bắn thông báo DEADLINE_APPROACHING qua Socket.io thành công, tsc thành công |
| 38 | Đóng gói Docker & Cấu hình Docker Compose | 2026-05-24 | Khởi tạo Dockerfile cho frontend/backend, nginx.conf và docker-compose.yml chạy tsc biên dịch thành công |
| 39 | Đồng bộ hóa cộng tác thời gian thực & Nhật ký hoạt động | 2026-05-24 | Tích hợp lắng nghe WebSocket rooms để đồng bộ hóa và xây dựng tab Timeline nhật ký hoạt động |

**Proof** = how we know it works. Examples: "tested manually", "unit test passes", "screenshot", "runs on localhost".

## Known Issues

Track outstanding bugs, pending fixes, or known system limitations.

| #  | Issue             | Severity   | Status         |
| -- | ----------------- | ---------- | -------------- |

**Severity:** `low` | `medium` | `high` | `blocker`
**Status:** `open` | `fixing` | `fixed` | `wont-fix`
