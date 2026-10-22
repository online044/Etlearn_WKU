/**
 * Master Administrator Authorization Configuration for EthioLearn Pro
 * Only ezrat2116@gmail.com is authorized to view and access the Admin Dashboard.
 */

export const ADMIN_EMAIL = 'ezrat2116@gmail.com';

/**
 * Checks if the given email address matches the designated platform administrator.
 */
export function isAdministratorEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Checks if a user profile or account object belongs to the designated platform administrator.
 */
export function isAdministratorProfile(profile?: { email?: string | null; user_role?: string; userRole?: string } | null): boolean {
  if (!profile) return false;
  if (isAdministratorEmail(profile.email)) return true;
  return false;
}
