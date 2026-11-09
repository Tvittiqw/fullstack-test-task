import type { PublicUser } from '@/shared/api-types';
import type { Role } from '@/shared/roles';

export function user(
  overrides: Partial<PublicUser> & { id: string; role: Role },
): PublicUser {
  return {
    fullName: overrides.id,
    email: `${overrides.id}@example.com`,
    status: 'active',
    managerId: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}
