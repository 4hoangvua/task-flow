# Báo cáo Nghiên cứu & Phân tích: Ngăn chặn Phụ thuộc tuần hoàn Gián tiếp (Circular Dependency Detection)

**Ngày:** 2026-05-26  
**Phạm vi nghiên cứu:** Cả hai (Frontend + Backend)  
**Mục tiêu:** Tối ưu hóa tính năng "Công việc Phụ thuộc (Task Dependencies)" để ngăn chặn hoàn toàn các liên kết tuần hoàn gián tiếp (ví dụ: A -> B -> C -> A), tăng cường độ tin cậy của logic nghiệp vụ ở cả Backend và cải thiện trải nghiệm người dùng ở Frontend.

---

## 1. PHÂN TÍCH HIỆN TRẠNG & VẤN ĐỀ

### Hạn chế hiện tại ở Backend
Tại hàm `addDependency` trong [taskController.ts](file:///c:/project/task-flow/backend/src/controllers/taskController.ts), hệ thống chỉ kiểm tra liên kết tuần hoàn trực tiếp (Direct Circular Dependency) giữa 2 task:
```typescript
const isCircular = await prisma.taskDependency.findFirst({
  where: {
    taskId: dependsOnId,
    dependsOnId: taskId,
  },
});
```
Nếu người dùng thiết lập:
1. Task A phụ thuộc vào Task B (A -> B).
2. Task B phụ thuộc vào Task C (B -> C).
3. Sau đó thử thiết lập Task C phụ thuộc vào Task A (C -> A).
Hành động số 3 sẽ không bị chặn vì mối quan hệ tuần hoàn giữa C và A là gián tiếp (thông qua B). Điều này tạo ra vòng lặp vô hạn `A -> B -> C -> A`, khiến việc tính toán các điều kiện tiên quyết bị lỗi logic.

### Hạn chế hiện tại ở Frontend
Tại file [TaskDetailModal.tsx](file:///c:/project/task-flow/frontend/src/components/task/TaskDetailModal.tsx), hộp chọn công việc tiên quyết (`Select`) chỉ loại bỏ:
1. Bản thân task hiện tại.
2. Các task đã là phụ thuộc trực tiếp.
3. Các task đang trực tiếp phụ thuộc vào task hiện tại.
Nó không lọc bỏ các công việc sẽ tạo nên vòng lặp gián tiếp, dẫn đến việc người dùng vẫn có thể chọn chúng trong danh sách và chỉ nhận lỗi sau khi gửi yêu cầu lên Backend.

---

## 2. PHƯƠNG ÁN GIẢI QUYẾT (PROPOSED SOLUTION)

### A. Triển khai Thuật toán Phát hiện Chu trình (Cycle Detection using DFS) ở Backend
Xây dựng hàm đệ quy `hasCircularPath` duyệt đồ thị theo chiều sâu (DFS) trên bảng `TaskDependency` để tìm kiếm đường đi từ Task tiên quyết (`dependsOnId`) đến Task đích (`taskId`).
Nếu tồn tại đường đi, nghĩa là việc thêm phụ thuộc mới sẽ khép kín chu trình, ta sẽ chặn và trả về lỗi 400.

```typescript
async function hasCircularPath(currentId: string, targetId: string, visited = new Set<string>()): Promise<boolean> {
  if (currentId === targetId) return true;
  visited.add(currentId);

  const dependencies = await prisma.taskDependency.findMany({
    where: { taskId: currentId },
    select: { dependsOnId: true },
  });

  for (const dep of dependencies) {
    if (!visited.has(dep.dependsOnId)) {
      const found = await hasCircularPath(dep.dependsOnId, targetId, visited);
      if (found) return true;
    }
  }

  return false;
}
```

### B. Lọc danh sách ở Frontend
Tương tự, ở Frontend [TaskDetailModal.tsx](file:///c:/project/task-flow/frontend/src/components/task/TaskDetailModal.tsx), ta sử dụng hàm duyệt DFS trên danh sách công việc của dự án (`projectTasks`) có sẵn để kiểm tra và ẩn các task tạo vòng lặp khỏi dropdown `Select`, tránh hiển thị các lựa chọn không hợp lệ cho người dùng.

---

## 3. DANH SÁCH FILE DỰ KIẾN THAY ĐỔI

| Loại file | Đường dẫn tệp | Mô tả chi tiết thay đổi |
| :--- | :--- | :--- |
| **Backend** | [taskController.ts](file:///c:/project/task-flow/backend/src/controllers/taskController.ts) | - Thêm hàm bổ trợ `hasCircularPath`.<br>- Thay thế logic kiểm tra trực tiếp bằng hàm đệ quy phát hiện chu trình trong `addDependency`. |
| **Frontend** | [TaskDetailModal.tsx](file:///c:/project/task-flow/frontend/src/components/task/TaskDetailModal.tsx) | - Thêm hàm bổ trợ `isReachable`.<br>- Cập nhật điều kiện lọc `availableTasksOptions` để loại trừ các task tạo vòng lặp gián tiếp. |

---

## 4. KẾ HOẠCH KIỂM THỬ (VERIFICATION PLAN)

1. **Kiểm thử biên dịch**:
   - Backend: `npx.cmd tsc` -> Không có lỗi.
   - Frontend: `npx.cmd tsc -b` -> Không có lỗi.
2. **Kịch bản kiểm thử thủ công**:
   - Tạo 3 task: Task A, Task B, Task C trong cùng dự án.
   - Thêm liên kết: A phụ thuộc B.
   - Thêm liên kết: B phụ thuộc C.
   - Mở chi tiết Task C:
     - Xác nhận trong danh sách chọn thêm "Công việc tiên quyết", Task A **không xuất hiện** (vì C -> A tạo ra chu trình A -> B -> C -> A).
   - Thử gọi trực tiếp API `POST /api/tasks/{C_ID}/dependencies` với body `{ dependsOnId: A_ID }` -> Phải nhận lỗi `400 Bad Request` với thông báo lỗi phụ thuộc tuần hoàn.
