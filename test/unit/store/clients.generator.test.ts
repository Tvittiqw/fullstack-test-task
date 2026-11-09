import { describe, expect, it } from 'vitest';
import {
  CLIENT_COUNT,
  generateClients,
} from '@/server/store/seed/clients.generator';

describe('generateClients', () => {
  it('returns CLIENT_COUNT clients with unique ids', () => {
    const clients = generateClients();
    expect(clients).toHaveLength(CLIENT_COUNT);
    expect(new Set(clients.map((c) => c.id)).size).toBe(CLIENT_COUNT);
  });

  it('is deterministic for the same seed', () => {
    expect(JSON.stringify(generateClients())).toBe(
      JSON.stringify(generateClients()),
    );
  });

  it('churns a meaningful share', () => {
    const clients = generateClients();
    const churned = clients.filter((c) => c.status === 'churned').length;
    const share = churned / clients.length;
    expect(share).toBeGreaterThan(0.2);
    expect(share).toBeLessThan(0.4);
  });

  it('is sorted by createdAt desc then id asc', () => {
    const clients = generateClients();
    for (let i = 1; i < clients.length; i++) {
      const prev = clients[i - 1];
      const curr = clients[i];
      if (!prev || !curr) throw new Error('missing client');
      const inOrder =
        prev.createdAt > curr.createdAt ||
        (prev.createdAt === curr.createdAt && prev.id < curr.id);
      expect(inOrder).toBe(true);
    }
  });
});
