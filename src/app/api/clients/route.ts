import { requirePermission } from '@/server/auth/require-permission';
import { listClientsQuerySchema } from '@/server/clients/clients.schema';
import { listClients } from '@/server/clients/clients.service';
import { parseQuery } from '@/server/http/body';
import { handle } from '@/server/http/handle';
import { json } from '@/server/http/respond';

export const GET = handle((request) => {
  requirePermission(request, 'content.view');
  const query = parseQuery(request, listClientsQuerySchema);
  return json(listClients(query));
});
