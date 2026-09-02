/**
 * Authentication and 6-Month Cookie Persistence Utility for EquityHub
 */

const AUTH_COOKIE_NAME = 'equityhub_auth_user_id';
const AUTH_STORAGE_KEY = 'equityhub_auth_session';
const SIX_MONTHS_DAYS = 180;
const SIX_MONTHS_SECONDS = SIX_MONTHS_DAYS * 24 * 60 * 60; // 15,552,000 seconds
const SIX_MONTHS_MS = SIX_MONTHS_DAYS * 24 * 60 * 60 * 1000;

export interface AuthSession {
  userId: string;
  email?: string;
  loggedInAt: number;
  expiresAt: number;
}

/**
 * Read cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Set a cookie with a 6-month expiration (180 days)
 */
export function setCookie(name: string, value: string, maxAgeSeconds: number = SIX_MONTHS_SECONDS): void {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + maxAgeSeconds * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0; path=/; SameSite=Lax`;
}

/**
 * Retrieve the current authenticated user ID from 6-month Cookie or LocalStorage
 */
export function getStoredAuthUserId(): string | null {
  try {
    // 1. Check Cookie first
    const cookieUserId = getCookie(AUTH_COOKIE_NAME);
    if (cookieUserId && cookieUserId.trim() !== '') {
      return cookieUserId;
    }

    // 2. Fallback to LocalStorage session check with 6-month expiry validation
    if (typeof localStorage !== 'undefined') {
      const sessionRaw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (sessionRaw) {
        const session: AuthSession = JSON.parse(sessionRaw);
        if (session && session.userId && session.expiresAt > Date.now()) {
          // Re-sync cookie in case it was cleared
          setCookie(AUTH_COOKIE_NAME, session.userId, SIX_MONTHS_SECONDS);
          return session.userId;
        } else {
          // Expired
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    }
  } catch (err) {
    console.error('Error reading auth session:', err);
  }
  return null;
}

/**
 * Save user authentication session into Cookies and LocalStorage for 6 months
 */
export function setStoredAuthSession(userId: string, email?: string): void {
  try {
    // Write 6-month cookie
    setCookie(AUTH_COOKIE_NAME, userId, SIX_MONTHS_SECONDS);

    // Write backup storage with timestamp
    if (typeof localStorage !== 'undefined') {
      const session: AuthSession = {
        userId,
        email,
        loggedInAt: Date.now(),
        expiresAt: Date.now() + SIX_MONTHS_MS,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Error storing auth session:', err);
  }
}

/**
 * Clear authentication session (Sign Out)
 */
export function clearStoredAuthSession(): void {
  try {
    deleteCookie(AUTH_COOKIE_NAME);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Error clearing auth session:', err);
  }
}
