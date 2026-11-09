import type { PublicUser } from '@/shared/api-types';
import { getStore } from '@/server/store/store';
import { toPublic } from '@/server/users/users.repository';

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
