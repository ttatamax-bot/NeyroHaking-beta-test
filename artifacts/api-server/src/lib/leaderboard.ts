export interface LeaderboardRow {
  user_id: number | string;
  nickname: string;
  max_level: number | string;
  first_reached_at: string | Date;
}

export interface LeaderboardEntry {
  position: number;
  userId: number;
  nickname: string;
  maxLevel: number;
  firstReachedAt: string;
}

export interface LeaderboardView {
  champion: LeaderboardEntry | null;
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
  totalPlayers: number;
}

/**
 * Builds the public leaderboard from the already-grouped SQL rows.
 *
 * The full ordered list is intentionally built before slicing the visible
 * entries: users outside the first page still need their real position.
 */
export function buildLeaderboardView(
  rows: LeaderboardRow[],
  userId: number,
  visibleLimit = 100,
): LeaderboardView {
  const ordered = [...rows].sort((a, b) => (
    Number(b.max_level) - Number(a.max_level)
    || new Date(String(a.first_reached_at)).getTime() - new Date(String(b.first_reached_at)).getTime()
    || Number(a.user_id) - Number(b.user_id)
  )).map((row, index) => ({
    position: index + 1,
    userId: Number(row.user_id),
    nickname: String(row.nickname),
    maxLevel: Number(row.max_level),
    firstReachedAt: new Date(String(row.first_reached_at)).toISOString(),
  }));

  return {
    champion: ordered[0] ?? null,
    entries: ordered.slice(0, visibleLimit),
    me: ordered.find((entry) => entry.userId === userId) ?? null,
    totalPlayers: ordered.length,
  };
}