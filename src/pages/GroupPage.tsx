import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { api, useApp, type Group } from '../lib/api';
import { Avatar, Cover, Empty, Portfolio, LoginRequired, splitList } from '../components/UI';
import { ImageField, MediaEditor } from '../components/MediaEditor';
export function GroupPage() {
  const { id } = useParams();
  const { data, toggleFavorite, refresh, notice } = useApp();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const g = data.groups.find((p) => p.id === id);
  if (!g)
    return (
      <div className="page-shell container">
        <Empty
          title="Группа не найдена"
          text="Возможно, группа удалена или ссылка устарела."
          to="/search?tab=groups"
        />
      </div>
    );
  const mine = g.ownerId === data.user?.id,
    saved = data.favorites.some((f) => f.kind === 'groups' && f.id === g.id);
  async function remove() {
    setBusy(true);
    try {
      await api(`/groups/${id}`, 'DELETE');
      await refresh();
      navigate('/search?tab=groups');
      notice('Группа удалена');
    } catch (e) {
      notice((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-shell container">
      <Link className="link-btn back-link" to="/search?tab=groups">
        ← К группам
      </Link>
      <article className="detail-hero panel-card">
        <Cover url={g.cover} name={g.name} />
        <div className="detail-header">
          <Avatar name={g.name} large />
          <div>
            <div className="eyebrow">Группа {g.isDemo && '· Пример'}</div>
            <h1>{g.name}</h1>
            <p className="muted">
              {g.city} · {g.genres.join(' / ')}
            </p>
          </div>
          <div className="detail-actions">
            <button className="ghost-btn" onClick={() => void toggleFavorite('groups', g.id)}>
              {saved ? 'В избранном ♥' : 'В избранное ♡'}
            </button>
            {mine ? (
              <Link className="primary-btn" to={`/groups/${g.id}/edit`}>
                Редактировать
              </Link>
            ) : (
              g.ownerId && (
                <Link
                  className="primary-btn"
                  to={data.user ? `/messages?to=${g.ownerId}` : '/auth'}
                >
                  Связаться
                </Link>
              )
            )}
          </div>
        </div>
      </article>
      <div className="content-columns">
        <section className="panel-card">
          <h2>О группе</h2>
          <p className="preserve-text">{g.description || 'Описание ещё не добавлено.'}</p>
          <h3>Сотрудничество</h3>
          <p className="muted">{g.collaboration || 'Обсудите с организатором.'}</p>
          <h3>Репетиции</h3>
          <p className="muted">{g.rehearsalSchedule || 'Расписание обсуждается.'}</p>
        </section>
        <aside className="panel-card">
          <h2>Состав</h2>
          {g.members.length ? (
            g.members.map((m, i) => (
              <p key={i}>
                {m.name} <span className="muted">— {m.role}</span>
              </p>
            ))
          ) : (
            <p className="muted">Состав ещё формируется.</p>
          )}
          <h3>Ищем в команду</h3>
          <div className="tags">
            {g.openPositions.map((v) => (
              <span className="tag" key={v}>
                {v}
              </span>
            ))}
          </div>
          {!g.openPositions.length && <p className="muted">Открытых позиций нет.</p>}
        </aside>
      </div>
      <Portfolio items={g.portfolio} />
      {mine && (
        <div className="delete-zone">
          {deleting ? (
            <>
              <span>Удалить группу? Это действие нельзя отменить.</span>
              <button className="danger-btn" disabled={busy} onClick={() => void remove()}>
                Удалить
              </button>
              <button className="ghost-btn" onClick={() => setDeleting(false)}>
                Отмена
              </button>
            </>
          ) : (
            <button className="link-btn danger" onClick={() => setDeleting(true)}>
              Удалить группу
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export function GroupEditorPage() {
  const { id } = useParams();
  const { data } = useApp();
  const initial = data.groups.find((g) => g.id === id);
  if (!data.user)
    return (
      <div className="page-shell container">
        <LoginRequired />
      </div>
    );
  if (id && (!initial || initial.ownerId !== data.user.id))
    return (
      <div className="page-shell container">
        <Empty
          title="Редактирование недоступно"
          text="Группа не найдена или принадлежит другому участнику."
          to="/search?tab=groups"
        />
      </div>
    );
  const empty: Group = {
    id: '',
    ownerId: data.user.id,
    type: 'group',
    name: '',
    city: 'Алматы',
    genres: [],
    description: '',
    cover: '',
    members: [],
    openPositions: [],
    rehearsalSchedule: '',
    collaboration: '',
    portfolio: [],
  };
  return (
    <div className="page-shell container">
      <GroupEditor key={id || 'new'} initial={initial || empty} />
    </div>
  );
}
function GroupEditor({ initial }: { initial: Group }) {
  const { refresh, notice } = useApp();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const uploadState = (active: boolean) => setUploads((n) => n + (active ? 1 : -1));
  const [error, setError] = useState('');
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploads > 0 || busy) return;
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    const members = String(f.get('members'))
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, ...role] = line.split('—');
        return { name: name.trim(), role: role.join('—').trim() };
      });
    try {
      const result = await api<Group>(
        `/groups${initial.id ? '/' + initial.id : ''}`,
        initial.id ? 'PUT' : 'POST',
        {
          ...draft,
          name: f.get('name'),
          city: f.get('city'),
          description: f.get('description'),
          genres: splitList(String(f.get('genres'))),
          openPositions: splitList(String(f.get('positions'))),
          members,
          rehearsalSchedule: f.get('schedule'),
          collaboration: f.get('collaboration'),
        },
      );
      await refresh();
      notice('Группа сохранена');
      navigate(`/group/${result.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-header">
        <h1>{initial.id ? 'Редактировать группу' : 'Создать группу'}</h1>
        <Link className="link-btn" to={initial.id ? `/group/${initial.id}` : '/search?tab=groups'}>
          Отмена
        </Link>
      </div>
      <form className="panel-card editor" onSubmit={save}>
        <div className="editor-grid">
          <label>
            Название группы
            <input name="name" defaultValue={draft.name} required minLength={2} maxLength={100} />
          </label>
          <label>
            Город
            <input name="city" defaultValue={draft.city} required minLength={2} maxLength={80} />
          </label>
          <label>
            Жанры через запятую
            <input name="genres" defaultValue={draft.genres.join(', ')} maxLength={500} />
          </label>
          <label>
            Кого ищете — через запятую
            <input name="positions" defaultValue={draft.openPositions.join(', ')} maxLength={500} />
          </label>
          <label className="full-width">
            О группе
            <textarea
              name="description"
              defaultValue={draft.description}
              maxLength={3000}
              rows={5}
            />
          </label>
          <label className="full-width">
            Участники — каждый с новой строки
            <span className="field-hint">Формат: Имя — Роль. Например: Алия — Вокал.</span>
            <textarea
              name="members"
              defaultValue={draft.members.map((m) => `${m.name} — ${m.role}`).join('\n')}
              rows={4}
            />
          </label>
          <label>
            Расписание репетиций
            <input name="schedule" defaultValue={draft.rehearsalSchedule} maxLength={300} />
          </label>
          <label>
            Условия сотрудничества
            <input name="collaboration" defaultValue={draft.collaboration} maxLength={300} />
          </label>
          <ImageField
            label="Обложка"
            onUploadState={uploadState}
            value={draft.cover}
            onChange={(cover) => setDraft({ ...draft, cover })}
          />
        </div>
        <MediaEditor
          onUploadState={uploadState}
          items={draft.portfolio}
          onChange={(portfolio) => setDraft({ ...draft, portfolio })}
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button disabled={busy || uploads > 0} className="primary-btn">
            {busy ? 'Сохраняем…' : 'Сохранить группу'}
          </button>
        </div>
      </form>
    </>
  );
}
