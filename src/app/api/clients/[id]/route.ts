import { requirePermission } from '@/server/auth/require-permission';
import { getClient } from '@/server/clients/clients.service';
import { handle } from '@/server/http/handle';
import { json } from '@/server/http/respond';

export const GET = handle<{ id: string }>(async (request, ctx) => {
  requirePermission(request, 'content.view');
  const { id } = await ctx.params;
  return json(getClient(id));
});
