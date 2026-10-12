import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, useApp } from '../lib/api';
import { Avatar, formatDate, splitList, Empty } from '../components/UI';
export function CommunityPage() {
  const { data, refresh, notice } = useApp();
  const [text, setText] = useState(''),
    [tags, setTags] = useState(''),
    [filter, setFilter] = useState(''),
    [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState('');
  const posts = data.posts.filter((p) => !filter || p.tags.includes(filter));
  const allTags = [...new Set(data.posts.flatMap((p) => p.tags))];
  async function publish(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/posts', 'POST', { text, tags: splitList(tags) });
      await refresh();
      setText('');
      setTags('');
      notice('Публикация добавлена');
    } catch (e) {
      notice((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    try {
      await api(`/posts/${id}`, 'DELETE');
      await refresh();
      setDeleting('');
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
          <div className="eyebrow">Обменивайтесь идеями</div>
          <h1>Сообщество</h1>
          <p className="muted">Вопросы, знакомства и вдохновение от музыкантов.</p>
        </div>
        <button
          className="ghost-btn"
          onClick={() => refresh().catch((e) => notice(e.message, true))}
        >
          Обновить ленту
        </button>
      </div>
      <div className="community-layout">
        <div className="community-feed">
          {data.user ? (
            <form className="panel-card composer" onSubmit={publish}>
              <label>
                О чём хотите рассказать?
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  maxLength={2000}
                  rows={4}
                  placeholder="Поделитесь идеей, спросите совет или предложите сыграть вместе…"
                />
              </label>
              <label>
                Теги через запятую
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  maxLength={500}
                  placeholder="джем, вокал, Алматы"
                />
              </label>
              <button className="primary-btn" disabled={busy || !text.trim()}>
                {busy ? 'Подождите…' : 'Опубликовать'}
              </button>
            </form>
          ) : (
            <div className="panel-card">
              <p>Присоединитесь, чтобы участвовать в беседе.</p>
              <Link className="primary-btn" to="/auth">
                Войти
              </Link>
            </div>
          )}
          {posts.map((p) => {
            const author = data.profiles.find((u) => u.id === p.ownerId);
            return (
              <article className="panel-card message-card" key={p.id}>
                <div className="message-header">
                  <Avatar name={author?.name || p.author} photo={author?.photo} />
                  <div>
                    {p.ownerId ? (
                      <Link to={`/profile/${p.ownerId}`}>
                        <h3>{author?.name || p.author}</h3>
                      </Link>
                    ) : (
                      <h3>{p.author}</h3>
                    )}
                    <span className="muted">
                      {p.isDemo ? 'Пример публикации' : formatDate(p.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="preserve-text">{p.text}</p>
                <div className="tags">
                  {p.tags.map((t) => (
                    <button className="tag" key={t} onClick={() => setFilter(t)}>
                      #{t}
                    </button>
                  ))}
                </div>
                {p.ownerId === data.user?.id && (
                  <div className="listing-actions">
                    {deleting === p.id ? (
                      <>
                        <span>Удалить публикацию?</span>
                        <button
                          className="danger-btn"
                          disabled={busy}
                          onClick={() => void remove(p.id)}
                        >
                          Удалить
                        </button>
                        <button className="link-btn" onClick={() => setDeleting('')}>
                          Отмена
                        </button>
                      </>
                    ) : (
                      <button className="link-btn danger" onClick={() => setDeleting(p.id)}>
                        Удалить
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
          {!posts.length && (
            <Empty title="Пока тихо" text="Начните новую беседу или выберите другой тег." />
          )}
        </div>
        <aside className="panel-card sidebar-panel">
          <div className="eyebrow">Темы сообщества</div>
          <h2>Что обсуждаем</h2>
          <div className="tags">
            <button className={`tag ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>
              Все темы
            </button>
            {allTags.map((t) => (
              <button
                className={`tag ${filter === t ? 'active' : ''}`}
                key={t}
                onClick={() => setFilter(t)}
              >
                #{t}
              </button>
            ))}
          </div>
          <p className="muted">
            Будьте доброжелательны. Не публикуйте чужие личные данные и уважайте авторство работ.
          </p>
        </aside>
      </div>
    </div>
  );
}
