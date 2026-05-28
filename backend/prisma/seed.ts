import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const Role = {
  ADMIN: 'ADMIN',
  LEADER: 'LEADER',
  MEMBER: 'MEMBER',
} as const;

const MemberRole = {
  LEADER: 'LEADER',
  MEMBER: 'MEMBER',
} as const;

const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  DONE: 'DONE',
} as const;

const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

const ProjectStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;

async function main() {
  console.log('Start seeding...');

  // Create hashed password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Upsert Default Users (Ensure they always exist, keep existing fields)
  await prisma.user.upsert({
    where: { email: 'admin@taskflow.com' },
    update: {},
    create: {
      email: 'admin@taskflow.com',
      passwordHash,
      name: 'System Admin',
      role: Role.ADMIN,
    },
  });

  const leader = await prisma.user.upsert({
    where: { email: 'leader@taskflow.com' },
    update: {},
    create: {
      email: 'leader@taskflow.com',
      passwordHash,
      name: 'Project Leader',
      role: Role.LEADER,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@taskflow.com' },
    update: {},
    create: {
      email: 'member@taskflow.com',
      passwordHash,
      name: 'Team Member',
      role: Role.MEMBER,
    },
  });

  console.log('Ensured default users exist');

  // 2. Create Projects if they do not exist
  let project1 = await prisma.project.findFirst({
    where: { name: 'TaskFlow App Development' },
  });
  if (!project1) {
    project1 = await prisma.project.create({
      data: {
        name: 'TaskFlow App Development',
        description: 'Building a real-time collaborative task manager',
        status: ProjectStatus.ACTIVE,
        ownerId: leader.id,
      },
    });
    console.log('Created project: TaskFlow App Development');
  }

  let project2 = await prisma.project.findFirst({
    where: { name: 'Marketing Campaign 2026' },
  });
  if (!project2) {
    project2 = await prisma.project.create({
      data: {
        name: 'Marketing Campaign 2026',
        description: 'Launch and promotion of TaskFlow app',
        status: ProjectStatus.ACTIVE,
        ownerId: leader.id,
      },
    });
    console.log('Created project: Marketing Campaign 2026');
  }

  // 3. Add Members to Projects if not already added
  const pm1 = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project1.id, userId: leader.id } },
  });
  if (!pm1) {
    await prisma.projectMember.create({
      data: {
        projectId: project1.id,
        userId: leader.id,
        role: MemberRole.LEADER,
      },
    });
  }

  const pm2 = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project1.id, userId: member.id } },
  });
  if (!pm2) {
    await prisma.projectMember.create({
      data: {
        projectId: project1.id,
        userId: member.id,
        role: MemberRole.MEMBER,
      },
    });
  }

  const pm3 = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project2.id, userId: leader.id } },
  });
  if (!pm3) {
    await prisma.projectMember.create({
      data: {
        projectId: project2.id,
        userId: leader.id,
        role: MemberRole.LEADER,
      },
    });
  }

  // 4. Create Tasks only if the project is newly created and has no tasks
  const taskCount = await prisma.task.count({
    where: { projectId: project1.id },
  });
  if (taskCount === 0) {
    const task1 = await prisma.task.create({
      data: {
        title: 'Design Database Schema',
        description: 'Define relational model, primary keys, and foreign keys using Prisma ORM.',
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        order: 0,
        projectId: project1.id,
        creatorId: leader.id,
        assigneeId: leader.id,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      },
    });

    const task2 = await prisma.task.create({
      data: {
        title: 'Implement JWT Authentication',
        description: 'Build registration, login, and token refresh routes using jsonwebtoken.',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.URGENT,
        order: 0,
        projectId: project1.id,
        creatorId: leader.id,
        assigneeId: member.id,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
    });

    await prisma.task.create({
      data: {
        title: 'Setup Socket.io Connections',
        description: 'Configure real-time bi-directional connection between clients and the server.',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        order: 0,
        projectId: project1.id,
        creatorId: leader.id,
        assigneeId: member.id,
      },
    });

    await prisma.task.create({
      data: {
        title: 'Write API Tests',
        description: 'Develop integration tests with Vitest and Supertest for auth and task endpoints.',
        status: TaskStatus.REVIEW,
        priority: Priority.LOW,
        order: 0,
        projectId: project1.id,
        creatorId: leader.id,
        assigneeId: leader.id,
      },
    });

    console.log('Created sample tasks');

    // 5. Create Comments & History
    await prisma.comment.create({
      data: {
        content: 'I have finished the core database schema design, migration runs successfully.',
        taskId: task1.id,
        userId: leader.id,
      },
    });

    await prisma.comment.create({
      data: {
        content: 'Excellent, starting the auth endpoints implementation next.',
        taskId: task2.id,
        userId: member.id,
      },
    });

    await prisma.taskHistory.create({
      data: {
        taskId: task1.id,
        userId: leader.id,
        field: 'status',
        oldValue: TaskStatus.IN_PROGRESS,
        newValue: TaskStatus.DONE,
      },
    });

    await prisma.taskHistory.create({
      data: {
        taskId: task2.id,
        userId: leader.id,
        field: 'assigneeId',
        oldValue: null,
        newValue: member.name,
      },
    });

    // 6. Create Notifications
    await prisma.notification.create({
      data: {
        userId: member.id,
        type: 'TASK_ASSIGNED',
        title: 'Nhiệm vụ mới được giao',
        message: `Bạn đã được giao nhiệm vụ mới: "${task2.title}"`,
        taskId: task2.id,
        projectId: project1.id,
      },
    });
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
