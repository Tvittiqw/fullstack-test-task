import { requirePermission } from '@/server/auth/require-permission';
import { parseBody } from '@/server/http/body';
import { handle } from '@/server/http/handle';
import { json } from '@/server/http/respond';
import { changeStatusSchema } from '@/shared/schemas/users';
import { changeStatus } from '@/server/users/users.service';

export const PATCH = handle<{ id: string }>(async (request, ctx) => {
  const actor = requirePermission(request, 'users.changeStatus');
  const { status } = await parseBody(request, changeStatusSchema);
  const { id } = await ctx.params;
  return json(changeStatus(actor, id, status));
});
