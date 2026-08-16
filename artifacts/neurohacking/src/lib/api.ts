const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  : `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

export const API_BASE = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

let authTokenProvider: ((forceRefresh?: boolean) => Promise<string | null>) | null = null;

export function setApiAuthTokenProvider(
  provider: ((forceRefresh?: boolean) => Promise<string | null>) | null,
): void {
  authTokenProvider = provider;
}

async function requestHeaders(
  headers: Record<string, string> = {},
  forceRefresh = false,
): Promise<Record<string, string>> {
  const token = await authTokenProvider?.(forceRefresh);
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
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
  const request = async (forceRefresh = false) => fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    headers: await requestHeaders({}, forceRefresh),
  });
  let response = await request();
  if (response.status === 401 && authTokenProvider) response = await request(true);
  return handleResponse(response);
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const request = async (forceRefresh = false) => fetch(`${API_BASE}${path}`, {
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
  /** Устаревшее накопительное поле. */
  totalPotential: number;
  /** Потенциал текущего дня, 0–100. */
  dayPotential: number;
  /** День приложения (YYYY-MM-DD), к которому относится dayPotential. */
  dayPotentialDay: string | null;
  /** Количество закрытых на 100% дней. */
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
}

export async function completeTechnique(input: CompleteTechniqueInput): Promise<CompleteTechniqueResult> {
  return apiPost<CompleteTechniqueResult>('/techniques/complete', input);
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
