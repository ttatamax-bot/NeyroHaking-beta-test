// Vite always provides import.meta.env in the browser build. Keeping the
// lookup defensive also lets the state-recovery assertions import this module
// directly in Node without changing the runtime API base path.
const viteEnv = import.meta.env ?? {};
const basePath = typeof viteEnv.BASE_URL === 'string' ? viteEnv.BASE_URL : '';
const BASE_URL = typeof viteEnv.VITE_API_BASE_URL === 'string' && viteEnv.VITE_API_BASE_URL
  ? viteEnv.VITE_API_BASE_URL.replace(/\/$/, '')
  : `${basePath.replace(/\/$/, '')}/api`;

export const API_BASE = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

let authTokenProvider: ((forceRefresh?: boolean) => Promise<string | null>) | null = null;
const AUTH_TOKEN_TIMEOUT_MS = 2500;
const API_REQUEST_TIMEOUT_MS = 12_000;

export function setApiAuthTokenProvider(
  provider: ((forceRefresh?: boolean) => Promise<string | null>) | null,
): void {
  authTokenProvider = provider;
}

async function requestHeaders(
  headers: Record<string, string> = {},
  forceRefresh = false,
): Promise<Record<string, string>> {
  let token: string | null = null;
  if (authTokenProvider) {
    try {
      token = await Promise.race([
        authTokenProvider(forceRefresh),
        new Promise<null>((resolve) => {
          window.setTimeout(() => resolve(null), AUTH_TOKEN_TIMEOUT_MS);
        }),
      ]);
    } catch {
      // Same-origin Clerk cookies can authenticate the API even when the
      // browser's token resource is temporarily unavailable.
      token = null;
    }
  }
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(504, 'Request timed out', { error: 'request_timeout' });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
  ) {
    super(`API ${status}: ${statusText}`);
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, data);
  }
  return response.json();
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const request = async (forceRefresh = false) => fetchWithTimeout(`${API_BASE}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    headers: await requestHeaders({}, forceRefresh),
  });
  let response = await request();
  if (response.status === 401 && authTokenProvider) {
    response = await request(true);
    // On a hard reload Clerk can finish restoring its session just after the
    // forced token refresh. Give that short-lived race one final retry before
    // surfacing an authentication error to the app.
    if (response.status === 401) {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      response = await request(true);
    }
  }
  return handleResponse(response);
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const request = async (forceRefresh = false) => fetchWithTimeout(`${API_BASE}${path}`, {
    method: 'POST',
    headers: await requestHeaders({ 'Content-Type': 'application/json' }, forceRefresh),
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(body),
  });
  let response = await request();
  if (response.status === 401 && authTokenProvider) response = await request(true);
  return handleResponse(response);
}

export interface ServerUser {
  id: number;
  clerkId: string;
  email: string | null;
}

export interface ServerProfile {
  id: number;
  userId: number;
  nickname: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  totalKeys: number;
  totalPotential: number;
  /** Potential accumulated during the current app day (0–N). */
  dayPotential: number;
  /** YYYY-MM-DD key of the day dayPotential belongs to. */
  dayPotentialDay: string | null;
  /** Number of days closed at 100 % potential. */
  closedDays: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServerCompletion {
  id: number;
  techniqueId: string;
  appDay: string;
  completedAt: string;
  keysAwarded: number;
  potentialAwarded: number;
  metadata: Record<string, unknown>;
}

export interface ServerMe {
  user: ServerUser;
  state: Record<string, unknown> | null;
  profile: ServerProfile | null;
  completedTechniques?: ServerCompletion[];
}

export async function getServerState(): Promise<ServerMe> {
  return apiGet<ServerMe>('/me');
}

export async function saveServerState(state: object): Promise<{ state: Record<string, unknown>; profile?: ServerProfile }> {
  return apiPost<{ state: Record<string, unknown>; profile?: ServerProfile }>('/me/state', state);
}

export interface ArticlePurchaseResult {
  articleId: string;
  alreadyUnlocked: boolean;
  keys: number;
  state: Record<string, unknown>;
  profile: ServerProfile;
}

export async function purchaseArticle(articleId: string): Promise<ArticlePurchaseResult> {
  return apiPost<ArticlePurchaseResult>(`/me/articles/${encodeURIComponent(articleId)}/purchase`, {});
}

export type MemoryMode = 'reverse' | 'matrix' | 'symbols';

export interface MemoryPurchaseResult {
  mode: MemoryMode;
  alreadyPurchased: boolean;
  keys: number;
  memory: {
    purchasedModes: MemoryMode[];
    bestLevels: Partial<Record<MemoryMode, number>>;
    rewardDay: string | null;
  };
  state: Record<string, unknown>;
  profile: ServerProfile;
}

export async function purchaseMemoryMode(mode: MemoryMode): Promise<MemoryPurchaseResult> {
  return apiPost<MemoryPurchaseResult>(`/me/memory/purchase?mode=${encodeURIComponent(mode)}`, { mode });
}

export type ConcentrationMode = 'signals' | 'tracking' | 'search';

export interface ConcentrationPurchaseResult {
  mode: ConcentrationMode;
  alreadyPurchased: boolean;
  keys: number;
  concentration: {
    purchasedModes: ConcentrationMode[];
    bestLevels: Partial<Record<ConcentrationMode, number>>;
    rewardDay: string | null;
  };
  state: Record<string, unknown>;
  profile: ServerProfile;
}

export async function purchaseConcentrationMode(mode: ConcentrationMode): Promise<ConcentrationPurchaseResult> {
  return apiPost<ConcentrationPurchaseResult>(`/me/concentration/purchase?mode=${encodeURIComponent(mode)}`, { mode });
}

export async function completeArticleRead(articleId: string): Promise<{
  articleId: string;
  alreadyRead: boolean;
  potential: number;
  state: Record<string, unknown>;
  profile: ServerProfile;
}> {
  return apiPost(`/me/articles/${encodeURIComponent(articleId)}/read`, {});
}

export async function getServerProfile(): Promise<ServerProfile> {
  return apiGet<ServerProfile>('/me/profile');
}

export interface UpdateProfileInput {
  nickname?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export async function updateServerProfile(input: UpdateProfileInput): Promise<ServerProfile> {
  return apiPost<ServerProfile>('/me/profile', input);
}

export interface LeaderboardEntry {
  position: number;
  userId: number;
  nickname: string;
  maxLevel: number;
  firstReachedAt: string;
}

export interface LeaderboardResult {
  mode: MemoryMode | ConcentrationMode;
  champion: LeaderboardEntry | null;
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
  totalPlayers: number;
}

export async function getLeaderboard(mode: MemoryMode | ConcentrationMode): Promise<LeaderboardResult> {
  return apiGet<LeaderboardResult>(`/leaderboards/${encodeURIComponent(mode)}`);
}

export interface CompletedTechnique {
  id: number;
  userId: number;
  techniqueId: string;
  completedAt: string;
  keysAwarded: number;
  potentialAwarded: number;
  metadata: Record<string, unknown>;
}

export async function getServerHistory(limit = 50): Promise<CompletedTechnique[]> {
  return apiGet<CompletedTechnique[]>(`/me/history?limit=${limit}`);
}

export interface CompleteTechniqueInput {
  techniqueId: string;
  clientDate: string;
  idempotencyKey: string;
  timezoneOffsetMinutes?: number;
  metadata: Record<string, unknown>;
}

export interface CompleteTechniqueResult {
  keys: number;
  potential: number;
  completedTechniqueId: number;
  newStreak: number;
  longestStreak: number;
  totalKeys: number;
  totalPotential: number;
  dayClosed: boolean;
  closedDays: number;
  alreadyCompleted?: boolean;
  /** The original response was lost and this result came from a safe retry or /me recovery. */
  recovered?: boolean;
}

export async function completeTechnique(input: CompleteTechniqueInput): Promise<CompleteTechniqueResult> {
  return apiPost<CompleteTechniqueResult>('/techniques/complete', input);
}

export interface ReferralPreview {
  code: string;
  amount: number;
  available: boolean;
}

export interface ReferralCreateResult {
  code: string;
  amount: number;
  createdAt: string;
}

export interface ReferralClaimResult {
  code: string;
  amount: number;
  totalKeys: number;
  profile: ServerProfile;
}

export async function getReferral(code: string): Promise<ReferralPreview> {
  return apiGet<ReferralPreview>(`/referrals/${encodeURIComponent(code)}`);
}

export async function createReferral(amount = 1000): Promise<ReferralCreateResult> {
  return apiPost<ReferralCreateResult>('/referrals', { amount });
}

export async function claimReferral(code: string): Promise<ReferralClaimResult> {
  return apiPost<ReferralClaimResult>(`/referrals/${encodeURIComponent(code)}/claim`, {});
}

export interface LegacyMigrationInput {
  migrationKey: string;
  state: Record<string, unknown>;
}

export interface LegacyMigrationResult {
  status: 'imported' | 'imported_with_warnings' | 'already_imported';
  audit: {
    keysExpected: number | null;
    keysFromHistory: number;
    potentialExpected: number | null;
    potentialFromHistory: number;
    warnings: string[];
  };
  profile: ServerProfile;
  state: Record<string, unknown>;
}

export async function migrateLegacyState(input: LegacyMigrationInput): Promise<LegacyMigrationResult> {
  return apiPost<LegacyMigrationResult>('/me/migrate-legacy', input);
}

export interface SurveyAnswers {
  q1Age: string;
  q2Occupations: string[];
  q2Other?: string;
  q3GoalStatus: string;
  q4Goal?: string;
  q5CurrentTime?: string;
  q6DesiredTime?: string;
  q7FailureSituation: string;
  q8AfterWeeks: string;
  q9Distraction: string;
  q10AfterPostponing: string;
  q11StablePeriod: string;
  q12WhatChanged: string;
  q13OneChange: string;
  q14FutureAbility: string;
  q15Tried: string;
  q16WhatHelped: string;
  q17SpentMoney: string;
  q18HelpfulPurchase: string;
  q20Telegram?: string;
}

export async function getSurveyStatus(): Promise<{ completed: boolean; reward: number }> {
  return apiGet('/survey/status');
}
export async function submitSurvey(answers: SurveyAnswers): Promise<{
  completed: boolean;
  alreadyCompleted: boolean;
  reward: number;
  totalKeys: number;
}> {
  return apiPost('/survey/submit', answers);
}
