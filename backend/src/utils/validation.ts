import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100).optional(),
  avatar: z.string().trim().url('Avatar must be a valid URL').or(z.string().nullable()).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, 'Project name must be at least 2 characters long').max(100),
  description: z.string().trim().max(1000).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2, 'Project name must be at least 2 characters long').max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  role: z.enum(['LEADER', 'MEMBER']).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['LEADER', 'MEMBER']),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().trim().max(5000).optional(),
  projectId: z.string().uuid('Invalid project ID'),
  assigneeId: z.string().uuid('Invalid assignee ID').nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  deadline: z.string().datetime().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => {
    if (data.deadline) {
      return new Date(data.deadline).getTime() >= Date.now() - 60000;
    }
    return true;
  },
  {
    message: 'Hạn chót không thể ở trong quá khứ',
    path: ['deadline'],
  }
);

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  assigneeId: z.string().uuid('Invalid assignee ID').nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  deadline: z.string().datetime().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
});

export const reorderTasksSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  newOrder: z.number().int().nonnegative(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment content cannot be empty').max(3000),
});

export const createSubtaskSchema = z.object({
  title: z.string().trim().min(1, 'Subtask title is required').max(200),
});

export const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  isDone: z.boolean().optional(),
});

export const createLabelSchema = z.object({
  name: z.string().trim().min(1, 'Label name is required').max(50),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid HEX color code'),
});

export const updateLabelSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid HEX color code').optional(),
});

export const updateCharterSchema = z.object({
  workingTimeStart: z.string().trim().max(10).optional().nullable(),
  workingTimeEnd: z.string().trim().max(10).optional().nullable(),
  workingDays: z.string().trim().max(100).optional().nullable(),
  workingLocation: z.string().trim().max(500).optional().nullable(),
  communicationRules: z.string().trim().max(2000).optional().nullable(),
  rewardRules: z.string().trim().max(2000).optional().nullable(),
  disciplineRules: z.string().trim().max(2000).optional().nullable(),
  rolesDescription: z.string().trim().max(2000).optional().nullable(),
}).refine(
  (data) => {
    if (data.workingTimeStart && data.workingTimeEnd) {
      return data.workingTimeEnd > data.workingTimeStart;
    }
    return true;
  },
  {
    message: 'Giờ kết thúc làm việc phải sau giờ bắt đầu',
    path: ['workingTimeEnd'],
  }
);

export const addDependencySchema = z.object({
  dependsOnId: z.string().uuid('Mã công việc tiên quyết không hợp lệ'),
});
