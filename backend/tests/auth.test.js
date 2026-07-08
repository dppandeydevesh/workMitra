/**
 * auth.test.js
 * Unit and integration tests for the Auth API routes.
 * Tests the most critical auth flows: login, register, OTP, token.
 * 
 * These run against an in-memory or test MongoDB instance via env vars.
 * No real emails or external services are called in the test environment.
 */

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

// Set required env vars before any module loads server code
process.env.JWT_SECRET       = 'test-jwt-secret-for-unit-tests';
process.env.MONGO_URI        = process.env.MONGO_URI || 'mongodb://localhost:27017/workmitra_test';
process.env.ADMIN_EMAIL      = 'admin@test.com';
process.env.ADMIN_PASSWORD   = 'AdminTest123!';
process.env.CORS_ORIGINS     = 'http://localhost:5173';
process.env.GEMINI_API_KEY   = 'test-key';
process.env.FRONTEND_URL     = 'http://localhost:5173';
process.env.NODE_ENV         = 'test';

const authRoutes = require('../routes/authRoutes');

// Build a minimal Express app (no DB, no WS) just for route testing
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

// =====================================================================
// POST /api/auth/register
// =====================================================================
describe('POST /api/auth/register', () => {
  it('rejects registration when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@iit.ac.in' }); // missing password, role, mobile

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email:    'not-an-email',
        password: 'Password123!',
        userRole: 'student',
        mobile:   '9876543210',
        fullName: 'Test Student',
        collegeName: 'IIT Delhi',
        enrollmentNumber: 'STU001',
        turnstileToken: 'dummy',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email:    'student@iit.ac.in',
        password: 'short',
        userRole: 'student',
        mobile:   '9876543210',
        fullName: 'Test Student',
        collegeName: 'IIT Delhi',
        enrollmentNumber: 'STU001',
        turnstileToken: 'dummy',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('rejects invalid user role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email:    'student@iit.ac.in',
        password: 'ValidPass123!',
        userRole: 'hacker', // invalid — only student/company/college allowed
        mobile:   '9876543210',
        fullName: 'Test Hacker',
        turnstileToken: 'dummy',
      });

    // Controller should return a 4xx for invalid role
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
    expect(res.body.error).toBeDefined();
  });

});

// =====================================================================
// POST /api/auth/login
// =====================================================================
describe('POST /api/auth/login', () => {
  it('rejects login when email or password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com' }); // missing password

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  // This test requires a live MongoDB connection — skip in pure unit mode
  (process.env.RUN_DB_TESTS === 'true' ? it : it.skip)(
    'rejects login for non-existent user',
    async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email:    'nonexistent@iit.ac.in',
          password: 'SomePassword123!',
          turnstileToken: 'dummy',
        });

      // Should get 400 (invalid credentials) — not 500 (server error)
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
    },
    15000
  );
});

// =====================================================================
// POST /api/auth/forgot-password
// =====================================================================
describe('POST /api/auth/forgot-password', () => {
  it('returns 400 when email is not provided', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  // Anti-enumeration test needs DB — skip in pure unit mode
  (process.env.RUN_DB_TESTS === 'true' ? it : it.skip)(
    'returns success even for non-existent email (prevents user enumeration)',
    async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'ghost@university.ac.in' });

      // Should return 200 to prevent user enumeration attacks
      expect(res.statusCode).toBe(200);
    },
    15000
  );
});

// =====================================================================
// GET /api/auth/me — authenticated route
// =====================================================================
describe('GET /api/auth/me', () => {
  it('returns 401/403 when no auth token is provided', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect([401, 403]).toContain(res.statusCode);
  });

  it('returns 401/403 when an invalid JWT is provided', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'token=invalid.jwt.token');

    expect([401, 403]).toContain(res.statusCode);
  });
});
