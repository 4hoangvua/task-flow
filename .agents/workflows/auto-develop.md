---
description: Workflow tự động nghiên cứu, lập kế hoạch, phát triển, kiểm thử, cập nhật tài liệu và tự học của Agent hàng ngày.
---

# Auto Develop Workflow - Quy trình Phát triển Tự động

Tài liệu này định nghĩa quy trình tự động hóa hoạt động phát triển của Agent khi nhận lệnh `/auto-develop`. Agent phải hoạt động độc lập như một kỹ sư phát triển phần mềm thực thụ, tự giải quyết vấn đề từ đầu đến cuối mà không cần người dùng can thiệp trừ khi gặp sự cố chặn (blockers).

---

## CÁC BƯỚC THỰC HIỆN HÀNG NGÀY

### Bước 1: Tự chủ Nghiên cứu & Đề xuất (Autonomous Research & Discovery)
1. Thay vì đợi yêu cầu cụ thể từ người dùng, Agent chủ động phân tích hiện trạng dự án:
   - Đọc các tệp kế hoạch [docs/PLAN.md](file:///c:/project/task-flow/docs/PLAN.md) và lịch sử [docs/PROGRESS.md](file:///c:/project/task-flow/docs/PROGRESS.md) để tìm kiếm các tính năng planned chưa thực hiện hoặc các cải tiến tiếp theo.
   - Đọc tệp quy chuẩn nghiên cứu [.agents/rules/analysis.md](file:///c:/project/task-flow/.agents/rules/analysis.md) để bám sát cấu trúc dự án và các thư viện cốt lõi (như Antd cho UI, Zustand, TanStack Query, v.v.).
   - Khảo sát mã nguồn để tự phát hiện các điểm có thể tối ưu hóa giao diện (UI) obsidian, trải nghiệm người dùng (UX), hoặc sửa các lỗi tiềm ẩn.
2. Tự động đề xuất và quyết định chức năng mới hoặc phần giao diện/hiệu năng cần cải tiến trong ngày.
3. **Ghi nhận ý tưởng chi tiết vào file phân tích**: Tạo tệp `/docs/analysis/YYYY-MM-DD.md` (sử dụng ngày hiện tại, ví dụ: `2026-05-24.md`) chứa phân tích hiện trạng, giải pháp đề xuất, và cấu trúc code dự kiến thay đổi.
4. Tìm kiếm các file liên quan bằng công cụ `grep_search` hoặc `list_dir` trong dự án.
5. Phân tích sự phụ thuộc (dependencies), cấu trúc dữ liệu (`prisma/schema.prisma`), các API endpoints hiện có và thiết kế UI liên quan đến đề xuất tự phát triển này.

### Bước 2: Lập Kế hoạch & Phân chia Task (Planning & Tracking)
1. Tạo hoặc cập nhật tệp [task.md](file:///c:/project/task-flow/task.md) ở gốc thư mục dự án để làm bảng việc TODO cá nhân:
   - Sử dụng dấu `[ ]` cho việc chưa bắt đầu, `[/]` cho việc đang làm, và `[x]` cho việc hoàn thành.
2. Phân loại task theo quy chuẩn của `AGENTS.md`:
   * **Tiny:** Sửa đổi nhỏ, cập nhật nhanh.
   * **Normal:** Tính năng/hành vi độc lập mới.
   * **Big:** Đụng chạm cơ sở dữ liệu, phân quyền (RBAC), hoặc bảo mật hệ thống.
3. Tạo trước tệp nhật ký thay đổi của ngày hôm nay trong thư mục `docs/changelogs/YYYY-MM-DD.md` (nếu chưa có).

### Bước 3: Phát triển & Viết Code (Development)
1. Tiến hành viết code cho các file tương ứng.
2. Tuân thủ nghiêm ngặt các quy tắc kỹ thuật tại [.agents/rules/main.md](file:///c:/project/task-flow/.agents/rules/main.md):
   - Tuyệt đối không dùng kiểu `any` trong TypeScript.
   - Sử dụng đúng Ant Design 5 cho các thành phần UI phức tạp và TailwindCSS 4 cho Layout/Responsive.
   - Sử dụng các custom hooks và zustand store hiện có để đồng bộ hóa trạng thái.
3. Code sạch, giữ nguyên các ghi chú/comments cũ không liên quan.

### Bước 4: Tự động Kiểm thử & Khắc phục lỗi (Auto-Testing & Debugging)
1. Trước khi kết thúc mã nguồn, bắt buộc phải chạy kiểm tra kiểu dữ liệu để đảm bảo không lỗi biên dịch:
   - Đối với Frontend: Chạy lệnh `npx.cmd tsc -b` trong thư mục `frontend/`.
   - Đối với Backend: Chạy lệnh `npx.cmd tsc` trong thư mục `backend/`.
2. Chạy bất kỳ unit/integration test nào của dự án (nếu có) để đảm bảo không xảy ra hồi quy (regression).
3. Nếu phát hiện bất cứ lỗi nào (lỗi compile, lỗi cảnh báo console, v.v.), Agent phải **tự phân tích lỗi và sửa đổi lại code cho đến khi biên dịch thành công 100%**.

### Bước 5: Cập nhật Tài liệu & Tự Học (Documentation & Self-Learning)
1. Cập nhật tiến trình vào các file tài liệu quản lý:
   - [docs/PLAN.md](file:///c:/project/task-flow/docs/PLAN.md): Cập nhật trạng thái tổng quát các tính năng.
   - [docs/PROGRESS.md](file:///c:/project/task-flow/docs/PROGRESS.md): Thêm dòng ghi nhận tác vụ đã hoàn thành cùng cách thức xác thực (Proof).
   - `docs/changelogs/YYYY-MM-DD.md`: Ghi chép chi tiết danh sách kỹ thuật đã thay đổi theo định dạng checklist.
2. **Tự Học qua mỗi lần làm việc:**
   - Nếu quá trình code phát hiện ra các bẫy lập trình (gotchas), lỗi cấu hình đặc thù, cách sửa lỗi CORS hay responsive cụ thể... hãy cập nhật trực tiếp kinh nghiệm đó vào mục thích hợp trong [AGENTS.md](file:///c:/project/task-flow/AGENTS.md) hoặc [.agents/rules/main.md](file:///c:/project/task-flow/.agents/rules/main.md). Điều này giúp Agent không lặp lại sai lầm cũ ở các phiên làm việc tiếp theo.

### Bước 6: Commit & Push lên GitHub (Git Delivery)
1. Kiểm tra trạng thái git bằng `git status`.
2. Thêm các file thay đổi vào staging: `git add .`.
3. Tạo commit với thông điệp rõ ràng theo chuẩn Semantic Commits (ví dụ: `feat: ...`, `fix: ...`, `docs: ...`).
4. Đẩy mã nguồn lên GitHub: `git push origin main` để hoàn tất bàn giao và kích hoạt CI/CD Deploy lên server AWS.
