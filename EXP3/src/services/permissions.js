// Role -> allowed actions. Matches the experiment brief exactly, plus
// 'manage_users' and 'publish' so Admin Panel / route-level RBAC has
// something real to gate.
export const ROLE_PERMISSIONS = {
  admin: ['create', 'edit', 'delete', 'publish', 'manage_users'],
  editor: ['create', 'edit'],
  viewer: ['read'],
};

export const ROLE_LABELS = {
  admin: 'Admin — full access',
  editor: 'Editor — modify content',
  viewer: 'Viewer — read-only',
};

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
