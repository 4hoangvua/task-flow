---
description: Workflow tự động nghiên cứu, lập kế hoạch, phát triển, kiểm thử, cập nhật tài liệu và tự học của Agent hàng ngày.
---

# Auto Develop Workflow - Quy trình Phát triển Tự động

Tài liệu này định nghĩa quy trình tự động hóa hoạt động phát triển của Agent khi nhận lệnh `/auto-develop`. Agent phải hoạt động độc lập như một kỹ sư phát triển phần mềm thực thụ, tự giải quyết vấn đề từ đầu đến cuối mà không cần người dùng can thiệp trừ khi gặp sự cố chặn (blockers).

---

## CÁC BƯỚC THỰC HIỆN HÀNG NGÀY

### Bước 1: Tự chủ Nghiên cứu & Đề xuất (Autonomous Research & Discovery)
1. Thay vì đợi yêu cầu cụ thể từ người dùng, Agent chủ động phân tích hiện trạng dự án để **đề xuất nghiên cứu và phát triển các tính năng/chức năng mới** (chứ không chỉ sửa lỗi vặt hay refactor code):
   - Đọc các tệp kế hoạch [docs/PLAN.md](file:///c:/project/task-flow/docs/PLAN.md) và lịch sử [docs/PROGRESS.md](file:///c:/project/task-flow/docs/PROGRESS.md) để chủ động tìm kiếm các tính năng planned chưa thực hiện hoặc đề xuất thêm các chức năng mới thiết thực.
   - Đọc tệp quy chuẩn nghiên cứu [.agents/rules/analysis.md](file:///c:/project/task-flow/.agents/rules/analysis.md) để bám sát cấu trúc dự án và các thư viện cốt lõi (như Antd cho UI, Zustand, TanStack Query, v.v.).
   - Khảo sát mã nguồn để tự phát hiện các điểm có thể tối ưu hóa giao diện (UI), trải nghiệm người dùng (UX), hoặc thiết kế các luồng chức năng mới.
2. Tự động đề xuất và quyết định chức năng mới hoặc phần giao diện/hiệu năng cần cải tiến trong ngày.
3. **Lựa chọn & Làm rõ phạm vi nghiên cứu**: Trong đề xuất, phải chỉ rõ phạm vi nghiên cứu là **Frontend**, **Backend**, hay **Cả hai** (đặc biệt đối với các chức năng mới hoàn toàn cần cả API backend và UI frontend).
4. **Quy chuẩn thiết kế giao diện (Design-First với Stitch)**:
   - Nếu đề xuất liên quan đến **giao diện mới** hoặc **nâng cấp/cải tiến giao diện**, Agent **bắt buộc phải sử dụng các công cụ Stitch MCP** (như `generate_screen_from_text`, `edit_screens`, v.v.) để thiết kế, vẽ phác thảo giao diện trực quan trước khi bắt tay vào viết code frontend.
   - Ghi nhận đường dẫn hình ảnh hoặc mockup được thiết kế bởi Stitch vào file phân tích.
5. **Ghi nhận ý tưởng chi tiết vào file phân tích**: Tạo hoặc cập nhật tệp `/docs/analysis/YYYY-MM-DD.md` (sử dụng ngày hiện tại, ví dụ: `2026-05-24.md`) chứa phân tích hiện trạng, phạm vi nghiên cứu (Frontend/Backend/Cả hai), mockup UI từ Stitch (nếu có giao diện), giải pháp đề xuất, và cấu trúc code dự kiến thay đổi.
   - **BẮT BUỘC:** Tất cả các phân tích/nghiên cứu trong một ngày chỉ được tạo trong **duy nhất một tệp** `/docs/analysis/YYYY-MM-DD.md`. Không tạo nhiều tệp riêng lẻ (ví dụ: không tạo `YYYY-MM-DD-suffix.md`).
   - Nếu tệp ngày hôm đó đã tồn tại, hãy đọc tệp cũ và **bổ sung thêm** (append) nội dung mới dưới dạng các đề mục hoặc các phần phân tích riêng biệt, giữ nguyên nội dung phân tích cũ.
6. Tìm kiếm các file liên quan bằng công cụ `grep_search` hoặc `list_dir` trong dự án.
7. Phân tích sự phụ thuộc (dependencies), cấu trúc dữ liệu (`prisma/schema.prisma`), các API endpoints hiện có và thiết kế UI liên quan đến đề xuất tự phát triển này.


### Bước 2: Lập Kế hoạch & Phân chia Task (Planning & Tracking)
1. Tạo hoặc cập nhật tệp [task.md](file:///c:/project/task-flow/task.md) ở gốc thư mục dự án để làm bảng việc TODO cá nhân:
   - **BẮT BUỘC**: Các đầu việc trong `task.md` phải bám sát và liệt kê đầy đủ tất cả các nhiệm vụ, hạng mục đã được nghiên cứu và đề xuất trong tệp phân tích `/docs/analysis/YYYY-MM-DD.md`. Không được bỏ sót hay chia nhỏ để trì hoãn.
   - Sử dụng dấu `[ ]` cho việc chưa bắt đầu, `[/]` cho việc đang làm, và `[x]` cho việc hoàn thành.
2. Phân loại task theo quy chuẩn của `AGENTS.md`:
   * **Tiny:** Sửa đổi nhỏ, cập nhật nhanh.
   * **Normal:** Tính năng/hành vi độc lập mới.
   * **Big:** Đụng chạm cơ sở dữ liệu, phân quyền (RBAC), hoặc bảo mật hệ thống.
3. Tạo trước tệp nhật ký thay đổi của ngày hôm nay trong thư mục `docs/changelogs/YYYY-MM-DD.md` (nếu chưa có).

### Bước 3: Phát triển & Viết Code (Development)
1. **BẮT BUỘC**: Tiến hành viết code triển khai và hoàn thành toàn bộ các hạng mục công việc, chức năng/nhiệm vụ đã được nghiên cứu và ghi nhận trong tệp phân tích `/docs/analysis/YYYY-MM-DD.md` của ngày hôm đó. Tuyệt đối không được bỏ sót hoặc chỉ thực hiện một phần trừ khi có sự đồng ý hoặc chỉ thị rõ ràng từ người dùng.
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

### Bước 6: Kiểm thử Chức năng & Ghi nhận Nhật ký (Functional Testing & Logging)
1. **BẮT BUỘC**: Sau khi hoàn thành viết code và cập nhật các tài liệu ở Bước 5, Agent phải thực hiện kiểm thử chức năng/API đối với tất cả các nghiệp vụ mới tạo hoặc sửa đổi để đảm bảo không phát sinh lỗi Runtime (ví dụ: lỗi API 500, lỗi truy vấn DB, lỗi phân quyền, lỗi logic React Hooks hoặc lỗi logic tích hợp dữ liệu).
   - *Lưu ý*: Kiểm thử này chỉ tập trung vào chức năng và API logic, không dùng mã/script tự động để kiểm thử giao diện (UI/Layout/giao diện trực quan) vì việc dùng mã gọi API không hợp lý để kiểm tra giao diện trực quan.
2. **Tạo nhật ký kiểm thử**: Tạo file nhật ký kiểm thử hàng ngày tại `/docs/testing/YYYY-MM-DD.md` (ví dụ: `2026-05-25.md`). File này phải chứa:
   - Danh sách các kịch bản kiểm thử (Test Cases).
   - Kết quả thực tế (Actual Results) và Trạng thái (PASS/FAIL).
3. **Vòng lặp sửa lỗi (Debug Loop)**: Nếu phát hiện bất kỳ lỗi chức năng hay lỗi logic nào trong quá trình kiểm thử, Agent phải quay lại Bước 3 để sửa code, Bước 4 để compile lại, Bước 5 để cập nhật lại nhật ký changelog và tiếp tục kiểm thử lại cho đến khi tất cả các kịch bản đều đạt trạng thái **PASS 100%**.



