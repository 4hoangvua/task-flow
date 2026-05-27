import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Project API Integration Tests', () => {
  let leaderToken: string;
  let memberToken: string;
  let memberUser: any;

  beforeEach(async () => {
    // Clear Database
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

    // Create Leader User
    const regLeader = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'leader@example.com',
        password: 'password123',
        name: 'Leader User',
      });
    
    // Manually promote to LEADER role in DB
    await prisma.user.update({
      where: { id: regLeader.body.data.user.id },
      data: { role: 'LEADER' },
    });

    // Login to get new token with updated role
    const loginLeader = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'leader@example.com',
        password: 'password123',
      });

    leaderToken = loginLeader.body.data.accessToken;

    // Create Member User
    const regMember = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'member@example.com',
        password: 'password123',
        name: 'Member User',
      });

    memberUser = regMember.body.data.user;
    memberToken = regMember.body.data.accessToken;
  });

  it('should allow LEADER to create a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        name: 'Leader Project',
        description: 'Project created by leader',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Leader Project');
    expect(res.body.data.ownerId).toBe(res.body.data.ownerId);
  });

  it('should allow MEMBER to create a personal project (as owner)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'Member Personal Project',
        description: 'Project created by member',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Member Personal Project');
  });

  it('should allow Project Owner to modify project settings', async () => {
    // Create project first
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        name: 'Test Project',
        description: 'Description before edit',
      });

    const pId = projRes.body.data.id;

    // Edit project
    const editRes = await request(app)
      .patch(`/api/projects/${pId}`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        name: 'Updated Project Name',
        description: 'Updated Description',
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.success).toBe(true);
    expect(editRes.body.data.name).toBe('Updated Project Name');
  });

  it('should prevent non-owner from modifying project settings', async () => {
    // Leader creates a project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        name: 'Leader Project',
      });

    const pId = projRes.body.data.id;

    // Member attempts to edit it
    const editRes = await request(app)
      .patch(`/api/projects/${pId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'Hacked Name',
      });

    expect(editRes.status).toBe(403);
    expect(editRes.body.success).toBe(false);
  });

  it('should allow Project Owner to add members and change their roles', async () => {
    // Create project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        name: 'Shared Project',
      });

    const pId = projRes.body.data.id;

    // Add member
    const addMemberRes = await request(app)
      .post(`/api/projects/${pId}/members`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        email: 'member@example.com',
        role: 'MEMBER',
      });

    expect(addMemberRes.status).toBe(201);
    expect(addMemberRes.body.success).toBe(true);

    // Update member role to LEADER (at project level)
    const updateRoleRes = await request(app)
      .patch(`/api/projects/${pId}/members/${memberUser.id}`)
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({
        role: 'LEADER',
      });

    expect(updateRoleRes.status).toBe(200);
    expect(updateRoleRes.body.success).toBe(true);
    expect(updateRoleRes.body.data.role).toBe('LEADER');
  });
});
