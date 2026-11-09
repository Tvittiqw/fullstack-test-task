import type { PublicUser } from '@/shared/api-types';
import { notFound } from '@/server/http/errors';
import { getStore, type User } from '@/server/store/store';

export function toPublic({ password: _password, ...user }: User): PublicUser {
  return user;
}

export function listUsers(): PublicUser[] {
  return [...getStore().users.values()].map(toPublic);
}

export function findUser(id: string): PublicUser | undefined {
  const user = getStore().users.get(id);
  return user && toPublic(user);
}

export function findUserByEmail(email: string): PublicUser | undefined {
  const wanted = email.toLowerCase();
  for (const user of getStore().users.values()) {
    if (user.email === wanted) return toPublic(user);
  }
  return undefined;
}

export function insertUser(user: User): PublicUser {
  getStore().users.set(user.id, user);
  return toPublic(user);
}

export function updateUser(
  id: string,
  patch: Partial<Omit<User, 'id' | 'createdAt'>>,
): PublicUser {
  const users = getStore().users;
  const current = users.get(id);
  if (!current) throw notFound('User');
  const updated = { ...current, ...patch };
  users.set(id, updated);
  return toPublic(updated);
}
