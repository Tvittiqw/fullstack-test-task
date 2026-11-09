import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { parseBody } from '@/server/http/body';
import { forbidden, HttpError } from '@/server/http/errors';
import { handle } from '@/server/http/handle';

const ctx = { params: Promise.resolve({}) };
const request = (body: string) =>
  new Request('http://localhost/x', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
  });

describe('handle', () => {
  it('maps HttpError to its status and envelope', async () => {
    const route = handle(() => {
      throw forbidden('out_of_scope', 'Not your report');
    });
    const res = await route(request('{}'), ctx);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: { code: 'out_of_scope', message: 'Not your report' },
    });
  });

  it('maps unknown errors to 500 internal', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const route = handle(() => {
      throw new Error('boom');
    });
    const res = await route(request('{}'), ctx);
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: { code: 'internal' } });
  });
});

describe('parseBody', () => {
  const schema = z.object({ name: z.string() });

  it('rejects invalid JSON with 400 invalid_json', async () => {
    await expect(parseBody(request('not json'), schema)).rejects.toMatchObject({
      status: 400,
      code: 'invalid_json',
    } satisfies Partial<HttpError>);
  });

  it('rejects a non-JSON content type with 415', async () => {
    const plain = new Request('http://localhost/x', {
      method: 'POST',
      body: '{"name":"x"}',
      headers: { 'content-type': 'text/plain' },
    });
    await expect(parseBody(plain, schema)).rejects.toMatchObject({
      status: 415,
      code: 'unsupported_media_type',
    });
  });

  it('rejects schema violations with 400 validation and details', async () => {
    await expect(
      parseBody(request('{"name":1}'), schema),
    ).rejects.toMatchObject({
      status: 400,
      code: 'validation',
      details: expect.anything() as unknown,
    });
  });
});
