import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

// enable auth for this test process
process.env.AUTH_ENABLED = 'true';

const app = createApp();

describe('auth middleware', () => {
  it('rejects unauthorized when AUTH_ENABLED=true', async () => {
    const res = await request(app).get('/v1/children/me');
    expect(res.status).toBe(401);
  });
  it('accepts dev-token as mock authorization', async () => {
    const res = await request(app)
      .post('/v1/children')
      .set('Authorization', 'Bearer dev-token')
      .send({ name: 'auth', age: 5 })
      .set('Content-Type','application/json');
    expect(res.status).toBe(200);
    expect(res.body.child_id).toBeTruthy();
  });
});
