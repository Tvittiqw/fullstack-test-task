import type { Me } from '@/shared/api-types';
import type { Permission } from '@/shared/permissions';

export type UserAbilities = {
  editProfile: boolean;
  changeRole: boolean;
  changeStatus: boolean;
};

export function userAbilities(me: Me): UserAbilities & { create: boolean } {
  const has = (permission: Permission) => me.permissions.includes(permission);
  return {
    create: has('users.create'),
    editProfile: has('users.editProfile'),
    changeRole: has('users.changeRole'),
    changeStatus: has('users.changeStatus'),
  };
}
