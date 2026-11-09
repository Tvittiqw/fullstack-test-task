export const queryKeys = {
  users: ['users'] as const,
  managers: ['users', 'managers'] as const,
  clients: (page: number) => ['clients', page] as const,
};
