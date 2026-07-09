import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';

describe('Auth routes', () => {
  beforeEach(() => {
    vi.spyOn(User, 'findOne').mockImplementation(async (query) => {
      if (query && query.email === 'fake@test.com') return null;
      if (query && query.email === 'existing@test.edu') return { email: 'existing@test.edu' };
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/auth/login rejects missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fake@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/register rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'existing@test.edu', password: 'Test@1234', userRole: 'student', mobile: '1234567890', fullName: 'Test', collegeName: 'Test Col', enrollmentNumber: '123' });
    if (res.status !== 409) console.log(res.body);
    expect(res.status).toBe(409);
  });

  it('Protected route rejects request with no JWT', async () => {
    const res = await request(app).get('/api/applications/student');
    expect(res.status).toBe(401);
  });

  it('Protected route rejects request with invalid JWT', async () => {
    const res = await request(app)
      .get('/api/applications/student')
      .set('Authorization', 'Bearer faketoken123');
    expect(res.status).toBe(403);
  });
});
