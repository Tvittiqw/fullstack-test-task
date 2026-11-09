import { requirePermission } from '@/server/auth/require-permission';
import { parseBody } from '@/server/http/body';
import { handle } from '@/server/http/handle';
import { json } from '@/server/http/respond';
import { changeRoleSchema } from '@/shared/schemas/users';
import { changeRole } from '@/server/users/users.service';

export const PATCH = handle<{ id: string }>(async (request, ctx) => {
  const actor = requirePermission(request, 'users.changeRole');
  const { role } = await parseBody(request, changeRoleSchema);
  const { id } = await ctx.params;
  return json(changeRole(actor, id, role));
});
