import { useMutation } from '@tanstack/react-query';
import { hardNavigate } from '@/ui/api-client';
import { authApi } from './auth-api';

export function useLogin() {
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (me) => hardNavigate(me.landingRoute),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => hardNavigate('/login'),
  });
}
