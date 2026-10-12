import { createApplication } from './app.mjs';
const app = createApplication();
const port = Number(process.env.PORT || 3001);
app.server.listen(port, process.env.HOST || '127.0.0.1', () =>
  console.log(`Музыка вместе: http://localhost:${port}`),
);
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await app.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
