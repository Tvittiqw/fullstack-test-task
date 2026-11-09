import type { Role } from '@/shared/roles';
import type { UserStatus } from '@/shared/api-types';
import type { User } from '../types';

type SeedRow = {
  name: string;
  fullName: string;
  role: Role;
  status?: UserStatus;
  managerId?: string;
  createdAt: string;
};

const ROSTER: SeedRow[] = [
  {
    name: 'ivan',
    fullName: 'Ivan Shevchenko',
    role: 'IT',
    createdAt: '2024-01-08T09:00:00.000Z',
  },
  {
    name: 'petro',
    fullName: 'Petro Bondarenko',
    role: 'IT',
    createdAt: '2024-01-09T09:00:00.000Z',
  },
  {
    name: 'anna',
    fullName: 'Anna Kovalenko',
    role: 'manager',
    createdAt: '2024-02-12T09:00:00.000Z',
  },
  {
    name: 'oksana',
    fullName: 'Oksana Tkachenko',
    role: 'manager',
    createdAt: '2024-02-19T09:00:00.000Z',
  },
  {
    name: 'maksym',
    fullName: 'Maksym Kravchenko',
    role: 'manager',
    status: 'deactivated',
    createdAt: '2024-03-04T09:00:00.000Z',
  },
  {
    name: 'olena',
    fullName: 'Olena Boyko',
    role: 'user',
    managerId: 'u-anna',
    createdAt: '2024-04-01T09:00:00.000Z',
  },
  {
    name: 'kateryna',
    fullName: 'Kateryna Melnyk',
    role: 'user',
    managerId: 'u-anna',
    createdAt: '2024-04-15T09:00:00.000Z',
  },
  {
    name: 'andrii',
    fullName: 'Andrii Polishchuk',
    role: 'user',
    managerId: 'u-anna',
    createdAt: '2024-05-06T09:00:00.000Z',
  },
  {
    name: 'mykola',
    fullName: 'Mykola Lysenko',
    role: 'user',
    managerId: 'u-anna',
    createdAt: '2024-06-10T09:00:00.000Z',
  },
  {
    name: 'dmytro',
    fullName: 'Dmytro Rudenko',
    role: 'user',
    managerId: 'u-maksym',
    createdAt: '2024-07-22T09:00:00.000Z',
  },
  {
    name: 'yurii',
    fullName: 'Yurii Savchenko',
    role: 'user',
    status: 'deactivated',
    createdAt: '2024-09-02T09:00:00.000Z',
  },
  {
    name: 'nazar',
    fullName: 'Nazar Marchenko',
    role: 'user',
    createdAt: '2025-01-13T09:00:00.000Z',
  },
];

export function seedUsers(): User[] {
  return ROSTER.map((row) => ({
    id: `u-${row.name}`,
    fullName: row.fullName,
    email: `${row.name}@example.com`,
    password: `${row.name}123`,
    role: row.role,
    status: row.status ?? 'active',
    managerId: row.managerId ?? null,
    createdAt: row.createdAt,
  }));
}
