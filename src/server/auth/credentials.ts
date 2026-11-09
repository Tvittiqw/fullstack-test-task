import type { PublicUser } from '@/shared/api-types';
import { getStore, type User } from '@/server/store/store';

export function toPublic({ password: _password, ...user }: User): PublicUser {
  return user;
}

export function authenticate(
  email: string,
  password: string,
): PublicUser | null {
  const wanted = email.toLowerCase();
  for (const user of getStore().users.values()) {
    if (user.email !== wanted) continue;
    if (user.status !== 'active' || user.password !== password) return null;
    return toPublic(user);
  }
  return null;
}
