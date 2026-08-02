// =====================================================
// Role Constants
// =====================================================

export const ROLES = {
  ADMIN: "ADMIN",
  ORGANIZER: "ORGANIZER",
  MODERATOR: "MODERATOR",
  MEMBER: "MEMBER",
  GUEST: "GUEST",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role hierarchy levels (higher = more permissions)
 */
export const ROLE_HIERARCHY: Record<RoleName, number> = {
  ADMIN: 5,
  ORGANIZER: 4,
  MODERATOR: 3,
  MEMBER: 2,
  GUEST: 1,
};

/**
 * Check if a role has sufficient level for an action
 */
export function hasMinimumRole(
  userRole: RoleName,
  requiredRole: RoleName
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get the highest role from a list of roles
 */
export function getHighestRole(roles: RoleName[]): RoleName | null {
  if (roles.length === 0) return null;

  return roles.reduce((highest: RoleName, current: RoleName) =>
    ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest
  );
}
