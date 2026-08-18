export const DEV_POTENTIAL_KEY = 'neurohacking-dev-potential';
export const DEV_POTENTIAL_EVENT = 'neurohacking:dev-potential-change';
export const DEV_DAY_CLOSE_EVENT = 'neurohacking:dev-day-close';
export const DEV_CLOSED_DAYS_KEY = 'neurohacking-dev-closed-days';
export const DEV_CLOSED_DAYS_EVENT = 'neurohacking:dev-closed-days-change';
export const DEV_POTENTIAL_DEFAULT = 70;
export const DEV_CLOSED_DAYS_DEFAULT = 1;

function clampPotential(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getDevPotential() {
  if (typeof window === 'undefined') return DEV_POTENTIAL_DEFAULT;
  const stored = Number(window.localStorage.getItem(DEV_POTENTIAL_KEY));
  return Number.isFinite(stored) ? clampPotential(stored) : DEV_POTENTIAL_DEFAULT;
}

export function setDevPotential(value: number) {
  if (typeof window === 'undefined') return;
  const previous = getDevPotential();
  const next = clampPotential(value);
  window.localStorage.setItem(DEV_POTENTIAL_KEY, String(clampPotential(value)));
  window.dispatchEvent(new Event(DEV_POTENTIAL_EVENT));
  if (previous >= 90 && previous < 100 && next === 100) {
    window.dispatchEvent(new Event(DEV_DAY_CLOSE_EVENT));
  }
}

function clampClosedDays(value: number) {
  return Math.min(1000, Math.max(1, Math.round(value)));
}

export function getDevClosedDays() {
  if (typeof window === 'undefined') return DEV_CLOSED_DAYS_DEFAULT;
  const stored = Number(window.localStorage.getItem(DEV_CLOSED_DAYS_KEY));
  return Number.isFinite(stored) ? clampClosedDays(stored) : DEV_CLOSED_DAYS_DEFAULT;
}

export function setDevClosedDays(value: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEV_CLOSED_DAYS_KEY, String(clampClosedDays(value)));
  window.dispatchEvent(new Event(DEV_CLOSED_DAYS_EVENT));
}