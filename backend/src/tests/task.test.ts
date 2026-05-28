import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Task API Integration Tests', () => {
  let leaderToken: string;
  let projectId: string;
  let taskAId: string;
  let taskBId: string;
  let taskCId: string;

  beforeEach(async () => {
    // Clear DB
    await prisma.taskDependency.deleteMany({});
    await prisma.subtask.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.taskHistory.deleteMany({});
    await prisma.teamCharter.deleteMany({});
    await prisma.label.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});

    // Register & Login Leader
    const regLeader = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'leader@example.com',
        password: 'password123',
        name: 'Leader User',
      });
    
    await prisma.user.update({
      where: { id: regLeader.body.data.user.id },
      data: { role: 'LEADER' },
    });

    const loginLeader = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'leader@example.com',
        password: 'password123',
      });

    leaderToken = loginLeader.body.data.accessToken;

    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'member@example.com',
        password: 'password123',
        name: 'Member User',
      });

    // Create a project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        name: 'Test Project',
      });

    projectId = projRes.body.data.id;

    // Add Member to Project
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        email: 'member@example.com',
        role: 'MEMBER',
      });

    // Create Task A, B, C
    const taskARes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        title: 'Task A',
        projectId,
        priority: 'HIGH',
      });
    taskAId = taskARes.body.data.id;

    const taskBRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        title: 'Task B',
        projectId,
        priority: 'MEDIUM',
      });
    taskBId = taskBRes.body.data.id;

    const taskCRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        title: 'Task C',
        projectId,
        priority: 'LOW',
      });
    taskCId = taskCRes.body.data.id;
  });

  it('should allow Project Leader to create a task', () => {
    expect(taskAId).toBeDefined();
    expect(taskBId).toBeDefined();
  });

  it('should block non-members from reading project tasks', async () => {
    // Create another user not in project
    const hackerReg = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'hacker@example.com',
        password: 'password123',
        name: 'Hacker User',
      });
    const hackerToken = hackerReg.body.data.accessToken;

    const res = await request(app)
      .get(`/api/tasks?projectId=${projectId}`)
      .set('Authorization', `Bearer ${hackerToken}`);

    expect(res.status).toBe(403);
  });

  it('should enforce Task Dependencies: block DONE if prerequisite is not DONE', async () => {
    // Task A depends on Task B
    const depRes = await request(app)
      .post(`/api/tasks/${taskAId}/dependencies`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        dependsOnId: taskBId,
      });

    expect(depRes.status).toBe(201);
    expect(depRes.body.success).toBe(true);

    // Attempt to mark Task A as DONE
    const doneARes = await request(app)
      .patch(`/api/tasks/${taskAId}/status`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        status: 'DONE',
      });

    expect(doneARes.status).toBe(400);
    expect(doneARes.body.success).toBe(false);
    expect(doneARes.body.error).toContain('chưa hoàn thành');

    // Mark Task B as DONE first
    const doneBRes = await request(app)
      .patch(`/api/tasks/${taskBId}/status`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        status: 'DONE',
      });

    expect(doneBRes.status).toBe(200);
    expect(doneBRes.body.success).toBe(true);

    // Now Task A should be allowed to go DONE
    const doneAAllowedRes = await request(app)
      .patch(`/api/tasks/${taskAId}/status`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        status: 'DONE',
      });

    expect(doneAAllowedRes.status).toBe(200);
    expect(doneAAllowedRes.body.success).toBe(true);
  });

  it('should prevent Circular Dependencies (direct and indirect)', async () => {
    // Task A depends on Task B
    await request(app)
      .post(`/api/tasks/${taskAId}/dependencies`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ dependsOnId: taskBId });

    // Task B depends on Task C
    await request(app)
      .post(`/api/tasks/${taskBId}/dependencies`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ dependsOnId: taskCId });

    // Task C depends on Task A -> Circular path!
    const circularRes = await request(app)
      .post(`/api/tasks/${taskCId}/dependencies`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ dependsOnId: taskAId });

    expect(circularRes.status).toBe(400);
    expect(circularRes.body.success).toBe(false);
    expect(circularRes.body.error).toContain('phụ thuộc tuần hoàn');
  });

  it('should manage subtasks (create, toggle, delete)', async () => {
    // Create Subtask
    const subRes = await request(app)
      .post(`/api/subtasks/tasks/${taskAId}/subtasks`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ title: 'Subtask 1' });

    expect(subRes.status).toBe(201);
    expect(subRes.body.success).toBe(true);
    expect(subRes.body.data.title).toBe('Subtask 1');
    expect(subRes.body.data.isDone).toBe(false);

    const subtaskId = subRes.body.data.id;

    // Toggle Subtask
    const toggleRes = await request(app)
      .patch(`/api/subtasks/${subtaskId}`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ isDone: true });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.success).toBe(true);
    expect(toggleRes.body.data.isDone).toBe(true);

    // Delete Subtask
    const delRes = await request(app)
      .delete(`/api/subtasks/${subtaskId}`)
      .set('Authorization', `Bearer ${leaderToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  it('should prevent user from replying to their own comment but allow others to reply', async () => {
    // 1. Create a root comment as Leader
    const rootCommentRes = await request(app)
      .post(`/api/tasks/${taskAId}/comments`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        content: 'Root comment by leader',
      });

    expect(rootCommentRes.status).toBe(201);
    const rootCommentId = rootCommentRes.body.data.id;

    // 2. Try to reply to own comment as Leader
    const selfReplyRes = await request(app)
      .post(`/api/tasks/${taskAId}/comments`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        content: 'Self reply',
        parentId: rootCommentId,
      });

    expect(selfReplyRes.status).toBe(400);
    expect(selfReplyRes.body.success).toBe(false);
    expect(selfReplyRes.body.error).toContain('tự trả lời bình luận');

    // 3. Login Member
    const memberLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'member@example.com',
        password: 'password123',
      });
    const memberToken = memberLoginRes.body.data.accessToken;

    // 4. Reply to Leader's comment as Member
    const memberReplyRes = await request(app)
      .post(`/api/tasks/${taskAId}/comments`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        content: 'Reply by member',
        parentId: rootCommentId,
      });

    expect(memberReplyRes.status).toBe(201);
    expect(memberReplyRes.body.success).toBe(true);
    expect(memberReplyRes.body.data.parentId).toBe(rootCommentId);
  });
});
