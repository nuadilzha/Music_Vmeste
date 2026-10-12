import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, useApp, type Listing } from '../lib/api';
import { Empty, LoginRequired, splitList, formatDate } from '../components/UI';
const types: Record<string, string> = {
  musician: 'Музыкант',
  group: 'Группа',
  specialist: 'Специалист',
};
export function ListingsPage() {
  const { data, refresh, notice } = useApp();
  const [q, setQ] = useState(''),
    [type, setType] = useState(''),
    [format, setFormat] = useState(''),
    [mine, setMine] = useState(false),
    [deleting, setDeleting] = useState(''),
    [busy, setBusy] = useState(false);
  const items = data.listings.filter(
    (l) =>
      (!type || l.type === type) &&
      (!format || l.format === format) &&
      (!mine || (!!data.user && l.ownerId === data.user.id)) &&
      `${l.title} ${l.description} ${l.city} ${l.role} ${l.genres.join(' ')}`
        .toLowerCase()
        .includes(q.toLowerCase().trim()),
  );
  async function remove(id: string) {
    setBusy(true);
    try {
      await api(`/listings/${id}`, 'DELETE');
      await refresh();
      setDeleting('');
      notice('Объявление удалено');
    } catch (e) {
      notice((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-shell container">
      <div className="section-header">
        <div>
          <div className="eyebrow">Идеи ищут людей</div>
          <h1>Объявления</h1>
          <p className="muted">Найдите проект или пригласите участников в свой.</p>
        </div>
        <Link className="primary-btn" to="/listings/new">
          Опубликовать объявление
        </Link>
      </div>
      <section className="panel-card filter-grid">
        <label>
          Поиск
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Роль, город, проект…"
          />
        </label>
        <label>
          Категория
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Все категории</option>
            {Object.entries(types).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Формат
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">Любой формат</option>
            {['онлайн', 'офлайн', 'онлайн/офлайн'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        {data.user && (
          <label className="checkbox-label">
            <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Мои
            объявления
          </label>
        )}
      </section>
      <div className="results-toolbar">
        <span className="muted">Найдено: {items.length}</span>
      </div>
      <div className="listing-list">
        {items.map((l) => (
          <article className="panel-card listing-item" key={l.id}>
            <div className="listing-top">
              <span className="tag">{types[l.type]}</span>
              <span className="muted">
                {l.isDemo ? 'Пример объявления' : formatDate(l.createdAt)}
              </span>
            </div>
            <h2>{l.title}</h2>
            <p className="preserve-text">{l.description}</p>
            <div className="meta-row">
              <span>{l.city}</span>
              <span>{l.format}</span>
              <span>{l.payment || 'Оплата обсуждается'}</span>
            </div>
            <div className="tags">
              {l.genres.map((g) => (
                <span className="tag" key={g}>
                  {g}
                </span>
              ))}
            </div>
            <div className="listing-actions">
              {l.ownerId === data.user?.id ? (
                <>
                  <Link className="ghost-btn" to={`/listings/${l.id}/edit`}>
                    Редактировать
                  </Link>
                  {deleting === l.id ? (
                    <>
                      <span>Удалить без возможности восстановления?</span>
                      <button
                        className="danger-btn"
                        disabled={busy}
                        onClick={() => void remove(l.id)}
                      >
                        Удалить
                      </button>
                      <button className="link-btn" onClick={() => setDeleting('')}>
                        Отмена
                      </button>
                    </>
                  ) : (
                    <button className="link-btn danger" onClick={() => setDeleting(l.id)}>
                      Удалить
                    </button>
                  )}
                </>
              ) : l.ownerId ? (
                <Link
                  className="primary-btn"
                  to={data.user ? `/messages?to=${l.ownerId}` : '/auth'}
                >
                  Откликнуться
                </Link>
              ) : (
                <span className="demo-label">Демо: отклики недоступны</span>
              )}
            </div>
          </article>
        ))}
      </div>
      {!items.length && (
        <Empty
          title="Пока нет объявлений"
          text="Измените фильтры или опубликуйте своё предложение."
        />
      )}
    </div>
  );
}
export function ListingEditorPage() {
  const { id } = useParams();
  const { data } = useApp();
  const initial = data.listings.find((l) => l.id === id);
  if (!data.user)
    return (
      <div className="page-shell container">
        <LoginRequired text="Войдите, чтобы опубликовать объявление и получать отклики." />
      </div>
    );
  if (id && (!initial || initial.ownerId !== data.user.id))
    return (
      <div className="page-shell container">
        <Empty
          title="Редактирование недоступно"
          text="Объявление не найдено или принадлежит другому участнику."
          to="/listings"
          action="К объявлениям"
        />
      </div>
    );
  return (
    <div className="page-shell container">
      <ListingEditor key={id || 'new'} initial={initial} />
    </div>
  );
}
function ListingEditor({ initial }: { initial?: Listing }) {
  const { refresh, notice } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api(`/listings${initial ? '/' + initial.id : ''}`, initial ? 'PUT' : 'POST', {
        ...f,
        genres: splitList(String(f.genres)),
      });
      await refresh();
      navigate('/listings');
      notice('Объявление опубликовано');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-header">
        <h1>{initial ? 'Редактировать объявление' : 'Новое объявление'}</h1>
        <Link className="link-btn" to="/listings">
          Отмена
        </Link>
      </div>
      <form className="panel-card editor" onSubmit={save}>
        <div className="editor-grid">
          <label className="full-width">
            Заголовок
            <input
              name="title"
              required
              minLength={3}
              maxLength={160}
              defaultValue={initial?.title}
              placeholder="Ищу басиста для инди-группы"
            />
          </label>
          <label>
            Категория
            <select name="type" defaultValue={initial?.type || 'musician'}>
              {Object.entries(types).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Город
            <input
              name="city"
              required
              minLength={2}
              maxLength={80}
              defaultValue={initial?.city || 'Алматы'}
            />
          </label>
          <label>
            Кого ищете
            <input name="role" maxLength={80} defaultValue={initial?.role} />
          </label>
          <label>
            Жанры через запятую
            <input name="genres" maxLength={500} defaultValue={initial?.genres.join(', ')} />
          </label>
          <label>
            Формат
            <select name="format" defaultValue={initial?.format || 'офлайн'}>
              {['онлайн', 'офлайн', 'онлайн/офлайн'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Оплата
            <input
              name="payment"
              maxLength={120}
              defaultValue={initial?.payment}
              placeholder="Оплачиваемо, обсуждается…"
            />
          </label>
          <label className="full-width">
            Описание
            <textarea
              name="description"
              required
              minLength={10}
              maxLength={3000}
              defaultValue={initial?.description}
              rows={6}
              placeholder="Расскажите о проекте, задачах и условиях."
            />
          </label>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="primary-btn" disabled={busy}>
            {busy ? 'Сохраняем…' : 'Опубликовать'}
          </button>
        </div>
      </form>
    </>
  );
}
