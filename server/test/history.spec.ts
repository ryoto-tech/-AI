import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('history API', () => {
  it('lists conversations after ask', async () => {
    const child = await request(app).post('/v1/children').send({ name: 'h', age: 5 }).set('Content-Type','application/json');
    const child_id = child.body.child_id;
    for (let i=0;i<2;i++){
      const res = await request(app).post('/v1/conversations/ask').send({ child_id, text: 'なぜ？' }).set('Content-Type','application/json');
      expect(res.status).toBe(200);
    }
    const list = await request(app).get('/v1/history').query({ child_id, limit: 10 });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.items)).toBe(true);
    expect(list.body.items.length).toBeGreaterThanOrEqual(2);
  });
});
