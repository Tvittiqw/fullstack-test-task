export const PERMISSIONS = [
  'users.list',
  'users.create',
  'users.editProfile',
  'users.changeRole',
  'users.changeStatus',
  'content.view',
] as const;
export type Permission = (typeof PERMISSIONS)[number];
