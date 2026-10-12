import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { UserProfile, GroupProfile } from '../data/demoData';
export type Profile = UserProfile & { ownerId: string | null; isDemo?: boolean };
export type Group = GroupProfile & { ownerId: string | null; isDemo?: boolean; createdAt?: string };
export type Listing = {
  id: string;
  ownerId: string | null;
  isDemo?: boolean;
  type: string;
  title: string;
  description: string;
  city: string;
  genres: string[];
  role: string;
  format: string;
  payment: string;
  createdAt?: string;
};
export type Post = {
  id: string;
  ownerId: string | null;
  isDemo?: boolean;
  author: string;
  text: string;
  tags: string[];
  createdAt: string;
};
export type Message = {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  createdAt: string;
};
export type User = { id: string; email: string };
export type Snapshot = {
  user: User | null;
  profiles: Profile[];
  groups: Group[];
  listings: Listing[];
  posts: Post[];
  favorites: { kind: string; id: string }[];
};
export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = unknown>(
  path: string,
  method = 'GET',
  data?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: data === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('Нет связи с сервером. Проверьте соединение и повторите попытку.');
  }
  let value: { error?: string };
  try {
    value = await response.json();
  } catch {
    throw new Error('Сервер недоступен. Обновите страницу или повторите попытку позже.');
  }
  if (!response.ok)
    throw new RequestError(value.error || 'Не удалось выполнить запрос.', response.status);
  return value as T;
}
type Context = {
  data: Snapshot;
  refresh: () => Promise<void>;
  notice: (message: string, error?: boolean) => void;
  toggleFavorite: (kind: string, id: string) => Promise<void>;
};
const AppContext = createContext<Context | null>(null);
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppProvider missing');
  return context;
}
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Snapshot | null>(null),
    [error, setError] = useState(''),
    [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const latestRequest = useRef(0);
  const refresh = useCallback(async () => {
    const requestId = ++latestRequest.current;
    const next = await api<Snapshot>('/bootstrap');
    if (requestId === latestRequest.current) {
      setData(next);
      setError('');
    }
  }, []);
  const notice = useCallback(
    (message: string, isError = false) => setToast({ message, error: isError }),
    [],
  );
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const handler = () => {
      refresh().catch(() => {});
    };
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [refresh]);
  const toggleFavorite = async (kind: string, id: string) => {
    if (!data?.user) {
      notice('Войдите, чтобы сохранять избранное.', true);
      return;
    }
    try {
      const saved = !data.favorites.some((f) => f.kind === kind && f.id === id);
      await api('/favorites', 'POST', { kind, id, saved });
      await refresh();
      notice(saved ? 'Добавлено в избранное' : 'Удалено из избранного');
    } catch (e) {
      notice((e as Error).message, true);
    }
  };
  if (!data)
    return (
      <div className="startup">
        <div className="brand-mark">♫</div>
        <h1>Музыка вместе</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button
              className="primary-btn"
              onClick={() => refresh().catch((e) => setError(e.message))}
            >
              Повторить
            </button>
          </>
        ) : (
          <p role="status">Загружаем сообщество…</p>
        )}
      </div>
    );
  return (
    <AppContext.Provider value={{ data, refresh, notice, toggleFavorite }}>
      {children}
      {toast && (
        <div
          className={`toast ${toast.error ? 'error' : ''}`}
          role={toast.error ? 'alert' : 'status'}
        >
          {toast.message}
          <button aria-label="Закрыть уведомление" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}
