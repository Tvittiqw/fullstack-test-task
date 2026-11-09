import { z } from 'zod';
import { USER_STATUSES } from '@/shared/api-types';
import { ROLES } from '@/shared/roles';

const fullName = z.string().trim().min(1).max(120);
const email = z.string().trim().toLowerCase().pipe(z.email());

export const createUserSchema = z.object({
  fullName,
  email,
  password: z.string().min(4).max(72),
  role: z.enum(ROLES),
  managerId: z.string().min(1).nullable().optional(),
});

export const updateProfileSchema = z
  .object({ fullName, email })
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'Provide fullName or email',
  });

export const changeRoleSchema = z.object({ role: z.enum(ROLES) });

export const changeStatusSchema = z.object({ status: z.enum(USER_STATUSES) });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
