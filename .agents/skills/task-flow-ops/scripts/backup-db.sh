#!/bin/bash

# ==============================================================================
# Script: backup-db.sh
# Mô tả: Tự động sao lưu cơ sở dữ liệu SQLite dev.db của TaskFlow kèm timestamp
# Sử dụng: Chạy trước khi thực hiện `prisma db push` hoặc deploy code mới.
# ==============================================================================

# Cấu hình đường dẫn
DB_PATH="/home/task-flow-backend/backend/prisma/dev.db"
BACKUP_DIR="/home/task-flow-backend/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/dev.db.bak.${TIMESTAMP}"

echo "=== Bắt đầu tiến trình sao lưu cơ sở dữ liệu ==="

# Kiểm tra sự tồn tại của file database
if [ -f "$DB_PATH" ]; then
    # Tạo thư mục backup nếu chưa tồn tại
    mkdir -p "$BACKUP_DIR"
    
    # Thực hiện sao lưu
    cp "$DB_PATH" "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Sao lưu thành công!"
        echo "📁 Tệp sao lưu: $BACKUP_FILE"
        
        # Tự động dọn dẹp các bản sao lưu cũ hơn 7 ngày để tránh đầy ổ cứng
        echo "🧹 Đang kiểm tra dọn dẹp các bản sao lưu cũ hơn 7 ngày..."
        find "$BACKUP_DIR" -name "dev.db.bak.*" -type f -mtime +7 -delete
        echo "✨ Hoàn thành tiến trình sao lưu."
    else
        echo "❌ Lỗi: Sao chép tệp database thất bại!"
        exit 1
    fi
else
    echo "⚠️ Cảnh báo: Không tìm thấy file database tại $DB_PATH. Bỏ qua bước sao lưu."
fi
