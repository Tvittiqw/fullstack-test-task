import { describe, expect, it } from 'vitest';
import { getStore, resetStore } from '@/server/store/store';

describe('getStore', () => {
  it('returns the same instance twice', () => {
    expect(getStore()).toBe(getStore());
  });
});

describe('resetStore', () => {
  it('returns a fresh seeded store and getStore then returns it', () => {
    const before = getStore();
    const seededSize = before.users.size;
    before.users.delete('u-nazar');
    before.sessions.set('t', {
      token: 't',
      userId: 'u-ivan',
      createdAt: new Date().toISOString(),
    });

    const fresh = resetStore();

    expect(fresh).not.toBe(before);
    expect(fresh.users.size).toBe(seededSize);
    expect(fresh.users.has('u-nazar')).toBe(true);
    expect(fresh.sessions.size).toBe(0);
    expect(fresh.clients.length).toBeGreaterThanOrEqual(1000);
    expect(getStore()).toBe(fresh);
  });
});
