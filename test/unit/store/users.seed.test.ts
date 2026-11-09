import { describe, expect, it } from 'vitest';
import { seedUsers } from '@/server/store/seed/users.seed';

const users = seedUsers();
const byId = (id: string) => {
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error(`missing seed user ${id}`);
  return user;
};

describe('seedUsers', () => {
  it('has two active IT accounts', () => {
    const it_ = users.filter((u) => u.role === 'IT' && u.status === 'active');
    expect(it_.map((u) => u.id).sort()).toEqual(['u-ivan', 'u-petro']);
  });

  it('gives Anna exactly four active direct reports', () => {
    expect(byId('u-anna').role).toBe('manager');
    const reports = users.filter(
      (u) => u.managerId === 'u-anna' && u.status === 'active',
    );
    expect(reports.map((u) => u.id).sort()).toEqual([
      'u-andrii',
      'u-kateryna',
      'u-mykola',
      'u-olena',
    ]);
  });

  it('has a manager with no reports (Oksana)', () => {
    expect(byId('u-oksana').role).toBe('manager');
    expect(users.some((u) => u.managerId === 'u-oksana')).toBe(false);
  });

  it('has a deactivated manager (Maksym) with an active report (Dmytro)', () => {
    const maksym = byId('u-maksym');
    expect(maksym.role).toBe('manager');
    expect(maksym.status).toBe('deactivated');
    const dmytro = byId('u-dmytro');
    expect(dmytro.managerId).toBe('u-maksym');
    expect(dmytro.status).toBe('active');
  });

  it('has an already deactivated user (Yurii)', () => {
    expect(byId('u-yurii')).toMatchObject({
      role: 'user',
      status: 'deactivated',
    });
  });

  it('uses unique lower-case emails', () => {
    const emails = users.map((u) => u.email);
    expect(new Set(emails).size).toBe(users.length);
    for (const email of emails) expect(email).toBe(email.toLowerCase());
  });
});
