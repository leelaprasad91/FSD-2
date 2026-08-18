// Role -> permitted actions, straight from the "Role-Based Access Control" section.
export const permissions = {
  admin: ["create", "edit", "delete", "read"],
  editor: ["create", "edit", "read"],
  viewer: ["read"],
};

/** Returns true if the given role is allowed to perform the given action. */
export function can(role, action) {
  if (!role || !permissions[role]) return false;
  return permissions[role].includes(action);
}

// Which routes each role is allowed to enter. Used by ProtectedRoute.
export const routeAccess = {
  "/dashboard": ["admin", "editor", "viewer"],
  "/admin": ["admin"],
  "/editor": ["admin", "editor"],
};
