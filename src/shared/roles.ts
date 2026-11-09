export const ROLES = ['IT', 'manager', 'user'] as const;
export type Role = (typeof ROLES)[number];
