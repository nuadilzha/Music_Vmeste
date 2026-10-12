import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { createApplication } from '../server/app.mjs';

test('UI with real API: registration, profile/media, specialist links, filters, favorites, groups, listings, community and chat', async (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'music-vmeste-ui-'));
  const app = createApplication({
    dataDir: path.join(temp, 'data'),
    uploadDir: path.join(temp, 'uploads'),
  });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: base,
    pretendToBeVisual: true,
  });
  const savedGlobals = new Map();
  for (const name of [
    'window',
    'document',
    'navigator',
    'HTMLElement',
    'HTMLInputElement',
    'Node',
    'MutationObserver',
    'FormData',
    'FileReader',
    'File',
    'getComputedStyle',
  ]) {
    savedGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value:
        name === 'getComputedStyle'
          ? dom.window.getComputedStyle.bind(dom.window)
          : dom.window[name],
    });
  }
  dom.window.scrollTo = () => {};
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  const originalFetch = globalThis.fetch;
  let cookie = '';
  globalThis.fetch = async (url, options = {}) => {
    const response = await originalFetch(new URL(url, base), {
      ...options,
      headers: { ...options.headers, Cookie: cookie },
    });
    const session = response.headers.get('set-cookie');
    if (session) cookie = session.split(';')[0];
    return response;
  };
  const vite = await createServer({
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
    logLevel: 'error',
  });
  const React = await import('react');
  const { BrowserRouter } = await import('react-router-dom');
  const { render, screen, cleanup, waitFor } = await import('@testing-library/react');
  const { default: userEvent } = await import('@testing-library/user-event');
  const { default: App } = await vite.ssrLoadModule('/src/App.tsx');
  const { AppProvider } = await vite.ssrLoadModule('/src/lib/api.tsx');
  const user = userEvent.setup({ document: dom.window.document });
  const open = async (route, heading) => {
    cleanup();
    dom.window.history.replaceState({}, '', route);
    render(
      React.createElement(
        BrowserRouter,
        null,
        React.createElement(AppProvider, null, React.createElement(App)),
      ),
    );
    await screen.findByRole('heading', { name: heading });
  };
  let aliceId, groupId, listingId, bobId;
  try {
    await t.test('home mounts, specialist details open and unknown routes show 404', async () => {
      await open('/', /Ваш звук/);
      assert(screen.getByRole('link', { name: /Найти музыкантов/ }));
      const snapshot = await (await globalThis.fetch('/api/bootstrap')).json();
      const specialist = snapshot.profiles.find((p) => p.id === 's1');
      await open('/profile/s1', specialist.name);
      assert(screen.getByText('Портфолио'));
      await open('/missing-page', /404/);
      await user.click(screen.getByRole('button', { name: 'Открыть меню' }));
      assert.equal(
        screen.getByRole('button', { name: 'Закрыть меню' }).getAttribute('aria-expanded'),
        'true',
      );
      await user.keyboard('{Escape}');
      assert.equal(
        screen.getByRole('button', { name: 'Открыть меню' }).getAttribute('aria-expanded'),
        'false',
      );
    });
    await t.test('registration form creates a session and opens profile editor', async () => {
      await open('/auth?mode=register', 'Присоединиться');
      await user.type(screen.getByLabelText('Имя'), 'Тестовый музыкант');
      await user.type(screen.getByLabelText('Email'), 'ui-alice@example.test');
      await user.type(screen.getByLabelText(/^Пароль/), 'ui-password-123');
      await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
      await screen.findByRole('heading', { name: 'Мой профиль' });
      const snapshot = await (await globalThis.fetch('/api/bootstrap')).json();
      aliceId = snapshot.user.id;
      assert(cookie);
    });
    await t.test('profile editor saves fields and uploaded media to the database', async () => {
      await user.selectOptions(screen.getByLabelText('Тип профиля'), 'specialist');
      await user.clear(screen.getByLabelText('Роль'));
      await user.type(screen.getByLabelText('Роль'), 'Продюсер');
      await user.type(screen.getByLabelText('Жанры через запятую'), 'Rock, Indie');
      await user.type(screen.getByLabelText('О себе'), 'Создаю музыку и ищу команду.');
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDqkAAAAASUVORK5CYII=',
        'base64',
      );
      await user.upload(
        screen.getByLabelText('Загрузить работу'),
        new dom.window.File([png], 'work.png', { type: 'image/png' }),
      );
      await screen.findByDisplayValue('work.png');
      await user.click(screen.getByRole('button', { name: 'Сохранить профиль' }));
      await screen.findByText('Профиль сохранён');
      await open(`/profile/${aliceId}`, 'Тестовый музыкант');
      assert(screen.getByText('Создаю музыку и ищу команду.'));
      assert(screen.getByAltText('work.png'));
    });
    await t.test('search filters, query parameters and favorites work', async () => {
      await open('/search?tab=specialists&real=1&genre=Rock', 'Найдите свою команду');
      assert(screen.getByText('Найдено: 1'));
      await user.click(screen.getByRole('button', { name: 'Сохранить Тестовый музыкант' }));
      await screen.findByText('Добавлено в избранное');
      await open('/favorites', 'Избранное');
      assert(screen.getByRole('heading', { name: 'Тестовый музыкант' }));
      await user.click(
        screen.getByRole('button', { name: 'Убрать Тестовый музыкант из избранного' }),
      );
      await screen.findByRole('heading', { name: 'Здесь будут ваши люди' });
    });
    await t.test('creates and edits a group with members and positions', async () => {
      await open('/groups/new', 'Создать группу');
      await user.type(screen.getByLabelText('Название группы'), 'UI Band');
      await user.type(screen.getByLabelText('Жанры через запятую'), 'Rock');
      await user.type(screen.getByLabelText(/Кого ищете/), 'Басист');
      await user.type(screen.getByLabelText(/Участники —/), 'Алия — Вокал');
      await user.click(screen.getByRole('button', { name: 'Сохранить группу' }));
      await screen.findByRole('heading', { name: 'UI Band' });
      groupId = dom.window.location.pathname.split('/').at(-1);
      assert(screen.getByText('Алия'));
      await user.click(screen.getByRole('link', { name: 'Редактировать' }));
      await screen.findByRole('heading', { name: 'Редактировать группу' });
      await user.clear(screen.getByLabelText('Название группы'));
      await user.type(screen.getByLabelText('Название группы'), 'UI Band Updated');
      await user.click(screen.getByRole('button', { name: 'Сохранить группу' }));
      await screen.findByRole('heading', { name: 'UI Band Updated' });
    });
    await t.test('publishes and edits a listing; applies the owner filter', async () => {
      await open('/listings/new', 'Новое объявление');
      await user.type(screen.getByLabelText('Заголовок'), 'Ищу барабанщика UI');
      await user.type(screen.getByLabelText('Описание'), 'Ищу барабанщика для новой рок-группы.');
      await user.click(screen.getByRole('button', { name: 'Опубликовать' }));
      await screen.findByRole('heading', { name: 'Ищу барабанщика UI' });
      await user.click(screen.getByLabelText('Мои объявления'));
      assert(screen.getByText('Найдено: 1'));
      await user.click(screen.getByRole('link', { name: 'Редактировать' }));
      await screen.findByRole('heading', { name: 'Редактировать объявление' });
      listingId = dom.window.location.pathname.split('/')[2];
      await user.clear(screen.getByLabelText('Заголовок'));
      await user.type(screen.getByLabelText('Заголовок'), 'Ищу гитариста UI');
      await user.click(screen.getByRole('button', { name: 'Опубликовать' }));
      await screen.findByRole('heading', { name: 'Ищу гитариста UI' });
    });
    await t.test('publishes a community post and renders markup as text', async () => {
      await open('/community', 'Сообщество');
      await user.type(
        screen.getByLabelText('О чём хотите рассказать?'),
        '<script>hello UI</script>',
      );
      await user.type(screen.getByLabelText('Теги через запятую'), 'ui-test');
      await user.click(screen.getByRole('button', { name: 'Опубликовать' }));
      await screen.findByText('<script>hello UI</script>');
      assert.equal(document.querySelectorAll('script').length, 0);
    });
    await t.test('sends a private message and shows it to the other account', async () => {
      const r = await originalFetch(base + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'UI Боб',
          email: 'ui-bob@example.test',
          password: 'ui-password-456',
        }),
      });
      const value = await r.json();
      bobId = value.user.id;
      const bobCookie = r.headers.get('set-cookie').split(';')[0];
      await open(`/messages?to=${bobId}`, 'Сообщения');
      await screen.findByLabelText('Сообщение');
      await user.type(screen.getByLabelText('Сообщение'), 'Привет! Предлагаю сыграть вместе.');
      await user.click(screen.getByRole('button', { name: 'Отправить' }));
      await screen.findByText('Привет! Предлагаю сыграть вместе.', { selector: 'p' });
      cookie = bobCookie;
      await open(`/messages?to=${aliceId}`, 'Сообщения');
      await screen.findByText('Привет! Предлагаю сыграть вместе.', { selector: 'p' });
      await user.click(screen.getByRole('button', { name: 'Выйти из аккаунта' }));
      await screen.findByRole('heading', { name: 'Присоединяйтесь к сообществу' });
    });
    await t.test('signs back in and deletes owned groups/listings with confirmation', async () => {
      await open('/auth', 'С возвращением');
      await user.type(screen.getByLabelText('Email'), 'ui-alice@example.test');
      await user.type(screen.getByLabelText(/^Пароль/), 'ui-password-123');
      await user.click(screen.getByRole('button', { name: 'Войти', exact: true }));
      await screen.findByRole('heading', { name: 'Мой профиль' });
      await open(`/group/${groupId}`, 'UI Band Updated');
      await user.click(screen.getByRole('button', { name: 'Удалить группу' }));
      await user.click(screen.getByRole('button', { name: 'Удалить', exact: true }));
      await screen.findByRole('heading', { name: 'Найдите свою команду' });
      await open('/listings', 'Объявления');
      await user.click(screen.getByLabelText('Мои объявления'));
      await user.click(screen.getByRole('button', { name: 'Удалить', exact: true }));
      await user.click(screen.getByRole('button', { name: 'Удалить', exact: true }));
      await screen.findByRole('heading', { name: 'Пока нет объявлений' });
      const snapshot = await (await globalThis.fetch('/api/bootstrap')).json();
      assert(!snapshot.groups.some((g) => g.id === groupId));
      assert(!snapshot.listings.some((l) => l.id === listingId));
    });
  } finally {
    cleanup();
    await vite.close();
    await app.close();
    dom.window.close();
    globalThis.fetch = originalFetch;
    for (const [name, descriptor] of savedGlobals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
