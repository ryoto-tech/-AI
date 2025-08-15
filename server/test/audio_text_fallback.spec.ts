import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('audio fallback uses STT mock', () => {
  it('accepts audio_base64 when text is missing', async () => {
    const child = await request(app).post('/v1/children').send({ name: 'a', age: 5 }).set('Content-Type','application/json');
    const child_id = child.body.child_id;
    const res = await request(app).post('/v1/conversations/ask').send({ child_id, audio_base64: 'AAAA' }).set('Content-Type','application/json');
    expect(res.status).toBe(200);
    expect(res.body.answer_text).toBeTruthy();
    expect(res.body.tts_audio_url).toMatch(/\/storage\/audio\//);
  });
});
