import type { Client, PublicUser } from '@/shared/api-types';

export type User = PublicUser & { password: string };
export type Session = { token: string; userId: string; createdAt: string };
export type Store = {
  users: Map<string, User>;
  clients: Client[];
  sessions: Map<string, Session>;
};
