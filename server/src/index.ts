import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { json } from 'express';
import { router as apiRouter } from './routes/api';

const app = express();
app.use(cors());
app.use(json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/v1', apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`nazenazeai server listening on :${PORT}`);
});
