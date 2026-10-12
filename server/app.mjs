import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from 'node:crypto';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scrypt = promisify(scryptCallback);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seed = JSON.parse(fs.readFileSync(new URL('./seed.json', import.meta.url), 'utf8'));
const MAX_BODY = 12 * 1024 * 1024;
const SESSION_AGE = 7 * 24 * 60 * 60 * 1000;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
const mediaTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function fail(status, message) {
  throw new ApiError(status, message);
}
function text(value, name, min = 0, max = 500) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    fail(400, `${name}: допустимо от ${min} до ${max} символов.`);
  return value.trim();
}
function list(value, name, max = 20) {
  if (!Array.isArray(value) || value.length > max) fail(400, `${name}: неверный список.`);
  return [...new Set(value.map((v) => text(v, name, 1, 100)))];
}
function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}
async function body(req) {
  if (!(req.headers['content-type'] || '').startsWith('application/json'))
    fail(415, 'Ожидается JSON.');
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) fail(413, 'Файл или запрос слишком большой.');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString());
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    fail(400, 'Некорректный JSON.');
  }
}

export function createApplication({
  dataDir = path.join(root, 'data'),
  uploadDir = path.join(root, 'uploads'),
  distDir = path.join(root, 'dist'),
  appOrigin = process.env.APP_ORIGIN,
  secureCookie = process.env.COOKIE_SECURE === 'true',
} = {}) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'music.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS entities (kind TEXT NOT NULL, id TEXT NOT NULL, owner TEXT, data TEXT NOT NULL, PRIMARY KEY(kind,id));
    CREATE TABLE IF NOT EXISTS favorites (user_id TEXT NOT NULL, entity_id TEXT NOT NULL, kind TEXT NOT NULL, PRIMARY KEY(user_id,kind,entity_id));
    CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, sender TEXT NOT NULL, receiver TEXT NOT NULL, text TEXT NOT NULL, created TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS messages_participants ON messages(sender,receiver,created);
    CREATE TABLE IF NOT EXISTS uploads (id TEXT PRIMARY KEY, owner TEXT NOT NULL, filename TEXT NOT NULL, mime TEXT NOT NULL);`);
  const put = db.prepare(
    'INSERT INTO entities(kind,id,owner,data) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET owner=excluded.owner,data=excluded.data',
  );
  for (const kind of ['profiles', 'groups', 'listings', 'posts'])
    for (const item of seed[kind]) {
      db.prepare('INSERT OR IGNORE INTO entities(kind,id,owner,data) VALUES(?,?,NULL,?)').run(
        kind,
        item.id,
        JSON.stringify({ ...item, ownerId: null, isDemo: true }),
      );
    }
  const all = (kind) =>
    db
      .prepare('SELECT data FROM entities WHERE kind=? ORDER BY rowid DESC')
      .all(kind)
      .map((r) => JSON.parse(r.data));
  const get = (kind, id) => {
    const row = db.prepare('SELECT * FROM entities WHERE kind=? AND id=?').get(kind, id);
    return row ? { ...row, value: JSON.parse(row.data) } : null;
  };
  const attachedFiles = (value) =>
    [value?.photo, value?.cover, ...(value?.portfolio || []).map((m) => m.url)].filter(
      (url) => typeof url === 'string' && url.startsWith('/uploads/'),
    );
  function cleanDetachedFiles(previous, userId) {
    const candidates = new Set(attachedFiles(previous));
    if (!candidates.size) return;
    const referenced = new Set(
      db
        .prepare('SELECT data FROM entities WHERE owner=?')
        .all(userId)
        .flatMap((row) => attachedFiles(JSON.parse(row.data))),
    );
    for (const url of candidates) {
      if (referenced.has(url)) continue;
      const filename = url.slice(9);
      const record = db.prepare('SELECT owner FROM uploads WHERE filename=?').get(filename);
      if (record?.owner !== userId) continue;
      try {
        fs.rmSync(path.join(uploadDir, filename), { force: true });
        db.prepare('DELETE FROM uploads WHERE filename=? AND owner=?').run(filename, userId);
      } catch (error) {
        console.error('Не удалось удалить отсоединённый файл:', error.message);
      }
    }
  }
  const rate = new Map();
  function limit(req, bucket, max = 20) {
    const key = `${req.socket.remoteAddress}:${bucket}`,
      now = Date.now();
    if (rate.size > 10000) for (const [k, v] of rate) if (v.until < now) rate.delete(k);
    const item = rate.get(key);
    if (!item || item.until < now) {
      rate.set(key, { count: 1, until: now + 60000 });
      return;
    }
    if (++item.count > max) fail(429, 'Слишком много запросов. Попробуйте через минуту.');
  }
  function current(req) {
    const token = /(?:^|;\s*)mv_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    if (!token) return null;
    const row = db
      .prepare(
        'SELECT users.id,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?',
      )
      .get(hashToken(token), Date.now());
    return row ? { id: row.id, email: row.email } : null;
  }
  function requireUser(req) {
    const user = current(req);
    if (!user) fail(401, 'Войдите в аккаунт.');
    return user;
  }
  function cookie(res, token, clear = false) {
    res.setHeader(
      'Set-Cookie',
      `mv_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : SESSION_AGE / 1000}${secureCookie ? '; Secure' : ''}`,
    );
  }
  function publicUrl(value, user, name, media = false) {
    const url = text(value ?? '', name, 0, 2000);
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
      const row = db.prepare('SELECT owner FROM uploads WHERE filename=?').get(url.slice(9));
      if (!row || row.owner !== user.id) fail(400, `${name}: файл не принадлежит вам.`);
      return url;
    }
    try {
      const parsed = new URL(url);
      if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password)
        throw new Error();
    } catch {
      fail(400, `${name}: укажите ссылку http или https.`);
    }
    if (media && url.length > 2000) fail(400, 'Слишком длинная ссылка.');
    return url;
  }
  function portfolio(value, user) {
    if (!Array.isArray(value) || value.length > 12)
      fail(400, 'В портфолио можно добавить до 12 файлов.');
    return value.map((item) => {
      if (!item || !['audio', 'video', 'image'].includes(item.type))
        fail(400, 'Неизвестный тип медиа.');
      const url = publicUrl(item.url, user, 'Медиа', true);
      if (!url) fail(400, 'Добавьте файл или ссылку.');
      if (url.startsWith('/uploads/')) {
        const row = db.prepare('SELECT mime FROM uploads WHERE filename=?').get(url.slice(9));
        if (!row.mime.startsWith(item.type + '/'))
          fail(400, 'Тип файла не совпадает с типом медиа.');
      }
      return {
        id: text(item.id || randomUUID(), 'ID', 1, 100),
        title: text(item.title, 'Название', 1, 120),
        description: text(item.description || '', 'Описание', 0, 500),
        type: item.type,
        url,
      };
    });
  }
  function profile(data, user) {
    if (!['musician', 'specialist'].includes(data.type)) fail(400, 'Выберите тип профиля.');
    if (!['Начинающий', 'Любитель', 'Опытный', 'Профи'].includes(data.experience))
      fail(400, 'Выберите уровень опыта.');
    if (!Array.isArray(data.links || []) || (data.links || []).length > 5)
      fail(400, 'Можно добавить до 5 ссылок.');
    return {
      id: user.id,
      ownerId: user.id,
      type: data.type,
      name: text(data.name, 'Имя', 2, 80),
      city: text(data.city, 'Город', 2, 80),
      role: text(data.role, 'Роль', 2, 80),
      genres: list(data.genres, 'Жанры', 12),
      description: text(data.description, 'О себе', 0, 3000),
      experience: data.experience,
      availability: text(data.availability || '', 'Доступность', 0, 200),
      instruments: list(data.instruments || [], 'Навыки'),
      links: (data.links || []).map((v) => publicUrl(v, user, 'Ссылка')).filter(Boolean),
      photo: publicUrl(data.photo, user, 'Фото'),
      cover: publicUrl(data.cover, user, 'Обложка'),
      portfolio: portfolio(data.portfolio || [], user),
      openToProjects: Boolean(data.openToProjects),
    };
  }
  function json(res, value, status = 200) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(value));
  }
  async function api(req, res, url) {
    const route = url.pathname,
      method = req.method;
    if (!['GET', 'HEAD'].includes(method)) {
      const origin = req.headers.origin,
        allowed = appOrigin || `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}`;
      if (origin && origin !== allowed) fail(403, 'Недопустимый источник запроса.');
    }
    if (route === '/api/health' && method === 'GET') return json(res, { ok: true });
    if (route === '/api/bootstrap' && method === 'GET') {
      const user = current(req);
      return json(res, {
        user,
        profiles: all('profiles'),
        groups: all('groups'),
        listings: all('listings'),
        posts: all('posts'),
        favorites: user
          ? db.prepare('SELECT kind,entity_id AS id FROM favorites WHERE user_id=?').all(user.id)
          : [],
      });
    }
    if (['/api/auth/register', '/api/auth/login'].includes(route) && method === 'POST') {
      limit(req, 'auth', 15);
      const data = await body(req);
      const email = text(data.email, 'Email', 3, 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Проверьте email.');
      const password = text(data.password, 'Пароль', 10, 128);
      let user;
      if (route.endsWith('register')) {
        if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
          fail(409, 'Этот email уже зарегистрирован.');
        const name = text(data.name, 'Имя', 2, 80),
          salt = randomBytes(16).toString('hex'),
          derived = await scrypt(password, salt, 64);
        user = { id: randomUUID(), email };
        try {
          db.prepare('INSERT INTO users VALUES(?,?,?)').run(
            user.id,
            email,
            `${salt}:${derived.toString('hex')}`,
          );
        } catch (err) {
          if (String(err).includes('UNIQUE')) fail(409, 'Этот email уже зарегистрирован.');
          throw err;
        }
        put.run(
          'profiles',
          user.id,
          user.id,
          JSON.stringify({
            id: user.id,
            ownerId: user.id,
            type: 'musician',
            name,
            city: 'Алматы',
            genres: [],
            role: 'Музыкант',
            description: '',
            experience: 'Любитель',
            instruments: [],
            portfolio: [],
            links: [],
            photo: '',
            cover: '',
            openToProjects: true,
          }),
        );
      } else {
        const row = db.prepare('SELECT * FROM users WHERE email=?').get(email);
        const [salt, expected] = row ? row.password.split(':') : ['0'.repeat(32), '0'.repeat(128)];
        const derived = await scrypt(password, salt, 64);
        if (!row || !timingSafeEqual(derived, Buffer.from(expected, 'hex')))
          fail(401, 'Неверный email или пароль.');
        user = { id: row.id, email: row.email };
      }
      db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
      const token = randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(
        hashToken(token),
        user.id,
        Date.now() + SESSION_AGE,
      );
      cookie(res, token);
      return json(res, { user }, 200);
    }
    if (route === '/api/auth/logout' && method === 'POST') {
      const token = /mv_session=([a-f0-9]{64})/.exec(req.headers.cookie || '')?.[1];
      if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(hashToken(token));
      cookie(res, '', true);
      return json(res, { ok: true });
    }
    if (route === '/api/profile' && method === 'PUT') {
      const user = requireUser(req),
        value = profile(await body(req), user);
      const previous = get('profiles', user.id)?.value;
      put.run('profiles', user.id, user.id, JSON.stringify(value));
      cleanDetachedFiles(previous, user.id);
      return json(res, value);
    }
    if (route === '/api/uploads' && method === 'POST') {
      const user = requireUser(req);
      limit(req, 'uploads', 20);
      const data = await body(req);
      data.mime =
        {
          'audio/x-wav': 'audio/wav',
          'audio/wave': 'audio/wav',
          'audio/mp3': 'audio/mpeg',
          'audio/x-mpeg': 'audio/mpeg',
        }[data.mime] || data.mime;
      if (typeof data.mime !== 'string' || !Object.hasOwn(mediaTypes, data.mime))
        fail(400, 'Поддерживаются JPEG, PNG, WebP, MP3, WAV, OGG, MP4 и WebM.');
      if (typeof data.base64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(data.base64))
        fail(400, 'Некорректный файл.');
      const bytes = Buffer.from(data.base64, 'base64');
      if (!bytes.length || bytes.length > 8 * 1024 * 1024) fail(413, 'Размер файла: до 8 МБ.');
      // Reject content masquerading as a browser-renderable image or media file.
      const signatures = {
        'image/jpeg': () => bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
        'image/png': () =>
          bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
        'image/webp': () =>
          bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
        'audio/mpeg': () =>
          bytes.toString('ascii', 0, 3) === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224),
        'audio/wav': () =>
          bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE',
        'audio/ogg': () => bytes.toString('ascii', 0, 4) === 'OggS',
        'video/mp4': () => bytes.toString('ascii', 4, 8) === 'ftyp',
        'video/webm': () => bytes.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163])),
      };
      if (!signatures[data.mime]()) fail(400, 'Содержимое файла не соответствует формату.');
      const usage = db
        .prepare('SELECT filename FROM uploads WHERE owner=?')
        .all(user.id)
        .reduce((sum, row) => {
          try {
            return sum + fs.statSync(path.join(uploadDir, row.filename)).size;
          } catch {
            return sum;
          }
        }, 0);
      if (usage + bytes.length > 100 * 1024 * 1024) fail(413, 'Лимит файлов аккаунта — 100 МБ.');
      const id = randomUUID(),
        filename = `${id}.${mediaTypes[data.mime]}`;
      fs.writeFileSync(path.join(uploadDir, filename), bytes);
      db.prepare('INSERT INTO uploads VALUES(?,?,?,?)').run(id, user.id, filename, data.mime);
      return json(
        res,
        {
          id,
          url: `/uploads/${filename}`,
          type: data.mime.split('/')[0],
          title: text(data.name || 'Медиа', 'Название', 1, 120),
        },
        201,
      );
    }
    const entityMatch = /^\/api\/(groups|listings|posts)(?:\/([^/]+))?$/.exec(route);
    if (entityMatch && ['POST', 'PUT', 'DELETE'].includes(method)) {
      const user = requireUser(req),
        kind = entityMatch[1],
        id = entityMatch[2];
      limit(req, 'publish', 50);
      if (method !== 'POST') {
        const existing = get(kind, id || '');
        if (!existing) fail(404, 'Запись не найдена.');
        if (existing.owner !== user.id) fail(403, 'Вы можете изменять только свои записи.');
      }
      if (method === 'DELETE') {
        const previous = get(kind, id)?.value;
        db.prepare('DELETE FROM entities WHERE kind=? AND id=?').run(kind, id);
        db.prepare('DELETE FROM favorites WHERE kind=? AND entity_id=?').run(kind, id);
        cleanDetachedFiles(previous, user.id);
        return json(res, { ok: true });
      }
      if ((method === 'POST' && id) || (method === 'PUT' && !id)) fail(400, 'Некорректный адрес.');
      const data = await body(req),
        entityId = method === 'POST' ? randomUUID() : id;
      let value = {
        id: entityId,
        ownerId: user.id,
        createdAt: method === 'PUT' ? get(kind, id).value.createdAt : new Date().toISOString(),
      };
      if (kind === 'groups') {
        if (
          !Array.isArray(data.members) ||
          data.members.length > 20 ||
          data.members.some((m) => !m || typeof m !== 'object')
        )
          fail(400, 'Добавьте не более 20 участников в формате Имя — Роль.');
        value = {
          ...value,
          type: 'group',
          name: text(data.name, 'Название', 2, 100),
          city: text(data.city, 'Город', 2, 80),
          genres: list(data.genres, 'Жанры'),
          description: text(data.description, 'Описание', 0, 3000),
          cover: publicUrl(data.cover, user, 'Обложка'),
          members: data.members.map((m) => ({
            name: text(m.name, 'Участник', 2, 80),
            role: text(m.role, 'Роль', 2, 80),
          })),
          openPositions: list(data.openPositions || [], 'Вакансии'),
          rehearsalSchedule: text(data.rehearsalSchedule || '', 'Репетиции', 0, 300),
          collaboration: text(data.collaboration || '', 'Сотрудничество', 0, 300),
          portfolio: portfolio(data.portfolio || [], user),
        };
      } else if (kind === 'listings') {
        if (!['musician', 'group', 'specialist'].includes(data.type))
          fail(400, 'Выберите категорию.');
        if (!['онлайн', 'офлайн', 'онлайн/офлайн'].includes(data.format))
          fail(400, 'Выберите формат.');
        value = {
          ...value,
          type: data.type,
          title: text(data.title, 'Заголовок', 3, 160),
          city: text(data.city, 'Город', 2, 80),
          description: text(data.description, 'Описание', 10, 3000),
          role: text(data.role || '', 'Роль', 0, 80),
          genres: list(data.genres || [], 'Жанры'),
          format: data.format,
          payment: text(data.payment || '', 'Оплата', 0, 120),
        };
      } else {
        value = {
          ...value,
          author: get('profiles', user.id)?.value.name || 'Участник',
          text: text(data.text, 'Сообщение', 1, 2000),
          tags: list(data.tags || [], 'Теги', 5),
        };
      }
      const previous = get(kind, entityId)?.value;
      put.run(kind, entityId, user.id, JSON.stringify(value));
      cleanDetachedFiles(previous, user.id);
      return json(res, value, method === 'POST' ? 201 : 200);
    }
    if (route === '/api/favorites' && method === 'POST') {
      const user = requireUser(req),
        data = await body(req);
      if (
        !['profiles', 'groups'].includes(data.kind) ||
        typeof data.id !== 'string' ||
        !get(data.kind, data.id)
      )
        fail(404, 'Профиль не найден.');
      if (typeof data.saved !== 'boolean') fail(400, 'Укажите состояние избранного.');
      if (data.saved)
        db.prepare('INSERT OR IGNORE INTO favorites VALUES(?,?,?)').run(
          user.id,
          data.id,
          data.kind,
        );
      else
        db.prepare('DELETE FROM favorites WHERE user_id=? AND entity_id=? AND kind=?').run(
          user.id,
          data.id,
          data.kind,
        );
      return json(res, { ok: true });
    }
    if (route === '/api/messages' && method === 'GET') {
      const user = requireUser(req);
      return json(
        res,
        db
          .prepare(
            'SELECT id,sender,receiver,text,created AS createdAt FROM messages WHERE sender=? OR receiver=? ORDER BY created,rowid',
          )
          .all(user.id, user.id),
      );
    }
    if (route === '/api/messages' && method === 'POST') {
      const user = requireUser(req);
      limit(req, 'messages', 60);
      const data = await body(req),
        receiver = text(data.receiver, 'Получатель', 1, 100);
      if (receiver === user.id) fail(400, 'Выберите другого участника.');
      if (!db.prepare('SELECT id FROM users WHERE id=?').get(receiver))
        fail(404, 'Это демо-профиль. Выберите зарегистрированного участника.');
      const value = {
        id: randomUUID(),
        sender: user.id,
        receiver,
        text: text(data.text, 'Сообщение', 1, 2000),
        createdAt: new Date().toISOString(),
      };
      db.prepare('INSERT INTO messages VALUES(?,?,?,?,?)').run(
        value.id,
        user.id,
        receiver,
        value.text,
        value.createdAt,
      );
      return json(res, value, 201);
    }
    fail(404, 'API-маршрут не найден.');
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: http: data:; media-src 'self' https: http: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) return await api(req, res, url);
      if (!['GET', 'HEAD'].includes(req.method)) fail(405, 'Метод не поддерживается.');
      let filename, mime;
      if (url.pathname.startsWith('/uploads/')) {
        const name = url.pathname.slice(9);
        if (!/^[a-f0-9-]+\.(jpg|png|webp|mp3|wav|ogg|mp4|webm)$/.test(name))
          fail(404, 'Файл не найден.');
        const record = db.prepare('SELECT mime FROM uploads WHERE filename=?').get(name);
        if (!record) fail(404, 'Файл не найден.');
        filename = path.join(uploadDir, name);
        mime = record.mime;
        if (!fs.existsSync(filename)) fail(404, 'Файл не найден.');
      } else {
        let decoded;
        try {
          decoded = decodeURIComponent(url.pathname);
        } catch {
          fail(400, 'Некорректный URL.');
        }
        const candidate = path.resolve(distDir, '.' + decoded);
        if (
          !candidate.startsWith(path.resolve(distDir) + path.sep) &&
          candidate !== path.resolve(distDir)
        )
          fail(403, 'Доступ запрещён.');
        filename =
          fs.existsSync(candidate) && fs.statSync(candidate).isFile()
            ? candidate
            : path.join(distDir, 'index.html');
        if (!fs.existsSync(filename))
          fail(503, 'Сначала выполните npm run build либо используйте npm run dev.');
        if (
          filename.endsWith('index.html') &&
          path.extname(decoded) &&
          path.extname(decoded) !== '.html'
        )
          fail(404, 'Файл не найден.');
        mime = mimeTypes[path.extname(filename)] || 'application/octet-stream';
      }
      const size = fs.statSync(filename).size;
      let start = 0,
        end = size - 1,
        status = 200;
      if (req.headers.range) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
        if (!match) {
          res.writeHead(416, { 'Content-Range': `bytes */${size}` });
          return res.end();
        }
        start = Number(match[1]);
        end = match[2] ? Math.min(Number(match[2]), end) : end;
        if (start > end || start >= size) {
          res.writeHead(416, { 'Content-Range': `bytes */${size}` });
          return res.end();
        }
        status = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      }
      res.writeHead(status, {
        'Content-Type': mime,
        'Content-Length': end - start + 1,
        'Accept-Ranges': 'bytes',
        'Cache-Control': filename.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600',
      });
      if (req.method === 'HEAD') return res.end();
      const stream = fs.createReadStream(filename, { start, end });
      stream.on('error', () => res.destroy());
      stream.pipe(res);
    } catch (error) {
      if (res.headersSent) return res.destroy();
      if (!(error instanceof ApiError)) console.error(error);
      json(
        res,
        {
          error: error instanceof ApiError ? error.message : 'Ошибка сервера. Попробуйте ещё раз.',
        },
        error instanceof ApiError ? error.status : 500,
      );
    }
  });
  return {
    server,
    db,
    close: () =>
      new Promise((resolve) =>
        server.close(() => {
          db.close();
          resolve();
        }),
      ),
  };
}
