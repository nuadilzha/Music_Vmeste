import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, useApp, type Profile } from '../lib/api';
import { LoginRequired, splitList } from '../components/UI';
import { ImageField, MediaEditor } from '../components/MediaEditor';
export function MyProfilePage() {
  const { data } = useApp();
  const profile = data.profiles.find((p) => p.id === data.user?.id);
  return (
    <div className="page-shell container">
      {profile ? (
        <ProfileEditor key={profile.id} initial={profile} />
      ) : (
        <LoginRequired text="Создайте аккаунт, чтобы рассказать о себе и показать свои работы." />
      )}
    </div>
  );
}
function ProfileEditor({ initial }: { initial: Profile }) {
  const { refresh, notice, data } = useApp();
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const uploadState = (active: boolean) => setUploads((n) => n + (active ? 1 : -1));
  const [error, setError] = useState('');
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((p) => ({ ...p, [key]: value }));
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploads > 0 || busy) return;
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    try {
      await api('/profile', 'PUT', {
        ...draft,
        genres: splitList(String(f.get('genres'))),
        instruments: splitList(String(f.get('instruments'))),
        links: String(f.get('links'))
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean),
      });
      await refresh();
      notice('Профиль сохранён');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-header">
        <div>
          <div className="eyebrow">Ваш звук и ваши идеи</div>
          <h1>Мой профиль</h1>
          <p className="muted">{data.user?.email}</p>
        </div>
        <Link to={`/profile/${draft.id}`} className="ghost-btn">
          Посмотреть профиль ↗
        </Link>
      </div>
      <form className="panel-card editor" onSubmit={save}>
        <div className="editor-grid">
          <label>
            Имя
            <input
              required
              minLength={2}
              maxLength={80}
              value={draft.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </label>
          <label>
            Город
            <input
              required
              minLength={2}
              maxLength={80}
              value={draft.city}
              onChange={(e) => update('city', e.target.value)}
            />
          </label>
          <label>
            Тип профиля
            <select
              value={draft.type}
              onChange={(e) => update('type', e.target.value as Profile['type'])}
            >
              <option value="musician">Музыкант</option>
              <option value="specialist">Специалист</option>
            </select>
          </label>
          <label>
            Роль
            <input
              required
              minLength={2}
              maxLength={80}
              value={draft.role}
              onChange={(e) => update('role', e.target.value)}
              placeholder="Гитарист, продюсер…"
            />
          </label>
          <label>
            Опыт
            <select
              value={draft.experience}
              onChange={(e) => update('experience', e.target.value as Profile['experience'])}
            >
              {['Начинающий', 'Любитель', 'Опытный', 'Профи'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Жанры через запятую
            <input
              name="genres"
              defaultValue={draft.genres.join(', ')}
              maxLength={500}
              placeholder="Rock, Indie"
            />
          </label>
          <label className="full-width">
            О себе
            <textarea
              maxLength={3000}
              value={draft.description}
              onChange={(e) => update('description', e.target.value)}
              rows={5}
            />
          </label>
          <label>
            Навыки через запятую
            <input
              name="instruments"
              defaultValue={draft.instruments?.join(', ')}
              maxLength={1000}
            />
          </label>
          <label>
            Доступность
            <input
              maxLength={200}
              value={draft.availability || ''}
              onChange={(e) => update('availability', e.target.value)}
              placeholder="Репетиции по выходным, онлайн…"
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(draft.openToProjects)}
              onChange={(e) => update('openToProjects', e.target.checked)}
            />{' '}
            Открыт к проектам
          </label>
          <label className="full-width">
            Ссылки — каждая с новой строки
            <textarea
              name="links"
              defaultValue={draft.links?.join('\n')}
              rows={3}
              placeholder="https://soundcloud.com/your-name"
            />
          </label>
          <ImageField
            label="Фото"
            value={draft.photo}
            onChange={(v) => update('photo', v)}
            onUploadState={uploadState}
          />
          <ImageField
            label="Обложка"
            value={draft.cover}
            onChange={(v) => update('cover', v)}
            onUploadState={uploadState}
          />
        </div>
        <MediaEditor
          items={draft.portfolio}
          onChange={(v) => update('portfolio', v)}
          onUploadState={uploadState}
        />
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="primary-btn" disabled={busy || uploads > 0}>
            {busy ? 'Сохраняем…' : 'Сохранить профиль'}
          </button>
        </div>
      </form>
      <section className="section-block">
        <div className="section-header">
          <h2>Мои группы</h2>
          <Link to="/groups/new" className="ghost-btn">
            Создать группу
          </Link>
        </div>
        {data.groups
          .filter((g) => g.ownerId === data.user?.id)
          .map((g) => (
            <Link className="owned-row" to={`/group/${g.id}`} key={g.id}>
              {g.name} ↗
            </Link>
          ))}
      </section>
    </>
  );
}
