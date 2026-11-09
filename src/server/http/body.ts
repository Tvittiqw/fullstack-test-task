import { z, type ZodType } from 'zod';
import { badRequest, unsupportedMediaType } from './errors';

function parse<T>(input: unknown, schema: ZodType<T>, where: string): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw badRequest(
      'validation',
      `Invalid request ${where}`,
      z.flattenError(result.error),
    );
  }
  return result.data;
}

export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.startsWith('application/json')) {
    throw unsupportedMediaType();
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw badRequest('invalid_json', 'Request body is not valid JSON');
  }
  return parse(raw, schema, 'body');
}

export function parseQuery<T>(request: Request, schema: ZodType<T>): T {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return parse(params, schema, 'query');
}
