import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublicUser } from '@/shared/api-types';
import { errorText } from '@/ui/api-client';
import { queryKeys } from '@/ui/query-keys';
import { usersApi } from './users-api';

export type RunAction = (action: () => Promise<PublicUser>) => Promise<boolean>;

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: usersApi.list });
}

export function useManagers() {
  return useQuery({ queryKey: queryKeys.managers, queryFn: usersApi.managers });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.users });
}

export function useCreateUser(onCreated: () => void) {
  const invalidateUsers = useInvalidateUsers();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: async () => {
      await invalidateUsers();
      onCreated();
    },
  });
}

export function useUserMutation() {
  const invalidateUsers = useInvalidateUsers();
  const mutation = useMutation({
    mutationFn: (action: () => Promise<PublicUser>) => action(),
    onSuccess: invalidateUsers,
  });

  const run: RunAction = (action) =>
    mutation.mutateAsync(action).then(
      () => true,
      () => false,
    );

  return {
    run,
    pending: mutation.isPending,
    error: mutation.error ? errorText(mutation.error) : null,
  };
}
