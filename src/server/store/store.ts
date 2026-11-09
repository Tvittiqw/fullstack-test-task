import { generateClients } from './seed/clients.generator';
import { seedUsers } from './seed/users.seed';
import type { Store } from './types';

export type { Session, Store, User } from './types';

const KEY = '__userManagementStore';

type GlobalWithStore = typeof globalThis & { [KEY]?: Store };

function buildStore(): Store {
  return {
    users: new Map(seedUsers().map((user) => [user.id, user])),
    clients: generateClients(),
    sessions: new Map(),
  };
}

export function getStore(): Store {
  const g = globalThis as GlobalWithStore;
  return (g[KEY] ??= buildStore());
}

export function resetStore(): Store {
  const g = globalThis as GlobalWithStore;
  return (g[KEY] = buildStore());
}
