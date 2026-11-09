import { getStore, type Session } from '@/server/store/store';

export function createSession(userId: string): Session {
  const session: Session = {
    token: crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
  };
  getStore().sessions.set(session.token, session);
  return session;
}

export function findSession(token: string): Session | undefined {
  return getStore().sessions.get(token);
}

export function deleteSession(token: string): void {
  getStore().sessions.delete(token);
}
