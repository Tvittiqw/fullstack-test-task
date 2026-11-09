import { HttpError } from './errors';
import { errorResponse } from './respond';

export type HandlerContext<P = Record<string, never>> = { params: Promise<P> };

type Handler<P> = (
  request: Request,
  ctx: HandlerContext<P>,
) => Promise<Response> | Response;

export function handle<P>(
  fn: Handler<P>,
): (request: Request, ctx: HandlerContext<P>) => Promise<Response> {
  return async (request, ctx) => {
    try {
      return await fn(request, ctx);
    } catch (error) {
      if (error instanceof HttpError) return errorResponse(error);
      console.error(error);
      return errorResponse(
        new HttpError(500, 'internal', 'Internal server error'),
      );
    }
  };
}
