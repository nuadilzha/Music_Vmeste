import { Link, useParams } from 'react-router-dom';
import { Heart, MessageSquare, MapPin } from 'lucide-react';
import { useApp } from '../lib/api';
import { Avatar, Cover, Empty, Portfolio } from '../components/UI';
export function ProfilePage() {
  const { id } = useParams();
  const { data, toggleFavorite } = useApp();
  const p = data.profiles.find((p) => p.id === id);
  if (!p)
    return (
      <div className="page-shell container">
        <Empty
          title="Профиль не найден"
          text="Возможно, участник удалил профиль или ссылка устарела."
          to="/search"
        />
      </div>
    );
  const mine = p.ownerId === data.user?.id,
    saved = data.favorites.some((f) => f.kind === 'profiles' && f.id === p.id);
  return (
    <div className="page-shell container">
      <Link
        className="link-btn back-link"
        to={`/search${p.type === 'specialist' ? '?tab=specialists' : ''}`}
      >
        ← К участникам
      </Link>
      <article className="detail-hero panel-card">
        <Cover url={p.cover} name={p.name} />
        <div className="detail-header">
          <Avatar name={p.name} photo={p.photo} large />
          <div>
            <div className="eyebrow">
              {p.role} {p.isDemo && '· Пример профиля'}
            </div>
            <h1>{p.name}</h1>
            <div className="meta-row">
              <span>
                <MapPin size={15} />
                {p.city}
              </span>
              <span>{p.experience}</span>
            </div>
          </div>
          <div className="detail-actions">
            {mine ? (
              <Link className="primary-btn" to="/my-profile">
                Редактировать
              </Link>
            ) : (
              <>
                <button
                  className={`ghost-btn ${saved ? 'saved' : ''}`}
                  onClick={() => void toggleFavorite('profiles', p.id)}
                >
                  <Heart size={16} />
                  {saved ? 'Сохранён' : 'В избранное'}
                </button>
                {p.ownerId ? (
                  <Link
                    className="primary-btn"
                    to={data.user ? `/messages?to=${p.ownerId}` : '/auth'}
                  >
                    <MessageSquare size={16} />
                    Написать
                  </Link>
                ) : (
                  <span className="demo-label">Демо: связь недоступна</span>
                )}
              </>
            )}
          </div>
        </div>
      </article>
      <div className="content-columns">
        <section className="panel-card">
          <h2>О себе</h2>
          <p className="preserve-text">{p.description || 'Участник ещё не рассказал о себе.'}</p>
          <div className="tags">
            {p.genres.map((g) => (
              <span className="tag" key={g}>
                {g}
              </span>
            ))}
          </div>
          <h3>Навыки и инструменты</h3>
          <p className="muted">{p.instruments?.join(', ') || 'Не указаны'}</p>
        </section>
        <aside className="panel-card">
          <div className="eyebrow">Сотрудничество</div>
          <h3>{p.openToProjects ? 'Открыт к проектам' : 'Сейчас занят'}</h3>
          <p className="muted">{p.availability || 'Обсудите удобное время в переписке.'}</p>
          {p.links?.map((url, i) => (
            <a
              className="external-link"
              key={`${url}-${i}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {new URL(url).hostname} ↗
            </a>
          ))}
        </aside>
      </div>
      <Portfolio items={p.portfolio} />
    </div>
  );
}
