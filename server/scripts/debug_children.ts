import { createApp } from '../src/app';
import request from 'supertest';

(async () => {
  const app = createApp();
  const res = await request(app)
    .post('/v1/children')
    .send({ name: 'デバッグ', age: 5, user_id: '00000000-0000-0000-0000-000000000000' })
    .set('Content-Type','application/json');
  console.log('status', res.status);
  console.log('body', res.body);
})();
