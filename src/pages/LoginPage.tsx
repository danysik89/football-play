import { useState, type FormEvent } from 'react';
import { auth, authErrorMessage, isDemo } from '../lib/backend';
import { useSession } from '../lib/session';
import { Button, Field } from '../components/ui';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

export function LoginPage() {
  const { register } = useSession();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);

  const run = async (kind: 'email' | 'google', fn: () => Promise<void>) => {
    setError('');
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(null);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && !name.trim()) return setError('Вкажіть ім’я');
    run('email', () => (mode === 'login' ? auth.signInWithEmail(email, password) : register(name, email, password)));
  };

  return (
    <div className="pitch-bg flex min-h-dvh flex-col px-4 pt-[max(3rem,env(safe-area-inset-top))] pb-8">
      <div className="mx-auto w-full max-w-sm flex-1">
        <div className="mb-10">
          <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-accent text-on-accent">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="9.5" />
              <path d="M12 7.5l3.5 2.6-1.3 4.2H9.8L8.5 10.1z" fill="currentColor" />
              <path d="M12 2.5v5M21.4 9.5l-5.9.6M18 20l-3.8-5.7M6 20l3.8-5.7M2.6 9.5l5.9.6" />
            </svg>
          </div>
          <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight">
            Граємо
            <br />
            <span className="text-accent">у футбол</span>
          </h1>
          <p className="mt-3 text-muted">Записуйся на тренування, збирай очки, піднімайся в рейтингу сезону.</p>
        </div>

        <div role="tablist" className="mb-6 grid grid-cols-2 rounded-2xl bg-surface p-1">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError('');
              }}
              className={`h-11 cursor-pointer rounded-xl font-bold transition ${mode === m ? 'bg-surface-2 text-fg' : 'text-muted'}`}
            >
              {m === 'login' ? 'Вхід' : 'Реєстрація'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === 'register' && (
            <Field label="Ім’я та прізвище" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Андрій Шевченко" />
          )}
          <Field label="Пошта" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required />
          <Field
            label="Пароль"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={mode === 'register' ? 'Мінімум 6 символів' : undefined}
            required
          />
          {error && (
            <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={busy === 'email'} disabled={!!busy}>
            {mode === 'login' ? 'Увійти' : 'Створити акаунт'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-sm text-muted">
          <span className="h-px flex-1 bg-line" />
          або
          <span className="h-px flex-1 bg-line" />
        </div>

        <Button variant="secondary" className="w-full" loading={busy === 'google'} disabled={!!busy} onClick={() => run('google', auth.signInWithGoogle)}>
          <GoogleIcon /> Продовжити з Google
        </Button>

        {isDemo && (
          <p className="mt-6 text-center text-xs text-muted">
            Демо-режим: Firebase не налаштовано, акаунти зберігаються локально в браузері.
          </p>
        )}
      </div>
    </div>
  );
}
