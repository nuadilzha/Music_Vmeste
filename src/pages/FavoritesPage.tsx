import { useApp } from '../lib/api';
import { EntityCard, Empty, LoginRequired } from '../components/UI';
export function FavoritesPage() {
  const { data } = useApp();
  const items = [...data.profiles, ...data.groups].filter((p) =>
    data.favorites.some(
      (f) => f.id === p.id && f.kind === (p.type === 'group' ? 'groups' : 'profiles'),
    ),
  );
  return (
    <div className="page-shell container">
      <div className="section-header">
        <div>
          <div className="eyebrow">Ваша подборка</div>
          <h1>Избранное</h1>
        </div>
      </div>
      {!data.user ? (
        <LoginRequired text="Сохраняйте участников и группы, чтобы вернуться к ним позже." />
      ) : items.length ? (
        <div className="card-grid">
          {items.map((i) => (
            <EntityCard key={i.id} item={i} />
          ))}
        </div>
      ) : (
        <Empty
          title="Здесь будут ваши люди"
          text="Нажмите на сердечко в карточке участника или группы."
          to="/search"
        />
      )}
    </div>
  );
}
