import type { Me, PublicUser } from '@/shared/api-types';
import { permissionsOf, policyFor } from '@/server/access/policy';

export function toMe(user: PublicUser): Me {
  return {
    user,
    permissions: permissionsOf(user.role),
    landingRoute: policyFor(user.role).landingRoute,
  };
}
