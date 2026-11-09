import { requirePermission } from '@/server/auth/require-permission';
import { parseBody } from '@/server/http/body';
import { handle } from '@/server/http/handle';
import { json } from '@/server/http/respond';
import { updateProfileSchema } from '@/server/users/users.schema';
import { updateProfile } from '@/server/users/users.service';

export const PATCH = handle<{ id: string }>(async (request, ctx) => {
  const actor = requirePermission(request, 'users.editProfile');
  const input = await parseBody(request, updateProfileSchema);
  const { id } = await ctx.params;
  return json(updateProfile(actor, id, input));
});
