import type { Client } from '@/shared/api-types';
import seedrandom from 'seedrandom';

export const CLIENT_COUNT = 1200;
export const CLIENT_SEED = 'user-management-2026';

const DAY_MS = 24 * 60 * 60 * 1000;
const THREE_YEARS_MS = 3 * 365 * DAY_MS;
const CHURN_RATE = 0.3;

const FIRST_NAMES = [
  'Olivia',
  'Liam',
  'Emma',
  'Noah',
  'Ava',
  'Oliver',
  'Sophia',
  'Elijah',
  'Isabella',
  'Lucas',
  'Mia',
  'Mason',
  'Amelia',
  'Ethan',
  'Harper',
  'Logan',
  'Evelyn',
  'James',
  'Abigail',
  'Benjamin',
  'Emily',
  'Jacob',
  'Ella',
  'Michael',
];

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Martinez',
  'Lopez',
  'Wilson',
  'Anderson',
  'Taylor',
  'Thomas',
  'Moore',
  'Martin',
  'Jackson',
  'Thompson',
  'White',
  'Harris',
  'Clark',
  'Lewis',
  'Walker',
  'Young',
];

const COMPANY_WORDS = [
  'Acme',
  'Globex',
  'Initech',
  'Umbrella',
  'Vertex',
  'Nimbus',
  'Quantum',
  'Harbor',
  'Summit',
  'Pioneer',
  'Atlas',
  'Beacon',
  'Cobalt',
  'Delta',
  'Ember',
  'Falcon',
];

const COMPANY_SUFFIXES = [
  'Ltd',
  'Inc',
  'GmbH',
  'LLC',
  'Group',
  'Labs',
  'Systems',
  'Partners',
];

const COUNTRIES = [
  'Ukraine',
  'Poland',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Sweden',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'Japan',
  'Brazil',
];

function pick<T>(rnd: () => number, pool: readonly T[]): T {
  const item = pool[Math.floor(rnd() * pool.length)];
  if (item === undefined) throw new Error('empty pool');
  return item;
}

function compareClients(a: Client, b: Client): number {
  if (a.createdAt !== b.createdAt) return a.createdAt > b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : 1;
}

export function generateClients(
  count: number = CLIENT_COUNT,
  seed: string = CLIENT_SEED,
): Client[] {
  const rnd = seedrandom(seed);
  const now = Math.floor(Date.now() / DAY_MS) * DAY_MS;
  const clients: Client[] = [];
  for (let i = 1; i <= count; i++) {
    const first = pick(rnd, FIRST_NAMES);
    const last = pick(rnd, LAST_NAMES);
    const companyWord = pick(rnd, COMPANY_WORDS);
    const company = `${companyWord} ${pick(rnd, COMPANY_SUFFIXES)}`;
    clients.push({
      id: `c-${String(i).padStart(4, '0')}`,
      name: `${first} ${last}`,
      company,
      email: `${first}.${last}@${companyWord}.example`.toLowerCase(),
      country: pick(rnd, COUNTRIES),
      status: rnd() < CHURN_RATE ? 'churned' : 'active',
      createdAt: new Date(now - rnd() * THREE_YEARS_MS).toISOString(),
    });
  }
  return clients.sort(compareClients);
}
