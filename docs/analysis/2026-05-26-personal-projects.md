# Báo cáo Phân tích & Đề xuất: Cho phép Thành viên (Member) tự tạo và sở hữu dự án riêng

**Ngày:** 2026-05-26  
**Phạm vi nghiên cứu:** Cả hai (Frontend + Backend)  
**Mục tiêu:** Nghiên cứu và đề xuất cơ chế cho phép người dùng với vai trò hệ thống là Thành viên (MEMBER) có thể tự tạo và sở hữu các dự án riêng của mình, đồng thời vẫn tham gia vào các dự án khác được giao bởi Trưởng nhóm (LEADER).

---

## 1. PHÂN TÍCH HIỆN TRẠNG & HẠN CHẾ (CURRENT STATE)

### A. Phân quyền ở mức Hệ thống (System-level RBAC)
Hiện tại, hệ thống sử dụng vai trò người dùng toàn cục (`User.role`: `ADMIN | LEADER | MEMBER`) để kiểm soát một số hành động chung:
- **Tạo dự án mới (POST /api/projects):** Bị chặn ở Backend bởi middleware `requireSystemRole(['LEADER'])` tại file [projectRoutes.ts](file:///c:/project/task-flow/backend/src/routes/projectRoutes.ts#L24).
- **Nút "Tạo dự án mới" trên giao diện:** Bị ẩn đối với người dùng `MEMBER` tại file [Projects.tsx](file:///c:/project/task-flow/frontend/src/pages/Projects.tsx#L123) thông qua biến kiểm tra `isLeaderOrAdmin = user?.role === 'LEADER' || user?.role === 'ADMIN'`.

### B. Phân quyền ở mức Dự án (Project-level RBAC)
Khi một dự án được tạo, người tạo dự án sẽ được thiết lập làm chủ sở hữu (`Project.ownerId = userId`) và được gán vai trò `LEADER` trong bảng thành viên dự án (`ProjectMember.role = 'LEADER'`) tại file [projectController.ts](file:///c:/project/task-flow/backend/src/controllers/projectController.ts#L62-L73).
Các chức năng bên trong dự án (như quản lý thành viên, tạo/sửa/xóa công việc, v.v.) sử dụng các middleware `requireProjectRole` và `requireTaskProjectRole` để kiểm tra:
1. Người dùng có phải chủ sở hữu dự án (`project.ownerId === user.id`)?
2. Vai trò thành viên dự án (`ProjectMember.role`) của người dùng trong dự án đó là gì?
Nhờ thiết kế này, nếu người dùng hệ thống là `MEMBER` được phép tạo dự án, họ sẽ nghiễm nhiên có toàn quyền Quản trị (LEADER) trong dự án mà họ tự tạo, nhưng chỉ có quyền thành viên (MEMBER) trong các dự án mà Trưởng nhóm khác giao cho họ.

### C. Hạn chế trên giao diện Trang chủ (Dashboard Layout & Logic)
Hiện tại, trang `Dashboard.tsx` kiểm tra cứng:
`const isMember = user?.role === 'MEMBER';`
Nếu đúng, giao diện sẽ trả về sớm (early return) chỉ hiển thị phần thống kê công việc cá nhân được giao (Assigned Tasks) mà không hiển thị biểu đồ thống kê, lịch sử hoạt động và hộp chọn dự án (Project selector).
Khi một `MEMBER` tự tạo dự án của mình, họ sẽ cần xem được biểu đồ và hoạt động của dự án đó giống như một `LEADER`.

---

## 2. THIẾT KẾ GIẢI PHÁP ĐỀ XUẤT (PROPOSED SOLUTION)

### A. Cập nhật Backend
Chúng ta chỉ cần điều chỉnh định tuyến tạo dự án tại [projectRoutes.ts](file:///c:/project/task-flow/backend/src/routes/projectRoutes.ts):
Cho phép vai trò hệ thống `MEMBER` gọi API tạo dự án.
```typescript
// Trước:
router.post('/', requireSystemRole(['LEADER']), createProject);

// Sau:
router.post('/', requireSystemRole(['LEADER', 'MEMBER']), createProject);
```
Không cần thay đổi logic trong `createProject` controller hay cơ sở dữ liệu, vì controller đã tự động gán vai trò `LEADER` nội bộ trong bảng `ProjectMember` cho người tạo dự án.

### B. Cập nhật Frontend
1. **Trang Danh sách dự án ([Projects.tsx](file:///c:/project/task-flow/frontend/src/pages/Projects.tsx)):**
   Hiển thị nút **"Tạo dự án mới"** cho tất cả người dùng (không phân biệt `LEADER` hay `MEMBER` toàn cục).
2. **Trang Tổng quan ([Dashboard.tsx](file:///c:/project/task-flow/frontend/src/pages/Dashboard.tsx)):**
   Tái cấu trúc giao diện Dashboard thành mô hình **Tabs** (Sử dụng `<Tabs />` của Ant Design):
   - **Tab 1: Cá nhân (Personal Dashboard):** Hiển thị thống kê cá nhân của người dùng hiện tại (số công việc được gán, hoàn thành, quá hạn) - hiển thị cho mọi người dùng.
   - **Tab 2: Dự án (Project Dashboard):** Hiển thị hộp chọn dự án, các thẻ chỉ số KPI của dự án, biểu đồ Recharts (công việc theo dự án, tỷ lệ trạng thái) và Nhật ký hoạt động gần đây của dự án.
     - *Lưu ý:* Tab này khả dụng cho tất cả người dùng. Nếu người dùng chưa tham gia hay sở hữu dự án nào, Tab 2 sẽ hiển thị trạng thái trống (`Empty` state).

---

## 3. DANH SÁCH FILE DỰ KIẾN THAY ĐỔI

| Loại file | Đường dẫn tệp | Mô tả chi tiết thay đổi |
| :--- | :--- | :--- |
| **Backend** | [projectRoutes.ts](file:///c:/project/task-flow/backend/src/routes/projectRoutes.ts) | Thay đổi middleware `requireSystemRole(['LEADER'])` thành `requireSystemRole(['LEADER', 'MEMBER'])` cho endpoint `POST /`. |
| **Frontend** | [Projects.tsx](file:///c:/project/task-flow/frontend/src/pages/Projects.tsx) | Loại bỏ điều kiện kiểm tra hệ thống `isLeaderOrAdmin` khi hiển thị nút "Tạo dự án mới". |
| **Frontend** | [Dashboard.tsx](file:///c:/project/task-flow/frontend/src/pages/Dashboard.tsx) | Thiết lập cấu trúc Tabs để gộp cả phần Dashboard cá nhân và Dashboard dự án. |

---

## 4. KẾ HOẠCH KIỂM THỬ (VERIFICATION PLAN)

### Kiểm thử tự động (tsc)
- Chạy lệnh biên dịch TypeScript ở cả frontend và backend để đảm bảo không phát sinh lỗi kiểu dữ liệu:
  - Backend: `npx tsc` trong thư mục `backend/`
  - Frontend: `npx tsc -b` trong thư mục `frontend/`

### Kịch bản kiểm thử thủ công (Manual Test Cases)
1. **Đăng nhập với tài khoản có vai trò MEMBER hệ thống (ví dụ: `member@taskflow.com`):**
   - Kiểm tra xem nút **"Tạo dự án mới"** có hiển thị tại trang Dự án hay không.
   - Nhấp vào nút và tạo thử dự án mới tên `"Dự án cá nhân của Member"`.
   - Xác nhận dự án được tạo thành công và chuyển hướng đến trang Chi tiết dự án.
2. **Kiểm tra quyền hạn trong dự án tự sở hữu:**
   - Xác nhận Member có quyền tạo công việc mới (Task), cập nhật trạng thái, và thêm thành viên khác (ví dụ: mời `leader@taskflow.com` vào dự án).
3. **Kiểm tra giao diện Dashboard của Member:**
   - Truy cập trang Tổng quan (`/dashboard`).
   - Xác nhận giao diện hiển thị 2 tab: "Cá nhân" (hiển thị tóm tắt các task được gán cho Member đó) và "Dự án" (chứa biểu đồ thống kê cho dự án vừa tạo).
   - Chọn dự án vừa tạo trong hộp chọn và xác nhận biểu đồ cập nhật dữ liệu chính xác.
4. **Kiểm tra quyền hạn trong dự án do người khác giao:**
   - Member truy cập vào một dự án do Leader khác tạo (ví dụ: dự án được gán trong dữ liệu mẫu).
   - Xác nhận Member bị hạn chế các quyền quản trị như: không thể đổi tên dự án, không thể chỉnh sửa thiết lập dự án (tab Settings ẩn), không thể tự ý tạo công việc (chỉ được thực hiện công việc được gán).
