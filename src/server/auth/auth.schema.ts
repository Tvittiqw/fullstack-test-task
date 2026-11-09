import { z } from 'zod';
import { emailSchema } from '@/server/users/users.schema';

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
