import 'dotenv/config';
import { createApp } from './app';

const app = createApp();
const PORT = process.env.PORT || 3000 as number;
app.listen(PORT, () => {
  console.log(`nazenazeai server listening on :${PORT}`);
});
