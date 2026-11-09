import type { Me } from '@/shared/api-types';
import type { LoginInput } from '@/shared/schemas/auth';
import { apiFetch } from '@/ui/api-client';

export const authApi = {
  login: (input: LoginInput) =>
    apiFetch<Me>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  logout: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
};
