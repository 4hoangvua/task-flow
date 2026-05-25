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

  // Clean the database
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create hashed password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@taskflow.com',
      passwordHash,
      name: 'System Admin',
      role: Role.ADMIN,
    },
  });

  const leader = await prisma.user.create({
    data: {
      email: 'leader@taskflow.com',
      passwordHash,
      name: 'Project Leader',
      role: Role.LEADER,
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@taskflow.com',
      passwordHash,
      name: 'Team Member',
      role: Role.MEMBER,
    },
  });

  console.log('Created users:', { admin: admin.email, leader: leader.email, member: member.email });

  // 2. Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'TaskFlow App Development',
      description: 'Building a real-time collaborative task manager',
      status: ProjectStatus.ACTIVE,
      ownerId: leader.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Marketing Campaign 2026',
      description: 'Launch and promotion of TaskFlow app',
      status: ProjectStatus.ACTIVE,
      ownerId: leader.id,
    },
  });

  console.log('Created projects:', [project1.name, project2.name]);

  // 3. Add Members to Projects
  await prisma.projectMember.create({
    data: {
      projectId: project1.id,
      userId: leader.id,
      role: MemberRole.LEADER,
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: project1.id,
      userId: member.id,
      role: MemberRole.MEMBER,
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: project2.id,
      userId: leader.id,
      role: MemberRole.LEADER,
    },
  });

  console.log('Assigned members to project 1');

  // 4. Create Tasks
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

  const task3 = await prisma.task.create({
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

  const task4 = await prisma.task.create({
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

  console.log('Created tasks:', [task1.title, task2.title, task3.title, task4.title]);

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
