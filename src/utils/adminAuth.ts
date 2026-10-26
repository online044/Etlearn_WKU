/**
 * Master Administrator Authorization Configuration for EthioLearn Pro
 * Authorized administrators: ezrat2116@gmail.com & abrehamalemayehu05@gmail.com
 */

export const ADMIN_EMAIL = 'ezrat2116@gmail.com';

export const ADMIN_EMAILS: string[] = [
  'ezrat2116@gmail.com',
  'abrehamalemayehu05@gmail.com'
];

/**
 * Checks if the given email address matches a designated platform administrator.
 */
export function isAdministratorEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(e => e.toLowerCase() === clean);
}

/**
 * Checks if a user profile or account object belongs to a designated platform administrator.
 */
export function isAdministratorProfile(profile?: { email?: string | null; user_role?: string; userRole?: string } | null): boolean {
  if (!profile) return false;
  if (isAdministratorEmail(profile.email)) return true;
  if (profile.userRole === 'admin' || profile.userRole === 'super_admin' || profile.user_role === 'admin' || profile.user_role === 'super_admin') {
    return true;
  }
  return false;
}
