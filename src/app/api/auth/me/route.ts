import { toMe } from '@/server/auth/me';
import { requireSession } from '@/server/auth/require-session';
import { handle } from '@/server/http/handle';
import { json } from '@/server/http/respond';

export const GET = handle((request) => json(toMe(requireSession(request))));
