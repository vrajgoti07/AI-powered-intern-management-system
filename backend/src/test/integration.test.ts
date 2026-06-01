import request from 'supertest';
import createApp from '../app';
import prisma from '../config/database';
import { generateAccessToken } from '../utils/jwt';
import bcrypt from 'bcrypt';

const app = createApp();

describe('AI-Powered Intern Management System - Integration Test Suite', () => {
  let adminToken: string;
  let mentorToken: string;
  let internToken: string;

  let adminId: string;
  let mentorId: string;
  let internId: string;
  
  let mentorProfileId: string;
  let internProfileId: string;
  let departmentId: string;
  let taskId: string;
  let _leaveRequestId: string;

  beforeAll(async () => {
    // 1. Cleanup existing test data
    await prisma.task.deleteMany({});
    await prisma.leaveRequest.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.intern.deleteMany({});
    await prisma.mentor.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.attendanceSettings.deleteMany({});


    // 2. Hash Password
    const hashedPassword = await bcrypt.hash('SecurePass123!', 10);

    // 3. Create Department
    const department = await prisma.department.create({
      data: {
        name: 'Engineering Department',
        code: 'ENG',
        description: 'Software Engineering and AI R&D',
        colorTheme: 'blue',
      },
    });
    departmentId = department.id;

    // 4. Create HR/Admin User
    const admin = await prisma.user.create({
      data: {
        email: 'hr@internflow.io',
        password: hashedPassword,
        name: 'Alice HR',
        role: 'HR',
        isActive: true,
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    adminToken = generateAccessToken({ userId: adminId, email: admin.email, role: 'HR' });

    // 5. Create Mentor User and Profile
    const mentorUser = await prisma.user.create({
      data: {
        email: 'mentor@internflow.io',
        password: hashedPassword,
        name: 'Bob Mentor',
        role: 'MENTOR',
        isActive: true,
        isEmailVerified: true,
      },
    });
    mentorId = mentorUser.id;
    mentorToken = generateAccessToken({ userId: mentorId, email: mentorUser.email, role: 'MENTOR' });

    const mentor = await prisma.mentor.create({
      data: {
        userId: mentorId,
        departmentId: departmentId,
        expertise: ['Node.js', 'React', 'AI'],
        designation: 'Senior Architect',
      },
    });
    mentorProfileId = mentor.id;

    // 6. Create Intern User and Profile
    const internUser = await prisma.user.create({
      data: {
        email: 'intern@internflow.io',
        password: hashedPassword,
        name: 'Charlie Intern',
        role: 'INTERN',
        isActive: true,
        isEmailVerified: true,
      },
    });
    internId = internUser.id;
    internToken = generateAccessToken({ userId: internId, email: internUser.email, role: 'INTERN' });

    const intern = await prisma.intern.create({
      data: {
        userId: internId,
        departmentId: departmentId,
        college: 'MIT',
        degree: 'B.S.',
        branch: 'Computer Science',
        mentorId: mentorProfileId,
        startDate: new Date(),
        status: 'ACTIVE',
      },
    });
    internProfileId = intern.id;
  });

  // ==========================================
  // 🔐 AUTHENTICATION ROUTE TESTS
  // ==========================================
  describe('🔐 Authentication', () => {
    it('should successfully log in a user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'intern@internflow.io',
          password: 'SecurePass123!',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should fail login with incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'intern@internflow.io',
          password: 'WrongPassword!',
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail login with missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'intern@internflow.io',
        });
      expect(res.status).toBe(400);
    });

    it('should successfully send an OTP code for verification', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({
          email: 'intern@internflow.io',
          password: 'SecurePass123!',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should retrieve current user details', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${internToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('intern@internflow.io');
    });

    it('should successfully execute a logout action', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${internToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================
  // 📋 TASK ROUTE TESTS
  // ==========================================
  describe('📋 Tasks', () => {
    it('should successfully create an assigned task', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          title: 'Implement Authentication Testing',
          description: 'Write integration test cases for auth controller',
          internId: internProfileId,
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          priority: 'HIGH',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      taskId = res.body.data.id;
    });

    it('should list and filter assigned tasks', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${internToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should successfully transition a task status', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${internToken}`)
        .send({
          status: 'IN_PROGRESS',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('should fail transition with invalid fields', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${internToken}`)
        .send({
          status: 'INVALID_STATUS',
        });
      expect(res.status).toBe(400);
    });

    it('should successfully delete a task record', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${mentorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================
  // 📍 ATTENDANCE ROUTE TESTS
  // ==========================================
  describe('📍 Attendance', () => {
    it('should successfully clock-in an intern today', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/checkin')
        .set('Authorization', `Bearer ${internToken}`)
        .send({
          deviceInfo: 'Mozilla Firefox Test',
          ipAddress: '127.0.0.1',
        });
      if (res.status !== 200) {
        console.log("CHECKIN FAILED BODY:", res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });


    it('should fail clock-in when already checked-in today', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/checkin')
        .set('Authorization', `Bearer ${internToken}`)
        .send({
          deviceInfo: 'Mozilla Firefox Test',
          ipAddress: '127.0.0.1',
        });
      expect(res.status).toBe(400);
    });

    it('should successfully clock-out an intern today', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/checkout')
        .set('Authorization', `Bearer ${internToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================
  // 👥 INTERN PROFILE & MANAGEMENT TESTS
  // ==========================================
  describe('👥 Intern Management', () => {
    it('should successfully filter active interns', async () => {
      const res = await request(app)
        .get('/api/v1/interns')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'PENDING' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should update intern profile status and onboarding step', async () => {
      const res = await request(app)
        .put(`/api/v1/interns/${internProfileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'ACTIVE',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should perform soft deletion checks on interns', async () => {
      const res = await request(app)
        .delete(`/api/v1/interns/${internProfileId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });
  });

  // ==========================================
  // 🏢 DEPARTMENT ROUTE TESTS
  // ==========================================
  describe('🏢 Departments', () => {
    it('should successfully create a new department', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Marketing Department',
          code: 'MKT',
          description: 'Sales and Content Strategy',
          colorTheme: 'green',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should retrieve departmental lists and analytics', async () => {
      const res = await request(app)
        .get(`/api/v1/departments/${departmentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Engineering Department');
    });
  });

  // ==========================================
  // 📅 LEAVE REQUEST TESTS
  // ==========================================
  describe('📅 Leave Request Lifecycle', () => {
    it('should successfully submit a leave request', async () => {
      const res = await request(app)
        .post('/api/v1/leave/request')
        .set('Authorization', `Bearer ${internToken}`)
        .send({
          leaveType: 'SICK',
          reason: 'Medical Checkup',
          startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      _leaveRequestId = res.body.data.id;
      expect(_leaveRequestId).toBeDefined();
    });

    it('should query leave balance levels', async () => {
      const res = await request(app)
        .get('/api/v1/leave/balance')
        .set('Authorization', `Bearer ${internToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================
  // 📊 ANALYTICS CONTROLLER TESTS
  // ==========================================
  describe('📊 Analytics', () => {
    it('should retrieve overall platform metrics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
