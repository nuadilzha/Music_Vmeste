import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { createApplication } from '../server/app.mjs';

test('development proxy preserves Origin, sessions, profile writes and uploaded media', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'music-vmeste-proxy-'));
  const app = createApplication({
    dataDir: path.join(temp, 'data'),
    uploadDir: path.join(temp, 'uploads'),
  });
  const previousPort = process.env.PORT;
  let vite;
  try {
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
    process.env.PORT = String(app.server.address().port);
    // Load the project's actual vite.config.ts, using ephemeral ports for both servers.
    vite = await createServer({
      server: { host: '127.0.0.1', port: 0, strictPort: false },
      logLevel: 'error',
    });
    await vite.listen();
    const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
    const request = (route, method = 'GET', data, cookie, requestOrigin = origin) =>
      fetch(origin + route, {
        method,
        headers: {
          Origin: requestOrigin,
          ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
    const page = await request('/');
    assert.equal(page.status, 200);
    assert((await page.text()).includes('id="root"'));
    assert.equal((await request('/api/health')).status, 200);
    const registered = await request('/api/auth/register', 'POST', {
      name: 'Proxy Test',
      email: 'proxy@example.test',
      password: 'proxy-password-123',
    });
    assert.equal(registered.status, 200);
    const cookie = registered.headers.get('set-cookie').split(';')[0];
    const account = await registered.json();
    const snapshot = await (await request('/api/bootstrap', 'GET', undefined, cookie)).json();
    const profile = snapshot.profiles.find((p) => p.id === account.user.id);
    assert.equal(
      (
        await request(
          '/api/profile',
          'PUT',
          { ...profile, description: 'Saved via Vite proxy' },
          cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (await request('/api/profile', 'PUT', profile, cookie, 'https://evil.example')).status,
      403,
    );
    const uploaded = await request(
      '/api/uploads',
      'POST',
      {
        name: 'proxy.png',
        mime: 'image/png',
        base64:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDqkAAAAASUVORK5CYII=',
      },
      cookie,
    );
    assert.equal(uploaded.status, 201);
    const media = await uploaded.json();
    const file = await request(media.url);
    assert.equal(file.status, 200);
    assert.equal(file.headers.get('content-type'), 'image/png');
    await file.arrayBuffer();
    assert.equal((await request('/api/auth/logout', 'POST', {}, cookie)).status, 200);
    assert.equal((await request('/api/messages', 'GET', undefined, cookie)).status, 401);
  } finally {
    await vite?.close();
    await app.close();
    if (previousPort === undefined) delete process.env.PORT;
    else process.env.PORT = previousPort;
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
