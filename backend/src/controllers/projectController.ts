import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { createProjectSchema, updateProjectSchema, addMemberSchema, updateMemberRoleSchema } from '../utils/validation';

export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      OR: [
        { ownerId: req.user.id },
        { members: { some: { userId: req.user.id } } },
      ],
    };

    if (status === 'ACTIVE' || status === 'ARCHIVED') {
      whereClause.status = status;
    }

    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where: whereClause,
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          _count: {
            select: { members: true, tasks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: projects,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    const data = createProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'LEADER',
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    if (!project) {
      return next(new AppError(404, 'NOT_FOUND', 'Project not found'));
    }

    // Check if the user is owner or member
    const isMember = project.ownerId === req.user!.id || project.members.some((m) => m.userId === req.user!.id);
    if (!isMember && req.user.role !== 'ADMIN') {
      return next(new AppError(403, 'FORBIDDEN', 'Access denied to this project'));
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    const data = updateProjectSchema.parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return next(new AppError(404, 'NOT_FOUND', 'Project not found'));
    }

    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError(403, 'FORBIDDEN', 'Only the owner can update the project'));
    }

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return next(new AppError(404, 'NOT_FOUND', 'Project not found'));
    }

    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError(403, 'FORBIDDEN', 'Only the owner can delete the project'));
    }

    await prisma.project.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

// Members Management
export async function getProjectMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
}

export async function addProjectMember(req: Request, res: Response, next: NextFunction) {
  try {
    const data = addMemberSchema.parse(req.body);
    const projectId = req.params.id;

    // Find if user exists
    const userToInvite = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!userToInvite) {
      return next(new AppError(404, 'NOT_FOUND', 'User with this email not found'));
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: userToInvite.id,
        },
      },
    });

    if (existingMember) {
      return next(new AppError(400, 'DUPLICATE_ENTRY', 'User is already a member of this project'));
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: userToInvite.id,
        role: data.role || 'MEMBER',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Realtime Emit
    const io = req.app.get('io');
    if (io) {
      io.to(projectId).emit('member:added', { projectId, member });
      
      // Also send notification directly to the invited user
      const notification = await prisma.notification.create({
        data: {
          userId: userToInvite.id,
          type: 'TASK_UPDATED', // using fallback notification type
          title: 'Project Invitation',
          message: `You have been added as a member to project: "${projectId}"`,
          projectId,
        },
      });
      io.to(`user:${userToInvite.id}`).emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProjectMember(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateMemberRoleSchema.parse(req.body);
    const { id: projectId, uid: userId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (project?.ownerId === userId) {
      return next(new AppError(400, 'FORBIDDEN', 'Cannot change role of the project owner'));
    }

    const updatedMember = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      data: { role: data.role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedMember,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProjectMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: projectId, uid: userId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (project?.ownerId === userId) {
      return next(new AppError(400, 'FORBIDDEN', 'Cannot remove the project owner'));
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    // Realtime Emit
    const io = req.app.get('io');
    if (io) {
      io.to(projectId).emit('member:removed', { projectId, userId });
    }

    res.status(200).json({
      success: true,
      message: 'Member removed from project successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function exportProjectCSV(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.id;

    // Verify Project existence
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignee: { select: { name: true, email: true } },
            creator: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return next(new AppError(404, 'NOT_FOUND', 'Project not found'));
    }

    // Verify user role - Leader or Admin
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    if (req.user.role !== 'ADMIN' && project.ownerId !== req.user.id) {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
      });
      if (member?.role !== 'LEADER') {
        return next(new AppError(403, 'FORBIDDEN', 'Access denied: Only leaders can export project data'));
      }
    }

    // Helper to quote CSV field
    const quote = (val: string) => {
      const escaped = val.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const headers = [
      'ID công việc',
      'Tiêu đề',
      'Mô tả',
      'Trạng thái',
      'Độ ưu tiên',
      'Người thực hiện',
      'Email người thực hiện',
      'Người tạo',
      'Hạn chót',
      'Ngày tạo',
    ];

    const csvRows = [headers.join(',')];

    for (const task of project.tasks) {
      const row = [
        quote(task.id),
        quote(task.title),
        quote(task.description || ''),
        quote(task.status === 'TODO' ? 'Cần làm' : task.status === 'IN_PROGRESS' ? 'Đang làm' : task.status === 'REVIEW' ? 'Đánh giá' : 'Hoàn thành'),
        quote(task.priority === 'LOW' ? 'Thấp' : task.priority === 'MEDIUM' ? 'Trung bình' : task.priority === 'HIGH' ? 'Cao' : 'Khẩn cấp'),
        quote(task.assignee?.name || 'Chưa gán'),
        quote(task.assignee?.email || ''),
        quote(task.creator.name),
        quote(task.deadline ? new Date(task.deadline).toLocaleString('vi-VN') : 'Không có'),
        quote(new Date(task.createdAt).toLocaleString('vi-VN')),
      ];
      csvRows.push(row.join(','));
    }

    // Set Response Headers
    const csvContent = '\uFEFF' + csvRows.join('\r\n'); // Add UTF-8 BOM for Excel
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="project_${encodeURIComponent(project.name.replace(/\s+/g, '_'))}_export.csv"`);
    
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}
