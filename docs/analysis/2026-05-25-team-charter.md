# Phân tích & Thiết kế: Tính năng Team Charter (Quy tắc nhóm)

**Ngày:** 2026-05-25  
**Phạm vi nghiên cứu:** Cả hai (Frontend + Backend)  
**Nguồn tham khảo:** Tài liệu C2 KNLVN_Stud.pptx (via NotebookLM)

---

## 1. Tổng quan nghiên cứu

### Mục đích Team Charter (từ Tài liệu C2)
- Chuẩn hóa quy trình hoạt động nhóm
- Đảm bảo luồng thông tin trong nhóm được thông đạt
- Tạo môi trường làm việc minh bạch, hỗ trợ lẫn nhau
- Cung cấp tiêu chuẩn để nhóm tự kiểm tra, đánh giá tiến độ

### Các thành phần chính của Team Charter (C2, mục 2.2.2)
1. **Thời gian:** Thời gian bắt đầu và kết thúc làm việc nhóm
2. **Địa điểm:** Thống nhất địa điểm làm việc cụ thể
3. **Quy luật trao đổi thông tin (Nói và Nghe):**
   - Giới hạn thời gian phát biểu
   - Nội dung vắn tắt, ngắn gọn
   - Đóng góp ý kiến mang tính xây dựng, hòa nhã, thân thiện
   - Đặt lợi ích tập thể lên trên hết
4. **Khen thưởng / Kỷ luật:** Quy định rõ ràng cho từng cá nhân
5. **Chức năng & Quyền hạn:** Quy định rõ cho từng cá nhân

### Ai thiết lập?
- Quy tắc do **cả nhóm** thảo luận và đồng thuận
- **Trưởng nhóm (Leader)** đóng vai trò then chốt: khuyến khích thảo luận, duy trì trọng tâm, giúp nhóm ra quyết định thống nhất

---

## 2. Ý tưởng ứng dụng vào TaskFlow

### Vị trí UI
- Thêm **tab "Quy tắc nhóm"** (Team Charter) trong trang `ProjectDetail`, ngay sau tab "Nhật ký hoạt động" và trước tab "Cấu hình dự án"
- Chỉ **LEADER** mới có quyền chỉnh sửa nội dung Team Charter
- **MEMBER** có thể xem (read-only) toàn bộ quy tắc

### Data Model (Prisma Schema)
Thêm model `TeamCharter` liên kết 1-1 với `Project`:
```prisma
model TeamCharter {
  id              String   @id @default(uuid())
  projectId       String   @unique
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  workingTimeStart String? // VD: "08:00"
  workingTimeEnd   String? // VD: "17:00"
  workingDays      String? // VD: "Mon,Tue,Wed,Thu,Fri" (JSON hoặc CSV)
  workingLocation  String? // Mô tả địa điểm làm việc

  communicationRules String? // Quy luật trao đổi thông tin (rich text)
  rewardRules        String? // Quy định khen thưởng
  disciplineRules    String? // Quy định kỷ luật
  rolesDescription   String? // Mô tả chức năng & quyền hạn bổ sung

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Backend API
- `GET /api/projects/:projectId/charter` — Lấy Team Charter (auth required, project member)
- `PUT /api/projects/:projectId/charter` — Tạo/Cập nhật Team Charter (Leader only)

### Frontend Components
- Tab mới "Quy tắc nhóm" trong `ProjectDetail.tsx`
- Form chỉnh sửa với các trường: thời gian, địa điểm, quy tắc trao đổi, khen thưởng, kỷ luật
- Mode xem (read-only) cho Member, mode chỉnh sửa cho Leader
- Dùng `Input`, `TimePicker`, `Input.TextArea`, `Checkbox.Group` từ Ant Design

### Validation (Zod)
```typescript
export const updateCharterSchema = z.object({
  workingTimeStart: z.string().optional().nullable(),
  workingTimeEnd: z.string().optional().nullable(),
  workingDays: z.string().optional().nullable(),
  workingLocation: z.string().max(500).optional().nullable(),
  communicationRules: z.string().max(2000).optional().nullable(),
  rewardRules: z.string().max(2000).optional().nullable(),
  disciplineRules: z.string().max(2000).optional().nullable(),
  rolesDescription: z.string().max(2000).optional().nullable(),
});
```

---

## 3. Danh sách file cần thay đổi

### Backend
- `backend/prisma/schema.prisma` — Thêm model TeamCharter + relation trên Project
- `backend/src/utils/validation.ts` — Thêm updateCharterSchema
- `backend/src/controllers/charterController.ts` — **[NEW]** Controller GET/PUT
- `backend/src/routes/charterRoutes.ts` — **[NEW]** Route definitions
- `backend/src/routes/index.ts` — Mount charterRoutes

### Frontend
- `frontend/src/types/index.ts` — Thêm interface TeamCharter
- `frontend/src/api/charterApi.ts` — **[NEW]** API calls
- `frontend/src/hooks/useCharter.ts` — **[NEW]** TanStack Query hook
- `frontend/src/pages/ProjectDetail.tsx` — Thêm tab "Quy tắc nhóm"

---

## 4. Mockup UI (mô tả)

### Tab "Quy tắc nhóm" — Leader View (Editable)
```
┌─────────────────────────────────────────────────────┐
│  📜 QUY TẮC LÀM VIỆC NHÓM (TEAM CHARTER)          │
│                                                     │
│  ┌─── THỜI GIAN & ĐỊA ĐIỂM ───────────────────┐   │
│  │ Giờ bắt đầu: [08:00]  Giờ kết thúc: [17:00] │   │
│  │ Ngày làm việc: ☑T2 ☑T3 ☑T4 ☑T5 ☑T6 ☐T7 ☐CN │   │
│  │ Địa điểm: [Phòng họp A3, Tầng 2            ] │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─── QUY LUẬT TRAO ĐỔI THÔNG TIN ────────────┐   │
│  │ [TextArea: nội dung quy tắc giao tiếp...   ] │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─── KHEN THƯỞNG ────────────────────────────┐    │
│  │ [TextArea: quy định khen thưởng...         ] │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─── KỶ LUẬT ────────────────────────────────┐    │
│  │ [TextArea: quy định kỷ luật...             ] │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─── CHỨC NĂNG & QUYỀN HẠN ─────────────────┐    │
│  │ [TextArea: mô tả chức năng từng vai trò... ] │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  [💾 Lưu thay đổi]                                 │
└─────────────────────────────────────────────────────┘
```

### Tab "Quy tắc nhóm" — Member View (Read-only)
- Hiển thị cùng layout nhưng không có form controls
- Dùng Typography/Text thay thế Input/TextArea
- Hiển thị thông báo "Chỉ Leader mới có quyền chỉnh sửa quy tắc nhóm"
