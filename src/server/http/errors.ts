import type { Denial } from '@/server/access/user-change';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const unauthenticated = (): HttpError =>
  new HttpError(401, 'unauthenticated', 'Authentication required');

export const forbidden = (
  code = 'forbidden',
  message = 'Your role cannot perform this action',
): HttpError => new HttpError(403, code, message);

export const notFound = (what: string): HttpError =>
  new HttpError(404, 'not_found', `${what} not found`);

export const badRequest = (
  code: string,
  message: string,
  details?: unknown,
): HttpError => new HttpError(400, code, message, details);

export const conflict = (code: string, message: string): HttpError =>
  new HttpError(409, code, message);

const DENIAL_STATUS: Record<Denial['kind'], number> = {
  forbidden: 403,
  conflict: 409,
};

export const fromDenial = (denial: Denial): HttpError =>
  new HttpError(DENIAL_STATUS[denial.kind], denial.code, denial.message);
