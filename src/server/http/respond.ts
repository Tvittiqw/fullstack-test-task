import type { ErrorEnvelope } from '@/shared/api-types';
import type { HttpError } from './errors';

export function json(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  return Response.json(body, { status, headers });
}

export function noContent(headers?: HeadersInit): Response {
  return new Response(null, { status: 204, headers });
}

export function errorResponse(error: HttpError): Response {
  const envelope: ErrorEnvelope = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    },
  };
  return json(envelope, error.status);
}
