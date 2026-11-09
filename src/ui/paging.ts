export const PAGE_LIMIT = 25;

export function parsePage(value: string | number | null | undefined): number {
  const page = Number(value ?? 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
