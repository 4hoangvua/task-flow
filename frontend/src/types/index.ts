export type Role = 'ADMIN' | 'LEADER' | 'MEMBER';
export type MemberRole = 'LEADER' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';
export type NotificationType = 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'COMMENT_ADDED' | 'DEADLINE_APPROACHING';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user?: User;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: string;
  owner?: User;
  members?: ProjectMember[];
  labels?: Label[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    tasks: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  field: string;
  oldValue: string | null;
  newValue: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  isDone: boolean;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  order: number;
  deadline: string | null;
  projectId: string;
  assigneeId: string | null;
  creatorId: string;
  assignee?: User | null;
  creator?: User;
  comments?: Comment[];
  history?: TaskHistory[];
  subtasks?: Subtask[];
  labels?: Label[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId: string | null;
  projectId: string | null;
  isRead: boolean;
  createdAt: string;
}
