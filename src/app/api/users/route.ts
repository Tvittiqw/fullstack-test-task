import { requirePermission } from '@/server/auth/require-permission';
import { parseBody } from '@/server/http/body';
import { handle } from '@/server/http/handle';
import { json } from '@/server/http/respond';
import { createUserSchema } from '@/shared/schemas/users';
import { createUser, listVisibleUsers } from '@/server/users/users.service';

export const GET = handle((request) => {
  const actor = requirePermission(request, 'users.list');
  return json({ items: listVisibleUsers(actor) });
});

export const POST = handle(async (request) => {
  requirePermission(request, 'users.create');
  const input = await parseBody(request, createUserSchema);
  return json(createUser(input), 201);
});
