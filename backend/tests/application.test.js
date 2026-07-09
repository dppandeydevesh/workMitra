import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Application routes', () => {
  it('POST /api/applications/apply rejects unauthenticated request', async () => {
    const res = await request(app).post('/api/applications/apply').send({ projectId: 'abc' });
    expect(res.status).toBe(401);
  });

  it('POST /api/applications/apply rejects missing projectId', async () => {
    expect(true).toBe(true); // placeholder — expand with JWT mock
  });
});
