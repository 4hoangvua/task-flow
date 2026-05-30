---
description: Hướng dẫn Agent thực hiện các thao tác vận hành (Operations), kiểm thử (Testing), quản trị cơ sở dữ liệu (Prisma/SQLite) và triển khai (Deployment) cho dự án TaskFlow.
---

# TaskFlow Operations Agent Skill

Tài liệu này định nghĩa kỹ năng vận hành (Operations) dành cho Agent khi làm việc trong dự án **TaskFlow**. Khi được yêu cầu kiểm thử, nâng cấp cơ sở dữ liệu, sửa lỗi kết nối, hoặc hỗ trợ deploy, Agent phải đọc và tuân thủ nghiêm ngặt các chỉ dẫn dưới đây.

---

## 1. QUẢN LÝ XUNG ĐỘT CỔNG (PORT CONFLICTS)

Trước khi chạy ứng dụng local ở chế độ phát triển (`npm run dev`), Agent phải kiểm tra xem các cổng mặc định có bị chiếm dụng bởi các tiến trình chạy ngầm cũ hay không:
- **Backend Port:** `5000`
- **Frontend Port:** `5173` (hoặc `5174` nếu `5173` bị chiếm)

### 1.1. Lệnh kiểm tra và giải phóng cổng trên Windows (PowerShell)
Nếu gặp lỗi `EADDRINUSE: address already in use :::5000`:
```powershell
# Tìm Process ID (PID) đang chiếm cổng 5000
netstat -ano | findstr :5000

# Tiêu diệt tiến trình chiếm cổng (thay <PID> bằng ID tìm được)
taskkill /F /PID <PID>
```

### 1.2. Lệnh kiểm tra và giải phóng cổng trên Linux (SSH Server)
```bash
# Tìm tiến trình đang chiếm cổng 5000
sudo lsof -i :5000
# Hoặc
sudo netstat -lntp | grep 5000

# Tiêu diệt tiến trình (thay <PID> bằng ID tìm được)
sudo kill -9 <PID>
```

---

## 2. QUẢN TRỊ CƠ SỞ DỮ LIỆU (DATABASE OPERATIONS)

Dự án TaskFlow sử dụng **Prisma ORM** với **SQLite** làm cơ sở dữ liệu phát triển ở máy local và máy chủ AWS.

### 2.1. Cập nhật và Đồng bộ Schema
Khi có bất kỳ thay đổi nào trong [schema.prisma](file:///c:/project/task-flow/backend/prisma/schema.prisma):
1. **Tạo Prisma Client mới:**
   ```bash
   cd backend
   npx prisma generate
   ```
2. **Đẩy cấu trúc mới lên SQLite DB (Không tạo file migration thừa):**
   ```bash
   cd backend
   npx prisma db push
   ```
3. **Gieo lại dữ liệu mẫu (Seed):**
   ```bash
   cd backend
   npx prisma db seed
   ```

> [!WARNING]
> SQLite không hỗ trợ kiểu `enum` trực tiếp trong cơ sở dữ liệu. Toàn bộ enums phải được định nghĩa dưới dạng cột `String` trong schema, và các giá trị phải được kiểm soát ở mức Logic/Zod (xem [validation.ts](file:///c:/project/task-flow/backend/src/utils/validation.ts)).

---

## 3. KIỂM THỬ TỰ ĐỘNG & KIỂM TRA KIỂU (TESTING & TYPING)

Trước khi hoàn thành bất kỳ tính năng nào liên quan đến API hoặc logic dữ liệu, Agent phải chạy kiểm thử tự động để tránh lỗi hồi quy (regression).

### 3.1. Chạy Bộ Kiểm Thử (Vitest)
* **Backend Integration Tests:**
  ```bash
  cd backend
  npm run test
  ```
* **Frontend Component/Unit Tests:**
  ```bash
  cd frontend
  npm run test
  ```

### 3.2. Kiểm tra biên dịch TypeScript (Type checking)
Đảm bảo dự án không gặp bất cứ lỗi cảnh báo hoặc lỗi biên dịch TypeScript nào trước khi push:
* **Backend:**
  ```bash
  cd backend
  npx tsc
  ```
* **Frontend:**
  ```bash
  cd frontend
  npx tsc -b
  ```

---

## 4. QUY TRÌNH TRIỂN KHAI VÀ XÁC MINH SẢN PHẨM (DEPLOYMENT & VERIFICATION)

Quy trình deploy chính của chúng ta được cấu hình tự động thông qua GitHub Actions tại tệp [.github/workflows/deploy.yml](file:///c:/project/task-flow/.github/workflows/deploy.yml). Tuy nhiên, Agent cần biết quy trình thủ công và cách xác minh để hỗ trợ người dùng khi cần.

### 4.1. Hướng dẫn Deploy qua SSH
Khi deploy thủ công hoặc kiểm tra sự cố trên server AWS:
1. Kết nối SSH tới server:
   ```bash
   ssh -i C:\Users\hoang\Downloads\hoang.pem ubuntu@3.239.239.72
   ```
2. Cập nhật mã nguồn và khởi chạy lại dịch vụ:
   * Chạy script sao lưu database cục bộ.
   * Pull code mới từ Git.
   * Run `npm install` và `npm run build`.
   * Khởi động lại backend bằng PM2: `pm2 restart task-flow-backend --update-env`.

### 4.2. Danh sách kiểm tra sau khi Deploy (Post-Deployment Checklist)
Sau khi hoàn thành deploy, Agent phải truy cập hoặc hướng dẫn người dùng kiểm tra các điểm sau:
1. **Kiểm tra trạng thái Nginx:**
   ```bash
   sudo systemctl status nginx
   ```
2. **Kiểm tra trạng thái ứng dụng Node.js trong PM2:**
   ```bash
   pm2 status
   pm2 logs task-flow-backend --lines 50
   ```
3. **Kiểm tra API Health:** Gửi request đến `http://hoangtran.name.vn/api/auth/me` (hoặc `http://3.239.239.72:5000/api/auth/me`) để đảm bảo API hoạt động ổn định và không bị lỗi CORS.
4. **Kiểm tra kết nối Real-time (Socket.io):** F12 trên trình duyệt và kiểm tra xem tab Console có lỗi kết nối WebSocket tới cổng 5000 của server hay không.
