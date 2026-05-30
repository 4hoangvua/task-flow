#!/bin/bash

# ==============================================================================
# File: deploy-commands.sh (Tham khảo)
# Mô tả: Chuỗi câu lệnh thực thi deploy thủ công trên máy chủ AWS EC2
# ==============================================================================

# 1. Đi tới thư mục chứa Backend
cd /home/task-flow-backend

# 2. Đồng bộ mã nguồn từ GitHub
git reset --hard
git pull origin main

# 3. Loại bỏ file cấu hình Agent (nếu có) để nhẹ server
rm -f AGENTS.md task-flow-backend.md

# 4. Truy cập thư mục backend cài đặt thư viện và build
cd backend
npm install
npx prisma generate

# 5. Chạy script backup database SQLite trước khi push schema
chmod +x ../.agents/skills/task-flow-ops/scripts/backup-db.sh
../.agents/skills/task-flow-ops/scripts/backup-db.sh

# 6. Đẩy thay đổi schema vào database
npx prisma db push --accept-data-loss

# 7. Build dự án
npm run build

# 8. Khởi động lại dịch vụ qua PM2 để nhận cập nhật env mới nhất
pm2 restart task-flow-backend --update-env

# ==============================================================================
# Hướng dẫn build Frontend (chạy song song hoặc độc lập)
# ==============================================================================
# cd /var/www/task-flow
# git reset --hard
# git pull origin main
# cd frontend
# npm install
# npm run build
