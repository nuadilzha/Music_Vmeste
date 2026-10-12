import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApplication } from './app.mjs';

test('MVP: auth, ownership, persistence, media, favorites, posts and private messages', async (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'music-vmeste-test-'));
  const options = {
    dataDir: path.join(temp, 'data'),
    uploadDir: path.join(temp, 'uploads'),
    distDir: path.join(temp, 'dist'),
  };
  fs.mkdirSync(options.distDir);
  fs.writeFileSync(path.join(options.distDir, 'index.html'), '<div id="root">SPA</div>');
  let app = createApplication(options),
    base;
  async function listen() {
    await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
  }
  await listen();
  const request = async (route, { method = 'GET', data, cookie, origin } = {}) => {
    const response = await fetch(base + route, {
      method,
      headers: {
        ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(origin ? { Origin: origin } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const value = response.headers.get('content-type')?.includes('json')
      ? await response.json()
      : await response.text();
    return {
      status: response.status,
      value,
      cookie: response.headers.get('set-cookie')?.split(';')[0],
      headers: response.headers,
    };
  };
  let alice, bob, charlie, group, listing, post, media;
  try {
    await t.test(
      'public bootstrap includes both musicians and specialists; private writes require login',
      async () => {
        const r = await request('/api/bootstrap');
        assert.equal(r.status, 200);
        assert.equal(r.value.user, null);
        assert(r.value.profiles.some((p) => p.type === 'specialist'));
        assert(r.value.profiles.every((p) => p.isDemo));
        assert.equal((await request('/api/profile', { method: 'PUT', data: {} })).status, 401);
        assert.equal((await request('/api/messages')).status, 401);
      },
    );
    await t.test(
      'registers users, hashes passwords, stores only session hashes and rejects duplicate email',
      async () => {
        const register = (name) =>
          request('/api/auth/register', {
            method: 'POST',
            data: { name, email: `${name}@example.test`, password: 'test-password-123' },
          });
        alice = await register('Alice');
        bob = await register('Bob');
        charlie = await register('Charlie');
        assert.equal(alice.status, 200);
        assert(alice.cookie);
        const row = app.db
          .prepare('SELECT password FROM users WHERE id=?')
          .get(alice.value.user.id);
        assert(!row.password.includes('test-password'));
        const sessions = app.db.prepare('SELECT token FROM sessions').all();
        assert(!sessions.some((s) => alice.cookie.includes(s.token)));
        assert.equal((await register('Alice')).status, 409);
        assert.equal(
          (
            await request('/api/auth/login', {
              method: 'POST',
              data: { email: 'alice@example.test', password: 'wrong-password' },
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await request('/api/auth/login', {
              method: 'POST',
              data: { email: 'alice@example.test', password: 'test-password-123' },
            })
          ).status,
          200,
        );
      },
    );
    await t.test('rejects invalid input and cross-origin mutations', async () => {
      assert.equal(
        (
          await request('/api/auth/register', {
            method: 'POST',
            data: { name: 'X', email: 'bad', password: 'short' },
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request('/api/profile', {
            method: 'PUT',
            cookie: alice.cookie,
            origin: 'https://evil.example',
            data: {},
          })
        ).status,
        403,
      );
      assert.equal(
        (await request('/api/profile', { method: 'PUT', cookie: alice.cookie, data: {} })).status,
        400,
      );
    });
    await t.test('saves profile, validates URLs and ignores forged owner/id fields', async () => {
      const snapshot = (await request('/api/bootstrap', { cookie: alice.cookie })).value;
      const p = snapshot.profiles.find((p) => p.id === alice.value.user.id);
      const r = await request('/api/profile', {
        method: 'PUT',
        cookie: alice.cookie,
        data: {
          ...p,
          id: bob.value.user.id,
          ownerId: bob.value.user.id,
          type: 'specialist',
          role: 'Продюсер',
          description: 'Записываю музыку',
          genres: ['Rock'],
          links: ['https://example.com'],
        },
      });
      assert.equal(r.status, 200);
      assert.equal(r.value.id, alice.value.user.id);
      assert.equal(r.value.ownerId, alice.value.user.id);
      assert.equal(
        (
          await request('/api/profile', {
            method: 'PUT',
            cookie: alice.cookie,
            data: { ...r.value, links: ['javascript:alert(1)'] },
          })
        ).status,
        400,
      );
    });
    await t.test(
      'uploads media, rejects disguised formats, serves byte ranges and restricts attachment ownership',
      async () => {
        const png =
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDqkAAAAASUVORK5CYII=';
        media = await request('/api/uploads', {
          method: 'POST',
          cookie: alice.cookie,
          data: { name: 'sample.png', mime: 'image/png', base64: png },
        });
        assert.equal(media.status, 201);
        assert.equal(
          (
            await request('/api/uploads', {
              method: 'POST',
              cookie: alice.cookie,
              data: {
                name: 'fake.png',
                mime: 'image/png',
                base64: Buffer.from('<script>bad</script>').toString('base64'),
              },
            })
          ).status,
          400,
        );
        const file = await fetch(base + media.value.url, { headers: { Range: 'bytes=0-7' } });
        assert.equal(file.status, 206);
        assert.equal((await file.arrayBuffer()).byteLength, 8);
        assert.equal(
          (await fetch(base + media.value.url, { headers: { Range: 'bytes=9999-' } })).status,
          416,
        );
        const bobProfile = (
          await request('/api/bootstrap', { cookie: bob.cookie })
        ).value.profiles.find((p) => p.id === bob.value.user.id);
        assert.equal(
          (
            await request('/api/profile', {
              method: 'PUT',
              cookie: bob.cookie,
              data: { ...bobProfile, photo: media.value.url },
            })
          ).status,
          400,
        );
        const aliceProfile = (
          await request('/api/bootstrap', { cookie: alice.cookie })
        ).value.profiles.find((p) => p.id === alice.value.user.id);
        assert.equal(
          (
            await request('/api/profile', {
              method: 'PUT',
              cookie: alice.cookie,
              data: {
                ...aliceProfile,
                photo: media.value.url,
                portfolio: [
                  { id: media.value.id, title: 'Sample', type: 'image', url: media.value.url },
                ],
              },
            })
          ).status,
          200,
        );
      },
    );
    await t.test('creates/edits groups and rejects non-owner edits and deletes', async () => {
      group = await request('/api/groups', {
        method: 'POST',
        cookie: alice.cookie,
        data: {
          name: 'Test Band',
          city: 'Алматы',
          genres: ['Rock'],
          description: 'Наша группа',
          members: [{ name: 'Alice', role: 'Вокал' }],
          openPositions: ['Басист'],
          portfolio: [],
        },
      });
      assert.equal(group.status, 201);
      assert.equal(
        (
          await request(`/api/groups/${group.value.id}`, {
            method: 'PUT',
            cookie: bob.cookie,
            data: group.value,
          })
        ).status,
        403,
      );
      assert.equal(
        (await request(`/api/groups/${group.value.id}`, { method: 'DELETE', cookie: bob.cookie }))
          .status,
        403,
      );
      assert.equal(
        (
          await request(`/api/groups/${group.value.id}`, {
            method: 'PUT',
            cookie: alice.cookie,
            data: { ...group.value, name: 'Updated Band' },
          })
        ).status,
        200,
      );
    });
    await t.test('publishes/edits listings and validates required fields', async () => {
      const data = {
        type: 'musician',
        title: 'Ищу басиста',
        city: 'Алматы',
        description: 'Ищу басиста для новой группы',
        genres: ['Rock'],
        role: 'Басист',
        format: 'офлайн',
        payment: 'Обсуждается',
      };
      listing = await request('/api/listings', { method: 'POST', cookie: alice.cookie, data });
      assert.equal(listing.status, 201);
      assert.equal(
        (
          await request(`/api/listings/${listing.value.id}`, {
            method: 'PUT',
            cookie: alice.cookie,
            data: { ...data, title: 'Ищу гитариста' },
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await request('/api/listings', {
            method: 'POST',
            cookie: alice.cookie,
            data: { ...data, description: 'x' },
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request(`/api/listings/${listing.value.id}`, {
            method: 'DELETE',
            cookie: bob.cookie,
          })
        ).status,
        403,
      );
    });
    await t.test(
      'favorites are per-user and idempotent; community text stays plain text',
      async () => {
        const favorite = { kind: 'groups', id: group.value.id, saved: true };
        for (let i = 0; i < 2; i++)
          assert.equal(
            (
              await request('/api/favorites', {
                method: 'POST',
                cookie: bob.cookie,
                data: favorite,
              })
            ).status,
            200,
          );
        assert.equal(
          (await request('/api/bootstrap', { cookie: bob.cookie })).value.favorites.length,
          1,
        );
        assert.equal(
          (await request('/api/bootstrap', { cookie: alice.cookie })).value.favorites.length,
          0,
        );
        post = await request('/api/posts', {
          method: 'POST',
          cookie: alice.cookie,
          data: { text: '<script>alert(1)</script>', tags: ['джем'] },
        });
        assert.equal(post.status, 201);
        assert.equal(post.value.text, '<script>alert(1)</script>');
        assert.equal(
          (await request(`/api/posts/${post.value.id}`, { method: 'DELETE', cookie: bob.cookie }))
            .status,
          403,
        );
      },
    );
    await t.test(
      'messages are visible only to participants, with no demo recipients or self-messaging',
      async () => {
        const sent = await request('/api/messages', {
          method: 'POST',
          cookie: alice.cookie,
          data: { receiver: bob.value.user.id, text: 'Привет! Давай сыграем.' },
        });
        assert.equal(sent.status, 201);
        assert.equal(
          (await request('/api/messages', { cookie: bob.cookie })).value[0].text,
          sent.value.text,
        );
        assert.equal((await request('/api/messages', { cookie: charlie.cookie })).value.length, 0);
        assert.equal(
          (
            await request('/api/messages', {
              method: 'POST',
              cookie: alice.cookie,
              data: { receiver: 'm1', text: 'Привет' },
            })
          ).status,
          404,
        );
        assert.equal(
          (
            await request('/api/messages', {
              method: 'POST',
              cookie: alice.cookie,
              data: { receiver: alice.value.user.id, text: 'Привет' },
            })
          ).status,
          400,
        );
      },
    );
    await t.test(
      'SPA deep links work, missing assets and unknown API routes return 404',
      async () => {
        const page = await request('/profile/s1');
        assert.equal(page.status, 200);
        assert(page.value.includes('SPA'));
        assert.equal((await request('/assets/missing.js')).status, 404);
        assert.equal((await request('/api/unknown')).status, 404);
      },
    );
    await t.test('database, sessions, uploads and messages survive server restart', async () => {
      await app.close();
      app = createApplication(options);
      await listen();
      const snapshot = await request('/api/bootstrap', { cookie: alice.cookie });
      assert.equal(snapshot.value.user.id, alice.value.user.id);
      assert(
        snapshot.value.groups.some((g) => g.id === group.value.id && g.name === 'Updated Band'),
      );
      assert.equal((await request('/api/messages', { cookie: bob.cookie })).value.length, 1);
      assert.equal((await fetch(base + media.value.url)).status, 200);
    });
    await t.test(
      'detached files are kept while shared and removed after their last reference',
      async () => {
        const snapshot = (await request('/api/bootstrap', { cookie: alice.cookie })).value;
        const currentGroup = snapshot.groups.find((g) => g.id === group.value.id);
        const currentProfile = snapshot.profiles.find((p) => p.id === alice.value.user.id);
        assert.equal(
          (
            await request(`/api/groups/${group.value.id}`, {
              method: 'PUT',
              cookie: alice.cookie,
              data: { ...currentGroup, cover: media.value.url },
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await request('/api/profile', {
              method: 'PUT',
              cookie: alice.cookie,
              data: { ...currentProfile, photo: '', portfolio: [] },
            })
          ).status,
          200,
        );
        assert.equal((await fetch(base + media.value.url)).status, 200);
        assert.equal(
          (
            await request(`/api/groups/${group.value.id}`, {
              method: 'PUT',
              cookie: alice.cookie,
              data: { ...currentGroup, cover: '' },
            })
          ).status,
          200,
        );
        assert.equal((await fetch(base + media.value.url)).status, 404);
        assert.equal(
          (
            await request('/api/uploads', {
              method: 'POST',
              cookie: alice.cookie,
              data: { name: 'bad', mime: 'constructor', base64: 'AAAA' },
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request('/api/profile', {
              method: 'PUT',
              cookie: alice.cookie,
              data: { ...currentProfile, photo: '', portfolio: [], links: 'invalid' },
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request('/api/groups', {
              method: 'POST',
              cookie: alice.cookie,
              data: { ...currentGroup, members: [null] },
            })
          ).status,
          400,
        );
      },
    );
    await t.test(
      'owners delete records, favorites are cleaned and logout revokes sessions',
      async () => {
        assert.equal(
          (
            await request(`/api/groups/${group.value.id}`, {
              method: 'DELETE',
              cookie: alice.cookie,
            })
          ).status,
          200,
        );
        assert.equal(
          (await request('/api/bootstrap', { cookie: bob.cookie })).value.favorites.length,
          0,
        );
        for (const [kind, id] of [
          ['listings', listing.value.id],
          ['posts', post.value.id],
        ])
          assert.equal(
            (await request(`/api/${kind}/${id}`, { method: 'DELETE', cookie: alice.cookie }))
              .status,
            200,
          );
        assert.equal(
          (await request('/api/auth/logout', { method: 'POST', cookie: bob.cookie, data: {} }))
            .status,
          200,
        );
        assert.equal((await request('/api/messages', { cookie: bob.cookie })).status, 401);
      },
    );
  } finally {
    await app.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
