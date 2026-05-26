# Báo cáo Phân tích & Đề xuất: Phân chia Danh sách Dự án (Sở hữu vs Tham gia)

**Ngày:** 2026-05-26  
**Phạm vi nghiên cứu:** Frontend (Giao diện Danh sách Dự án)  
**Mục tiêu:** Đề xuất phương án cải tiến giao diện trang danh sách dự án (`/projects`) để người dùng dễ dàng phân biệt giữa các dự án do mình tự tạo (Sở hữu) và các dự án do người khác tạo mà mình được giao/tham gia.

---

## 1. PHÂN TÍCH HIỆN TRẠNG
Hiện tại, trang [Projects.tsx](file:///c:/project/task-flow/frontend/src/pages/Projects.tsx) lấy toàn bộ danh sách dự án từ API `GET /api/projects` và hiển thị lẫn lộn trong một lưới (Grid) hoặc bảng (Table). 
Người dùng chỉ có thể phân biệt qua nhãn chủ sở hữu ở phần chân thẻ (VD: `Chủ: member_name`), điều này gây khó khăn khi số lượng dự án tăng lên, đặc biệt khi người dùng vừa có dự án cá nhân tự quản lý vừa có dự án của công ty do Leader giao.

---

## 2. GIẢI PHÁP ĐỀ XUẤT (PROPOSED SOLUTION)

Sử dụng thành phần **Tabs** của Ant Design ngay phía trên danh sách dự án để phân chia bộ lọc trực quan:
1. **Tất cả dự án (All Projects):** Hiển thị toàn bộ dự án mà người dùng tham gia hoặc sở hữu.
2. **Dự án của tôi (My Projects - Sở hữu):** Chỉ hiển thị các dự án do chính người dùng hiện tại làm chủ sở hữu (`project.ownerId === user.id`).
3. **Dự án tham gia (Joined Projects - Tham gia):** Chỉ hiển thị các dự án do người khác sở hữu và người dùng hiện tại tham gia với tư cách thành viên (`project.ownerId !== user.id`).

### Lợi ích:
- Hiển thị số lượng dự án trên từng nhãn Tab giúp người dùng nắm bắt nhanh (VD: *Dự án của tôi (3)*, *Dự án tham gia (5)*).
- Người dùng chuyển đổi tức thì không cần tải lại trang vì việc lọc được thực hiện trực tiếp ở phía Client.
- Đồng bộ giao diện Tabs mượt mà với phong cách chung của hệ thống.

---

## 3. DANH SÁCH FILE DỰ KIẾN THAY ĐỔI

| Loại file | Đường dẫn tệp | Mô tả chi tiết thay đổi |
| :--- | :--- | :--- |
| **Frontend** | [Projects.tsx](file:///c:/project/task-flow/frontend/src/pages/Projects.tsx) | - Thêm state `activeTab` để theo dõi tab đang chọn (`all`, `owned`, `joined`).<br>- Cập nhật hàm lọc `filteredProjects` để lọc thêm điều kiện `ownerId` tương ứng.<br>- Thêm component `<Tabs />` của Ant Design để chuyển đổi giữa các bộ lọc. |

---

## 4. KẾ HOẠCH KIỂM THỬ (VERIFICATION PLAN)

1. **Kiểm thử biên dịch**: Chạy `npx.cmd tsc -b` trong thư mục `frontend/` để kiểm tra kiểu dữ liệu.
2. **Kiểm thử thủ công**:
   - Đăng nhập tài khoản.
   - Chuyển đổi giữa các tab:
     - Tab **Tất cả**: Phải hiển thị toàn bộ dự án.
     - Tab **Dự án sở hữu**: Chỉ hiển thị các dự án do chính tài khoản này tạo (nhãn chủ sở hữu trùng với tên mình).
     - Tab **Dự án tham gia**: Chỉ hiển thị các dự án do tài khoản khác tạo (nhãn chủ sở hữu là tên người khác).
