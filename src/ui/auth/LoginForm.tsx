'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { loginSchema, type LoginInput } from '@/shared/schemas/auth';
import { errorText } from '@/ui/api-client';
import { Button } from '@/ui/primitives/Button';
import { ErrorMessage } from '@/ui/primitives/ErrorMessage';
import { TextField } from '@/ui/primitives/TextField';
import { authApi } from './auth-api';
import { useLogin } from './auth-queries';

type LoginFormProps = { clearStale: boolean };

export function LoginForm({ clearStale }: LoginFormProps) {
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const { errors } = form.formState;
  const login = useLogin();

  useEffect(() => {
    if (clearStale) void authApi.logout();
  }, [clearStale]);

  return (
    <form
      className="form"
      noValidate
      onSubmit={(event) =>
        void form.handleSubmit((input) => login.mutate(input))(event)
      }
    >
      {clearStale && (
        <p className="notice">Your session expired, please log in again.</p>
      )}
      <TextField
        label="Email"
        type="email"
        autoComplete="username"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <ErrorMessage error={login.error ? errorText(login.error) : null} />
      <Button
        type="submit"
        variant="primary"
        pending={login.isPending || login.isSuccess}
        pendingLabel="Signing in…"
      >
        Sign in
      </Button>
    </form>
  );
}
