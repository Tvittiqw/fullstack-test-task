import { z } from 'zod';

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
