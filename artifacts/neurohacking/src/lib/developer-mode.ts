export const DEVELOPER_ACCOUNT_EMAIL = 'ttatamax@gmail.com';
export const DEVELOPER_MODE_EVENT = 'neurohacking:developer-mode-change';

const STORAGE_PREFIX = 'neurohacking-developer-mode:';

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? '';
}

function storageKey(email: string) {
  return `${STORAGE_PREFIX}${normalizeEmail(email)}`;
}

export function isDeveloperAccount(email: string | null | undefined) {
  return normalizeEmail(email) === DEVELOPER_ACCOUNT_EMAIL;
}

export function getDeveloperMode(email: string | null | undefined) {
  if (!isDeveloperAccount(email) || typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(storageKey(email!)) === 'enabled';
  } catch {
    return false;
  }
}

export function setDeveloperMode(email: string | null | undefined, enabled: boolean) {
  if (!isDeveloperAccount(email) || typeof window === 'undefined') return;
  try {
    const key = storageKey(email!);
    if (enabled) {
      window.localStorage.setItem(key, 'enabled');
    } else {
      window.localStorage.removeItem(key);
    }
    window.dispatchEvent(new Event(DEVELOPER_MODE_EVENT));
  } catch {
    // Private browsing can block localStorage; the setting remains off.
  }
}

export function hasDeveloperTools(email: string | null | undefined, isSignedIn: boolean) {
  return import.meta.env.DEV || (isSignedIn && getDeveloperMode(email));
}