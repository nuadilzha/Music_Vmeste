import { Link } from 'react-router-dom';
import { Heart, MapPin, ArrowUpRight } from 'lucide-react';
import { useApp, type Profile, type Group } from '../lib/api';
import { getAccentForName, type MediaItem } from '../data/demoData';
import { useState } from 'react';
export const splitList = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
export function Avatar({
  name,
  photo,
  large = false,
}: {
  name: string;
  photo?: string;
  large?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <div
      className={`avatar ${large ? 'avatar-xl' : ''}`}
      style={{ background: getAccentForName(name) }}
    >
      {photo && !broken ? (
        <img src={photo} alt="" onError={() => setBroken(true)} />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}
export function Cover({ url, name }: { url?: string; name: string }) {
  return (
    <div
      className="card-banner"
      style={{
        backgroundImage: url
          ? `linear-gradient(0deg,rgba(15,18,23,.35),transparent),url(${JSON.stringify(url)})`
          : getAccentForName(name),
      }}
    />
  );
}
export function EntityCard({ item }: { item: Profile | Group }) {
  const { data, toggleFavorite } = useApp();
  const group = item.type === 'group',
    kind = group ? 'groups' : 'profiles',
    href = `/${group ? 'group' : 'profile'}/${item.id}`;
  const saved = data.favorites.some((f) => f.kind === kind && f.id === item.id);
  return (
    <article className="profile-card">
      <Link to={href}>
        <Cover url={item.cover} name={item.name} />
        <div className="card-content">
          <div className="profile-main">
            <Avatar name={item.name} photo={item.photo} />
            <div>
              <h3>{item.name}</h3>
              <p className="muted">{'role' in item ? item.role : 'Музыкальная группа'}</p>
            </div>
          </div>
          <div className="meta-row">
            <span>
              <MapPin size={13} /> {item.city}
            </span>
            {item.isDemo && <span className="demo-label">Пример</span>}
          </div>
          <div className="tags">
            {item.genres.slice(0, 3).map((g) => (
              <span className="tag" key={g}>
                {g}
              </span>
            ))}
          </div>
          <p className="card-description">
            {item.description || 'Знакомьтесь с новым участником сообщества.'}
          </p>
        </div>
      </Link>
      <div className="card-actions">
        <Link className="link-btn" to={href}>
          Подробнее <ArrowUpRight size={15} />
        </Link>
        <button
          className={`icon-btn ${saved ? 'saved' : ''}`}
          aria-label={saved ? `Убрать ${item.name} из избранного` : `Сохранить ${item.name}`}
          aria-pressed={saved}
          onClick={() => void toggleFavorite(kind, item.id)}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  );
}
export function Empty({
  title,
  text,
  to,
  action,
}: {
  title: string;
  text: string;
  to?: string;
  action?: string;
}) {
  return (
    <div className="panel-card empty-state">
      <h2>{title}</h2>
      <p className="muted">{text}</p>
      {to && (
        <Link className="primary-btn" to={to}>
          {action || 'К поиску'}
        </Link>
      )}
    </div>
  );
}
export function LoginRequired({
  text = 'Войдите в аккаунт, чтобы продолжить.',
}: {
  text?: string;
}) {
  return (
    <Empty
      title="Присоединяйтесь к сообществу"
      text={text}
      to="/auth"
      action="Войти или зарегистрироваться"
    />
  );
}
export function Portfolio({ items }: { items: MediaItem[] }) {
  return (
    <section className="panel-card">
      <h2>Портфолио</h2>
      {items.length ? (
        <div className="portfolio-grid">
          {items.map((m) => (
            <article className="media-card" key={m.id}>
              <h3>{m.title}</h3>
              {m.type === 'audio' ? (
                <audio controls preload="none" src={m.url} />
              ) : m.type === 'video' ? (
                <video controls preload="metadata" src={m.url} />
              ) : (
                <img loading="lazy" src={m.url} alt={m.title} />
              )}
              <p className="muted">{m.description}</p>
              <a className="link-btn" href={m.url} target="_blank" rel="noopener noreferrer">
                Открыть файл ↗
              </a>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">Работы ещё не добавлены.</p>
      )}
    </section>
  );
}
export function formatDate(value?: string) {
  return value
    ? new Date(value).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
}
