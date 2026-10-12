import { Link } from 'react-router-dom';
import { ArrowUpRight, Search, Users, Radio, Music2 } from 'lucide-react';
import { useApp } from '../lib/api';
import { EntityCard } from '../components/UI';
export function HomePage() {
  const { data } = useApp();
  return (
    <div className="page-shell container">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> Сообщество для тех, кто создаёт
          </div>
          <h1>
            Ваш звук.
            <br />
            Ваша <em>команда.</em>
          </h1>
          <p>
            Найдите музыкантов, соберите группу и превратите идею в музыку. Всё начинается с первого
            знакомства.
          </p>
          <div className="hero-actions">
            <Link to="/search" className="primary-btn">
              <Search size={18} /> Найти музыкантов
            </Link>
            <Link to={data.user ? '/my-profile' : '/auth?mode=register'} className="ghost-btn">
              Создать профиль <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="quick-stats">
            <div>
              <strong>{data.profiles.filter((p) => !p.isDemo).length}</strong>
              <span>участников</span>
            </div>
            <div>
              <strong>{data.groups.filter((g) => !g.isDemo).length}</strong>
              <span>групп</span>
            </div>
            <div>
              <strong>{data.listings.filter((l) => !l.isDemo).length}</strong>
              <span>объявлений</span>
            </div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="record">
            <div className="record-label">
              <Music2 size={40} />
              <span>PLAY TOGETHER</span>
            </div>
          </div>
          <div className="floating-note">
            <Radio size={18} />
            <div>
              <strong>На одной волне</strong>
              <span>Идеи → знакомства → музыка</span>
            </div>
          </div>
          <span className="art-caption">НАЙДИТЕ СВОЙ РИТМ</span>
        </div>
      </section>
      <section className="section-block">
        <div className="section-header">
          <div>
            <div className="eyebrow">Откройте новое</div>
            <h2>Как звучит ваша музыка?</h2>
          </div>
        </div>
        <div className="tag-grid">
          {['Rock', 'Indie', 'Jazz', 'Electronic', 'Hip-Hop', 'Pop', 'Metal', 'Acoustic'].map(
            (g, i) => (
              <Link key={g} to={`/search?genre=${encodeURIComponent(g)}`} className="genre-chip">
                <span className="muted">0{i + 1}</span>
                {g}
                <ArrowUpRight size={16} />
              </Link>
            ),
          )}
        </div>
      </section>
      <section className="section-block">
        <div className="section-header">
          <div>
            <div className="eyebrow">Люди и их звук</div>
            <h2>Знакомьтесь с участниками</h2>
          </div>
          <Link to="/search" className="link-btn">
            Все профили <ArrowUpRight size={17} />
          </Link>
        </div>
        <p className="muted section-description">
          Карточки с отметкой «Пример» показывают возможности платформы. Связаться можно с
          зарегистрированными участниками.
        </p>
        <div className="card-grid">
          {data.profiles.slice(0, 6).map((p) => (
            <EntityCard key={p.id} item={p} />
          ))}
        </div>
      </section>
      <section className="section-block">
        <div className="section-header">
          <div>
            <div className="eyebrow">Собираем состав</div>
            <h2>Группы и коллективы</h2>
          </div>
          <Link to="/search?tab=groups" className="link-btn">
            Все группы <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="card-grid">
          {data.groups.slice(0, 3).map((g) => (
            <EntityCard key={g.id} item={g} />
          ))}
        </div>
      </section>
      <section className="join-banner">
        <Users size={40} />
        <div>
          <h2>Хорошая музыка начинается с людей</h2>
          <p>Опубликуйте объявление и найдите недостающую часть вашей команды.</p>
        </div>
        <Link to="/listings" className="primary-btn">
          К объявлениям <ArrowUpRight size={17} />
        </Link>
      </section>
    </div>
  );
}
