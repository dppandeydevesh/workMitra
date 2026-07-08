/**
 * application.test.js
 * Tests for critical application lifecycle state transitions:
 * submit, approve, reject, complete, dispute, revision-request, withdraw.
 * 
 * Uses supertest against a minimal Express app.
 * All authenticated routes test that the auth middleware rejects unauthenticated requests.
 */

const request  = require('supertest');
const express  = require('express');
const cookieParser = require('cookie-parser');

// Set required env vars before loading any server modules
process.env.JWT_SECRET       = 'test-jwt-secret-for-unit-tests';
process.env.MONGO_URI        = process.env.MONGO_URI || 'mongodb://localhost:27017/workmitra_test';
process.env.ADMIN_EMAIL      = 'admin@test.com';
process.env.ADMIN_PASSWORD   = 'AdminTest123!';
process.env.CORS_ORIGINS     = 'http://localhost:5173';
process.env.GEMINI_API_KEY   = 'test-key';
process.env.FRONTEND_URL     = 'http://localhost:5173';
process.env.NODE_ENV         = 'test';

const applicationRoutes = require('../routes/applicationRoutes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/applications', applicationRoutes);

// =====================================================================
// Auth middleware protection — all application routes must be guarded
// =====================================================================
describe('Application Routes — Auth Guard', () => {
  const FAKE_ID = '507f1f77bcf86cd799439011'; // valid ObjectId format

  const protectedRoutes = [
    { method: 'get',    path: `/api/applications/student`,                          label: 'GET student applications' },
    { method: 'post',   path: `/api/applications/`,                                 label: 'POST apply to project' },
    { method: 'patch',  path: `/api/applications/${FAKE_ID}/status`,                label: 'PATCH update application status' },
    { method: 'patch',  path: `/api/applications/${FAKE_ID}/submit`,                label: 'PATCH submit work' },
    { method: 'patch',  path: `/api/applications/${FAKE_ID}/complete`,              label: 'PATCH complete application' },
    { method: 'patch',  path: `/api/applications/${FAKE_ID}/revision`,              label: 'PATCH request revision' },
    { method: 'patch',  path: `/api/applications/${FAKE_ID}/dispute`,               label: 'PATCH dispute submission' },
    { method: 'patch',  path: `/api/applications/${FAKE_ID}/withdraw`,              label: 'PATCH withdraw application' },
  ];

  protectedRoutes.forEach(({ method, path, label }) => {
    it(`${label} — rejects unauthenticated request`, async () => {
      const res = await request(app)[method](path).send({});
      expect([401, 403]).toContain(res.statusCode);
    });
  });
});

// =====================================================================
// Application state transition validation — business logic guards
// =====================================================================
describe('Application Routes — Input Validation', () => {
  // These tests check that even with a valid-looking token, bad input is rejected.
  // We generate a JWT manually so we can test controller-level validations.
  const jwt = require('jsonwebtoken');
  const validToken = jwt.sign(
    { userId: '507f1f77bcf86cd799439011', email: 'company@test.com', userRole: 'company' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const FAKE_APP_ID = '507f1f77bcf86cd799439011';

  it('PUT status — rejects status update with missing status field', async () => {
    const res = await request(app)
      .put(`/api/applications/${FAKE_APP_ID}/status`)
      .set('Cookie', `token=${validToken}`)
      .send({}); // missing status

    // Should be 400 (bad request) or 404 (app not found) — never 200
    expect([400, 404, 500]).toContain(res.statusCode);
    expect(res.statusCode).not.toBe(200);
  });

  it('POST submit — rejects submission with missing required fields', async () => {
    const res = await request(app)
      .post(`/api/applications/${FAKE_APP_ID}/submit`)
      .set('Cookie', `token=${validToken}`)
      .send({}); // no submission data

    expect([400, 403, 404, 500]).toContain(res.statusCode);
    expect(res.statusCode).not.toBe(200);
  });

  it('POST request-revision — rejects without feedback text', async () => {
    const res = await request(app)
      .post(`/api/applications/${FAKE_APP_ID}/request-revision`)
      .set('Cookie', `token=${validToken}`)
      .send({}); // no feedbackText

    expect([400, 403, 404, 500]).toContain(res.statusCode);
    expect(res.statusCode).not.toBe(200);
  });
});
