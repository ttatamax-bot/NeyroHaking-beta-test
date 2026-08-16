const LEGACY_STATE_KEY = "neyro_state";
const DIRECT_EMAIL_KEYS = [
  "neyro_email",
  "neuro_email",
  "email",
  "user_email",
  "userEmail",
];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_PATTERN.test(value.trim());
}

function emailFromStoredValue(raw: string | null): string | null {
  if (!raw) return null;
  if (validEmail(raw)) return raw.trim();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "email" in parsed &&
      validEmail(parsed.email)
    ) {
      return parsed.email.trim();
    }
  } catch {
    // Ignore unrelated localStorage values.
  }
  return null;
}

/**
 * Reads the email saved by the pre-server version of the app.
 * This only initializes an input value; it never starts an auth request.
 */
export function getRememberedEmail(): string {
  try {
    const stateEmail = emailFromStoredValue(localStorage.getItem(LEGACY_STATE_KEY));
    if (stateEmail) return stateEmail;

    for (const key of DIRECT_EMAIL_KEYS) {
      const email = emailFromStoredValue(localStorage.getItem(key));
      if (email) return email;
    }
  } catch {
    // localStorage may be unavailable in a privacy-restricted browser.
  }
  return "";
}