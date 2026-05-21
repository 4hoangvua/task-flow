# Project Plan

This document outlines what we are building, the target technology stack, core features, and current architecture notes. It serves as the primary source of truth for the project's roadmap and direction.

## Product Summary

TaskFlow là ứng dụng quản lý công việc (Task Management) real-time, hỗ trợ Kanban board, phân quyền LEADER/MEMBER, và thông báo tức thì qua WebSocket. Đối tượng: team nhỏ cần quản lý dự án đơn giản.

## Tech Stack

| Layer      | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Frontend   | React 18 + TypeScript + Vite                              |
| UI         | Ant Design 5 + TailwindCSS 4                              |
| State      | Zustand (global) + TanStack Query (server)                 |
| Backend    | Node.js 20 LTS + Express + TypeScript                      |
| ORM        | Prisma 5                                                  |
| Database   | PostgreSQL 16                                             |
| Auth       | JWT + bcrypt                                              |
| Realtime   | Socket.io                                                 |
| Charts     | Recharts 2                                                |
| Drag-Drop  | @dnd-kit/sortable                                         |

## Features

| #   | Feature                   | Status      | Notes                                                              |
| --- | ------------------------- | ----------- | ------------------------------------------------------------------ |
| F01 | Project Setup             | in-progress | Khởi tạo cấu trúc dự án và tài liệu hướng dẫn cho agent             |
| F02 | Spec Analysis             | done        | Phân tích task-flow.md, xác định gaps & bổ sung chi tiết            |
| F03 | Database Schema           | planned     | Sửa Prisma schema: timestamps, relations, Notification, TaskHistory |
| F04 | Auth & RBAC               | planned     | JWT flow, role matrix, protected routes                             |
| F05 | API Endpoints             | planned     | Full CRUD + pagination + error format                               |
| F06 | WebSocket Events          | planned     | Bổ sung events, auth, reconnection                                  |
| F07 | UI/Pages Detail           | planned     | Layout, wireframes, component breakdown cho 10 pages                |
| F08 | Backend Implementation    | planned     | Express + Prisma + Socket.io                                        |
| F09 | Frontend Implementation   | planned     | React pages + stores + hooks                                        |
| F10 | Testing & Deployment      | planned     | Vitest, Docker, CI/CD                                               |

**Status values:** `planned` → `in-progress` → `done` → `cut`

## Architecture Notes

- **Monorepo**: `frontend/` + `backend/` trong cùng project root
- **State split**: Zustand cho auth/UI, TanStack Query cho server data
- **Realtime**: Socket.io rooms per project, JWT-authenticated
- **RBAC**: 3 roles (ADMIN, LEADER, MEMBER), middleware-enforced

## Open Questions

- Member có access Dashboard không? Nếu có, hiển thị gì?
- Register có cho chọn role hay mặc định MEMBER?
- ADMIN role dùng để làm gì? Có Admin Panel riêng không?
- ProjectDetail dùng tabs hay tách pages riêng?
- Có cần file upload (avatar, attachment) không?
- JWT: Access Token + Refresh Token hay chỉ 1 token?
