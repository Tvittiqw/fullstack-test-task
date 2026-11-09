'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Me } from '@/shared/api-types';
import { apiFetch, errorText, hardNavigate } from '@/ui/api-client';
import { ErrorMessage } from '@/ui/primitives/ErrorMessage';

type LoginFormProps = { clearStale: boolean };

export function LoginForm({ clearStale }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (clearStale) void apiFetch<void>('/api/auth/logout', { method: 'POST' });
  }, [clearStale]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const me = await apiFetch<Me>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      hardNavigate(me.landingRoute);
    } catch (err) {
      setError(errorText(err));
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={(event) => void submit(event)}>
      {clearStale && (
        <p className="notice">Your session expired, please log in again.</p>
      )}
      <label className="field">
        <span className="label">Email</span>
        <input
          className="input"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </label>
      <label className="field">
        <span className="label">Password</span>
        <input
          className="input"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <ErrorMessage error={error} />
      <button type="submit" className="btn btn--primary" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
