import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, useApp, RequestError, type Message } from '../lib/api';
import { Avatar, Empty, LoginRequired, formatDate } from '../components/UI';
export function MessagesPage() {
  const { data } = useApp();
  return (
    <div className="page-shell container">
      <div className="section-header">
        <div>
          <div className="eyebrow">Первый шаг к совместной музыке</div>
          <h1>Сообщения</h1>
        </div>
      </div>
      {data.user ? (
        <Inbox key={data.user.id} userId={data.user.id} />
      ) : (
        <LoginRequired text="Войдите, чтобы общаться с участниками и получать отклики." />
      )}
    </div>
  );
}
function Inbox({ userId }: { userId: string }) {
  const { data, notice, refresh } = useApp();
  const [params, setParams] = useSearchParams();
  const selected = params.get('to') || '';
  const [messages, setMessages] = useState<Message[]>([]),
    [error, setError] = useState(''),
    [text, setText] = useState(''),
    [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let stopped = false;
    const controller = new AbortController();
    const load = async () => {
      try {
        const next = await api<Message[]>('/messages', 'GET', undefined, controller.signal);
        if (!stopped) {
          setMessages((old) => {
            const byId = new Map([...old, ...next].map((m) => [m.id, m]));
            return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          });
          setError('');
        }
      } catch (e) {
        if (!stopped) {
          setError((e as Error).message);
          if (e instanceof RequestError && e.status === 401) void refresh().catch(() => {});
        }
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 4000);
    return () => {
      stopped = true;
      controller.abort();
      clearInterval(timer);
    };
  }, [refresh]);
  const peer = data.profiles.find((p) => p.id === selected && p.ownerId && p.id !== userId);
  const ids = [...new Set(messages.map((m) => (m.sender === userId ? m.receiver : m.sender)))];
  if (peer && !ids.includes(peer.id)) ids.unshift(peer.id);
  const thread = messages.filter((m) => m.sender === selected || m.receiver === selected);
  const latestId = thread.at(-1)?.id;
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [selected, latestId]);
  useEffect(() => {
    setText('');
  }, [selected]);
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!peer) return;
    setBusy(true);
    try {
      const m = await api<Message>('/messages', 'POST', { receiver: peer.id, text });
      setMessages((old) => (old.some((x) => x.id === m.id) ? old : [...old, m]));
      setText('');
      setError('');
    } catch (e) {
      notice((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {error && (
        <p role="alert" className="form-error">
          {error} Повторяем подключение…
        </p>
      )}
      <div className="inbox">
        <aside className="panel-card conversation-list">
          <h2>Диалоги</h2>
          {ids.length ? (
            ids.map((id) => {
              const p = data.profiles.find((p) => p.id === id);
              const last = messages.filter((m) => m.sender === id || m.receiver === id).at(-1);
              return (
                <button
                  key={id}
                  className={`conversation ${selected === id ? 'active' : ''}`}
                  onClick={() => setParams({ to: id })}
                >
                  <Avatar name={p?.name || 'Участник'} photo={p?.photo} />
                  <div>
                    <strong>{p?.name || 'Участник'}</strong>
                    <span>{last?.text || 'Начните знакомство'}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="muted">Откройте профиль участника и нажмите «Написать».</p>
          )}
          <Link className="link-btn" to="/search?real=1">
            Найти участников ↗
          </Link>
        </aside>
        {peer ? (
          <section className="chat-panel">
            <div className="chat-header">
              <Avatar name={peer.name} photo={peer.photo} />
              <Link to={`/profile/${peer.id}`}>
                <strong>{peer.name}</strong>
                <span className="muted">{peer.role}</span>
              </Link>
            </div>
            <div className="chat-messages" role="log" aria-label="Переписка">
              {!thread.length && (
                <p className="muted">Расскажите о своей идее и предложите познакомиться.</p>
              )}
              {thread.map((m) => (
                <div className={`chat-bubble ${m.sender === userId ? 'mine' : ''}`} key={m.id}>
                  <p>{m.text}</p>
                  <time dateTime={m.createdAt}>{formatDate(m.createdAt)}</time>
                </div>
              ))}
              <div ref={end} />
            </div>
            <form className="chat-compose" onSubmit={send}>
              <label className="sr-only" htmlFor="message-text">
                Сообщение
              </label>
              <textarea
                id="message-text"
                required
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ваше сообщение…"
                rows={2}
              />
              <button className="primary-btn" disabled={busy || !text.trim()}>
                {busy ? 'Отправляем…' : 'Отправить'}
              </button>
            </form>
          </section>
        ) : (
          <Empty
            title={selected ? 'Получатель недоступен' : 'Начните разговор'}
            text={
              selected
                ? 'Связаться можно с другим зарегистрированным участником.'
                : 'Выберите диалог или найдите участника для нового проекта.'
            }
            to="/search?real=1"
          />
        )}
      </div>
    </>
  );
}
