import type { PublicUser } from '@/shared/api-types';
import { findCredentials, toPublic } from '@/server/users/users.repository';

export function authenticate(
  email: string,
  password: string,
): PublicUser | null {
  const user = findCredentials(email);
  if (!user || user.status !== 'active' || user.password !== password) {
    return null;
  }
  return toPublic(user);
}
