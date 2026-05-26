# Báo cáo Nghiên cứu & Phân tích (Research & Analysis) – Khắc phục Sai lệch Thứ tự Công việc (Task Reordering Gaps)

**Ngày:** 2026-05-26  
**Phạm vi nghiên cứu:** Backend (Controllers)  
**Mục tiêu:** Phát hiện và sửa lỗi tính toán thứ tự hiển thị (`order`) của các công việc (tasks) khi thực hiện xóa công việc hoặc cập nhật trạng thái công việc trực tiếp từ Modal chi tiết.

---

## 1. PHÂN TÍCH HIỆN TRẠNG & LỖI LOGIC

### Vấn đề 1: Gây lỗ hổng/bất nhất thứ tự (`order`) khi xóa công việc (`deleteTask`)
- **Tệp tin:** [taskController.ts](file:///c:/project/task-flow/backend/src/controllers/taskController.ts) tại hàm `deleteTask`.
- **Mô tả:** Khi một công việc bị xóa, hệ thống chỉ đơn giản gọi `prisma.task.delete`. Việc này để lại một khoảng trống (gap) trong chuỗi thứ tự `order` của các công việc còn lại trong cột.
  - Ví dụ: Cột TODO đang có 3 task với `order` là `0, 1, 2`. Xóa task ở vị trí `1` -> các task còn lại có `order` là `0` và `2`.
  - Khi thêm task mới, hệ thống đếm số lượng task hiện tại (`count` = 2) và gán `order` cho task mới là `2`.
  - Kết quả: Có 2 task cùng có `order = 2`, gây không đồng bộ và hiển thị sai lệch khi truy vấn theo `order`.
- **Giải pháp:** Cập nhật hàm `deleteTask` sử dụng Prisma Transaction để vừa xóa task vừa giảm `order` của các task đứng sau trong cùng cột đi 1 (`order: { decrement: 1 }`).

### Vấn đề 2: Sai lệch thứ tự (`order`) khi đổi trạng thái qua Modal chi tiết (`updateTaskStatus`)
- **Tệp tin:** [taskController.ts](file:///c:/project/task-flow/backend/src/controllers/taskController.ts) tại hàm `updateTaskStatus`.
- **Mô tả:** Khi người dùng đổi trạng thái của task bằng thẻ select trong Modal chi tiết công việc:
  - Hệ thống chỉ cập nhật trường `status` của task đó.
  - Các task đứng sau ở cột cũ không được giảm `order` (gây trống thứ tự ở cột cũ).
  - Task được chuyển sang cột mới vẫn giữ nguyên giá trị `order` cũ của nó (ví dụ: `order = 5` dù cột mới chỉ có 1 task).
  - Điều này phá vỡ cấu trúc sắp xếp Kanban kéo thả và gây xung đột thứ tự.
- **Giải pháp:** Cấu trúc lại logic cập nhật trạng thái trong `updateTaskStatus` bằng cách:
  1. Giảm `order` của các task đứng sau trong cột cũ (`oldStatus`).
  2. Đếm số lượng task ở cột mới (`newStatus`).
  3. Gán `order` mới cho task được chuyển đến bằng đúng số lượng task ở cột mới (đưa task xuống cuối cột).
  4. Thực thi tất cả các câu lệnh trên trong một transaction đồng bộ.

---

## 2. PHƯƠNG ÁN SỬA ĐỔI CHI TIẾT (CODE DESIGN)

### Sửa đổi trong `deleteTask`
```typescript
export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return next(new AppError(404, 'NOT_FOUND', 'Task not found'));
    }

    // Thực hiện xóa task và dồn lại thứ tự trong transaction
    await prisma.$transaction([
      prisma.task.delete({
        where: { id: taskId },
      }),
      prisma.task.updateMany({
        where: {
          projectId: task.projectId,
          status: task.status,
          order: { gt: task.order },
        },
        data: {
          order: { decrement: 1 },
        },
      }),
    ]);
    ...
```

### Sửa đổi trong `updateTaskStatus`
```typescript
export async function updateTaskStatus(req: Request, res: Response, next: NextFunction) {
  try {
    ...
    const oldStatus = task.status;
    const newStatus = data.status;

    let updatedTask;
    if (oldStatus !== newStatus) {
      // Đếm số lượng task ở cột mới để lấy order cuối
      const newStatusCount = await prisma.task.count({
        where: {
          projectId: task.projectId,
          status: newStatus,
        },
      });

      const result = await prisma.$transaction([
        // Giảm order của các task phía sau ở cột cũ
        prisma.task.updateMany({
          where: {
            projectId: task.projectId,
            status: oldStatus,
            order: { gt: task.order },
          },
          data: {
            order: { decrement: 1 },
          },
        }),
        // Cập nhật trạng thái và gán order mới cho task
        prisma.task.update({
          where: { id: taskId },
          data: {
            status: newStatus,
            order: newStatusCount,
          },
          include: {
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
          },
        }),
      ]);
      updatedTask = result[1];
    } else {
      updatedTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatar: true } },
        },
      });
    }
    ...
```

---

## 3. KẾ HOẠCH KIỂM THỬ (VERIFICATION PLAN)

1. **Kiểm thử biên dịch (tsc):**
   - Chạy lệnh `npx tsc` trong thư mục `backend/` đảm bảo không lỗi kiểu dữ liệu.
2. **Kịch bản kiểm thử thủ công:**
   - **Xóa task:** Tạo 3 task trong cột TODO. Kiểm tra `order` của chúng trong cơ sở dữ liệu (`0, 1, 2`). Xóa task ở giữa (vị trí `1`). Kiểm tra xem task thứ 3 đã được giảm `order` về `1` hay chưa.
   - **Đổi trạng thái qua Modal:** Tạo 2 task trong cột TODO (`0, 1`) và 1 task trong cột IN_PROGRESS (`0`). Chuyển task đầu tiên của cột TODO (`order = 0`) sang IN_PROGRESS thông qua select select box của Modal. Xác nhận trong cơ sở dữ liệu:
     - Task thứ 2 của cột TODO tự động chuyển thành `order = 0`.
     - Task được chuyển sang cột IN_PROGRESS được gán `order = 1` (được đưa xuống cuối danh sách cột IN_PROGRESS).
