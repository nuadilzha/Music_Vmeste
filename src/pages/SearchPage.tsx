import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../lib/api';
import { genresList, rolesList } from '../data/demoData';
import { EntityCard, Empty } from '../components/UI';
export function SearchPage() {
  const { data } = useApp();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(false);
  const tab = ['profiles', 'groups', 'specialists'].includes(params.get('tab') || '')
    ? params.get('tab')!
    : 'profiles';
  const q = params.get('q') || '',
    city = params.get('city') || '',
    genre = params.get('genre') || '',
    role = params.get('role') || '',
    onlyReal = params.get('real') === '1';
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'tab') next.delete('role');
    setParams(next, { replace: key === 'q' });
  };
  const source =
    tab === 'groups'
      ? data.groups
      : data.profiles.filter((p) => p.type === (tab === 'specialists' ? 'specialist' : 'musician'));
  const cities = [...new Set(source.map((p) => p.city))].sort();
  const items = source.filter(
    (p) =>
      (!onlyReal || !p.isDemo) &&
      (!city || p.city === city) &&
      (!genre || p.genres.includes(genre)) &&
      (!role || ('role' in p && p.role === role)) &&
      `${p.name} ${p.city} ${p.description} ${p.genres.join(' ')} ${'role' in p ? p.role : p.openPositions.join(' ')}`
        .toLowerCase()
        .includes(q.trim().toLowerCase()),
  );
  return (
    <div className="page-shell container">
      <div className="section-header">
        <div>
          <div className="eyebrow">На одной волне</div>
          <h1>Найдите свою команду</h1>
          <p className="muted">Музыканты, группы и специалисты для вашей следующей идеи.</p>
        </div>
        {tab === 'groups' && (
          <Link className="primary-btn" to="/groups/new">
            Создать группу
          </Link>
        )}
      </div>
      <section className="panel-card">
        <div className="search-row">
          <div className="searchbar">
            <Search size={19} />
            <input
              aria-label="Поиск"
              placeholder="Имя, роль, город или направление…"
              value={q}
              onChange={(e) => update('q', e.target.value)}
            />
          </div>
          <button
            className="ghost-btn"
            aria-expanded={filters}
            onClick={() => setFilters(!filters)}
          >
            <SlidersHorizontal size={17} /> Фильтры
          </button>
        </div>
        <div className="tabs" role="group" aria-label="Категории поиска">
          {[
            ['profiles', 'Музыканты'],
            ['groups', 'Группы'],
            ['specialists', 'Специалисты'],
          ].map(([value, title]) => (
            <button
              key={value}
              className={`tab ${tab === value ? 'active' : ''}`}
              aria-pressed={tab === value}
              onClick={() => update('tab', value)}
            >
              {title}
            </button>
          ))}
        </div>
        {(filters || city || genre || role || onlyReal) && (
          <div className="filter-grid">
            <label>
              Город
              <select value={city} onChange={(e) => update('city', e.target.value)}>
                <option value="">Все города</option>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Жанр
              <select value={genre} onChange={(e) => update('genre', e.target.value)}>
                <option value="">Все жанры</option>
                {genresList.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            {tab !== 'groups' && (
              <label>
                Роль
                <select value={role} onChange={(e) => update('role', e.target.value)}>
                  <option value="">Все роли</option>
                  {rolesList.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={onlyReal}
                onChange={(e) => update('real', e.target.checked ? '1' : '')}
              />{' '}
              Только реальные участники
            </label>
            <button className="link-btn" onClick={() => setParams({ tab })}>
              Сбросить фильтры
            </button>
          </div>
        )}
      </section>
      <div className="results-toolbar">
        <span className="muted">Найдено: {items.length}</span>
      </div>
      {items.length ? (
        <div className="card-grid">
          {items.map((p) => (
            <EntityCard key={p.id} item={p} />
          ))}
        </div>
      ) : (
        <Empty
          title="Пока никого не нашли"
          text="Попробуйте изменить запрос или сбросить фильтры."
        />
      )}
    </div>
  );
}
