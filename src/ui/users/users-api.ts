import type { PublicUser, UserStatus } from '@/shared/api-types';
import type { Role } from '@/shared/roles';
import { apiFetch } from '@/ui/api-client';

export type CreateUserBody = {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  managerId: string | null;
};

export type ProfileBody = { fullName?: string; email?: string };

type UserList = { items: PublicUser[] };

function patch(path: string, body: unknown) {
  return apiFetch<PublicUser>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export const usersApi = {
  list: () => apiFetch<UserList>('/api/users'),
  managers: () => apiFetch<UserList>('/api/users/managers'),
  create: (body: CreateUserBody) =>
    apiFetch<PublicUser>('/api/users', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateProfile: (id: string, body: ProfileBody) =>
    patch(`/api/users/${id}`, body),
  changeRole: (id: string, role: Role) =>
    patch(`/api/users/${id}/role`, { role }),
  changeStatus: (id: string, status: UserStatus) =>
    patch(`/api/users/${id}/status`, { status }),
};

type CreateUserFormValues = Omit<CreateUserBody, 'managerId'> & {
  managerId: string;
};

export function toCreateUserBody(values: CreateUserFormValues): CreateUserBody {
  return { ...values, managerId: values.managerId || null };
}
