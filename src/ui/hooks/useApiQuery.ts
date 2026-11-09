import { useCallback, useEffect, useState } from 'react';
import { apiFetch, errorText } from '@/ui/api-client';

type QueryResult<T> = {
  path: string;
  version: number;
  data?: T;
  error?: string;
};

export function useApiQuery<T>(path: string) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<QueryResult<T> | null>(null);

  useEffect(() => {
    let stale = false;
    apiFetch<T>(path)
      .then((data) => {
        if (!stale) setResult({ path, version, data });
      })
      .catch((err: unknown) => {
        if (!stale) setResult({ path, version, error: errorText(err) });
      });
    return () => {
      stale = true;
    };
  }, [path, version]);

  const samePath = result?.path === path ? result : null;
  const fresh = samePath?.version === version ? samePath : null;
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data: samePath?.data ?? null,
    error: fresh?.error ?? null,
    loading: fresh === null,
    reload,
  };
}
