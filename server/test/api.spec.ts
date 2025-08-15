import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();
let child_id: string;

describe('API MVP', () => {
  it('GET /health ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /v1/children creates child', async () => {
    const res = await request(app)
      .post('/v1/children')
      .send({ name: 'たろう', age: 4 })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.child_id).toBeTruthy();
    child_id = res.body.child_id;
  });

  it('GET /v1/usage/today returns default usage', async () => {
    const res = await request(app).get(`/v1/usage/today`).query({ child_id });
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(3);
    expect(res.body.question_count).toBe(0);
  });

  it('POST /v1/conversations/ask respects quota', async () => {
    for (let i = 1; i <= 3; i++) {
      const res = await request(app)
        .post('/v1/conversations/ask')
        .send({ child_id, text: `なぜ${i}?` })
        .set('Content-Type', 'application/json');
      expect(res.status).toBe(200);
      expect(res.body.quota.used).toBe(i);
      expect(res.body.answer_text).toBeTruthy();
    }
    const res4 = await request(app)
      .post('/v1/conversations/ask')
      .send({ child_id, text: 'なぜ4?' })
      .set('Content-Type', 'application/json');
    expect(res4.status).toBe(429);
  });
});
