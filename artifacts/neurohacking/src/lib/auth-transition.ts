const authTransitionKey = "neuro_auth_transition_started_at";
const authTransitionTtlMs = 20_000;

export function markAuthTransition(): void {
  try {
    sessionStorage.setItem(authTransitionKey, String(Date.now()));
  } catch {
    // Session storage can be blocked by strict privacy settings.
  }
}

export function clearAuthTransition(): void {
  try {
    sessionStorage.removeItem(authTransitionKey);
  } catch {
    // Ignore storage restrictions; Clerk remains the source of truth.
  }
}

export function getPendingAuthTransition(): boolean {
  try {
    const startedAt = Number(sessionStorage.getItem(authTransitionKey));
    if (!Number.isFinite(startedAt) || Date.now() - startedAt > authTransitionTtlMs) {
      sessionStorage.removeItem(authTransitionKey);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getAuthTransitionTimeoutMs(): number {
  try {
    const startedAt = Number(sessionStorage.getItem(authTransitionKey));
    if (!Number.isFinite(startedAt)) return 0;
    return Math.max(0, authTransitionTtlMs - (Date.now() - startedAt));
  } catch {
    return 0;
  }
}