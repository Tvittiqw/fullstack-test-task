import type { Permission } from './permissions';
import type { Role } from './roles';

export const USER_STATUSES = ['active', 'deactivated'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  managerId: string | null;
  createdAt: string;
};

export const CLIENT_STATUSES = ['active', 'churned'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  country: string;
  status: ClientStatus;
  createdAt: string;
};

export type Me = {
  user: PublicUser;
  permissions: Permission[];
  landingRoute: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type ErrorEnvelope = {
  error: { code: string; message: string; details?: unknown };
};
