import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  avatar: z.string().url('Avatar must be a valid URL').or(z.string().nullable()).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters long'),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters long').optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['LEADER', 'MEMBER']).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['LEADER', 'MEMBER']),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  projectId: z.string().uuid('Invalid project ID'),
  assigneeId: z.string().uuid('Invalid assignee ID').nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  deadline: z.string().datetime().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),

});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').optional(),
  description: z.string().optional(),
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
  content: z.string().min(1, 'Comment content cannot be empty'),
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1, 'Subtask title is required'),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  isDone: z.boolean().optional(),
});

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid HEX color code'),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid HEX color code').optional(),
});

export const updateCharterSchema = z.object({
  workingTimeStart: z.string().max(10).optional().nullable(),
  workingTimeEnd: z.string().max(10).optional().nullable(),
  workingDays: z.string().max(100).optional().nullable(),
  workingLocation: z.string().max(500).optional().nullable(),
  communicationRules: z.string().max(2000).optional().nullable(),
  rewardRules: z.string().max(2000).optional().nullable(),
  disciplineRules: z.string().max(2000).optional().nullable(),
  rolesDescription: z.string().max(2000).optional().nullable(),
});
