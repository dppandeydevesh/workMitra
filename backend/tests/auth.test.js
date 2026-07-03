const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');

// Create a minimal express app for testing routes
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  it('should reject registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' }); // missing password, role, etc.
      
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBeDefined();
  });
});
