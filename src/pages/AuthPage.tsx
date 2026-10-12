import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api, useApp } from '../lib/api';
export function AuthPage() {
  const { data, refresh, notice } = useApp();
  const [params, setParams] = useSearchParams();
  const register = params.get('mode') === 'register';
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (data.user) return <Navigate to="/my-profile" replace />;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api(`/auth/${register ? 'register' : 'login'}`, 'POST', Object.fromEntries(form));
      await refresh();
      notice(register ? 'Добро пожаловать! Заполните профиль.' : 'Вы вошли в аккаунт');
      navigate('/my-profile');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-shell container auth-layout">
      <div className="auth-copy">
        <div className="eyebrow">Больше, чем знакомства</div>
        <h1>
          Музыка звучит
          <br />
          <em>лучше вместе.</em>
        </h1>
        <p className="muted">
          Создайте профиль, поделитесь работами и найдите людей, с которыми хочется играть.
        </p>
        <Link className="link-btn" to="/search">
          Сначала посмотреть участников ↗
        </Link>
      </div>
      <section className="panel-card auth-card">
        <h2>{register ? 'Присоединиться' : 'С возвращением'}</h2>
        <p className="muted">
          {register ? 'Ваше первое знакомство — совсем рядом.' : 'Войдите, чтобы продолжить.'}
        </p>
        <form onSubmit={submit} key={register ? 'register' : 'login'}>
          {register && (
            <label>
              Имя
              <input name="name" required minLength={2} maxLength={80} autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" required maxLength={254} autoComplete="email" />
          </label>
          <label>
            Пароль
            <input
              name="password"
              type="password"
              required
              minLength={10}
              maxLength={128}
              autoComplete={register ? 'new-password' : 'current-password'}
            />
            <span className="field-hint">Не менее 10 символов.</span>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-btn full" disabled={busy}>
            {busy ? 'Подождите…' : register ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>
        <button
          className="link-btn auth-switch"
          onClick={() => {
            setError('');
            setParams(register ? {} : { mode: 'register' });
          }}
        >
          {register ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </section>
    </div>
  );
}
