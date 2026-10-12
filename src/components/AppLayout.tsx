import { Link, useLocation } from 'react-router-dom';
import { Heart, MessageSquare, Music4, UserRound, Menu, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { api, useApp } from '../lib/api';
export function AppLayout({ children }: { children: ReactNode }) {
  const { data, refresh, notice } = useApp();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  const links = [
    { to: '/search', text: 'Музыканты', tab: 'profiles' },
    { to: '/search?tab=groups', text: 'Группы', tab: 'groups' },
    { to: '/search?tab=specialists', text: 'Специалисты', tab: 'specialists' },
    { to: '/listings', text: 'Объявления' },
    { to: '/community', text: 'Сообщество' },
  ];
  const active = (to: string, tab?: string) =>
    tab
      ? location.pathname === '/search' &&
        (new URLSearchParams(location.search).get('tab') || 'profiles') === tab
      : location.pathname === to;
  async function logout() {
    try {
      await api('/auth/logout', 'POST', {});
      await refresh();
      notice('Вы вышли из аккаунта');
    } catch (e) {
      notice((e as Error).message, true);
    }
  }
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <Music4 size={20} />
            </span>
            <span>
              музыка<span className="brand-accent">вместе</span>
            </span>
          </Link>
          <nav
            id="main-nav"
            className={`nav ${open ? 'open' : ''}`}
            aria-label="Основная навигация"
          >
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={active(l.to, l.tab) ? 'active' : ''}
                aria-current={active(l.to, l.tab) ? 'page' : undefined}
              >
                {l.text}
              </Link>
            ))}
            {data.user && (
              <button className="mobile-logout" onClick={() => void logout()}>
                Выйти
              </button>
            )}
          </nav>
          <div className="topbar-actions">
            <Link to="/favorites" className="icon-btn" aria-label="Избранное">
              <Heart size={19} />
            </Link>
            <Link to="/messages" className="icon-btn" aria-label="Сообщения">
              <MessageSquare size={19} />
            </Link>
            <Link
              to={data.user ? '/my-profile' : '/auth'}
              aria-label={data.user ? 'Мой профиль' : 'Войти'}
              className="primary-btn small"
            >
              <UserRound size={16} />
              <span>{data.user ? 'Мой профиль' : 'Войти'}</span>
            </Link>
            <button
              className="menu-btn icon-btn"
              aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={open}
              aria-controls="main-nav"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="container footer">
        <Link to="/" className="brand">
          музыкавместе
        </Link>
        <span>Место, где начинается ваша музыка.</span>
        {data.user && (
          <button className="link-btn" onClick={() => void logout()}>
            Выйти из аккаунта
          </button>
        )}
      </footer>
    </div>
  );
}
