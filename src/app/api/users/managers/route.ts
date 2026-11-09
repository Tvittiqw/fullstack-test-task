import { requirePermission } from '@/server/auth/require-permission';
import { handle } from '@/server/http/handle';
import { json } from '@/server/http/respond';
import { managerCandidates } from '@/server/users/users.service';

export const GET = handle((request) => {
  requirePermission(request, 'users.create');
  return json({ items: managerCandidates() });
});
