import { notFound } from 'next/navigation';
import { HttpError } from './http/errors';

export function loadOrNotFound<T>(load: () => T): T {
  try {
    return load();
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }
}
