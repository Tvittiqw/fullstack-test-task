import { z } from 'zod';
import { USER_STATUSES } from '@/shared/api-types';
import { ROLES } from '@/shared/roles';

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, 'Full name is required')
  .max(120, 'Full name is too long');
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email'));
export const passwordSchema = z
  .string()
  .min(4, 'Password must be at least 4 characters');

export const profileFieldsSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
});

export const createUserSchema = profileFieldsSchema.extend({
  password: passwordSchema,
  role: z.enum(ROLES),
  managerId: z.string().min(1).nullable().optional(),
});

export const updateProfileSchema = profileFieldsSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'Provide fullName or email',
  });

export const changeRoleSchema = z.object({ role: z.enum(ROLES) });

export const changeStatusSchema = z.object({ status: z.enum(USER_STATUSES) });

export type ProfileFields = z.infer<typeof profileFieldsSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
