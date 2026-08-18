export type ArticleAccessSnapshot = {
  activityLog: Array<{ type: string }>;
  goals: unknown[];
};

const ARTICLE_UNLOCK_INSTRUCTIONS: Record<string, string> = {
  A2: "Выполни медитацию чтобы открыть",
  A3: "Поставь цели чтобы открыть",
  A4: "Выполни визуализацию чтобы открыть",
};

export function getArticleUnlockInstruction(articleId: string): string | null {
  return ARTICLE_UNLOCK_INSTRUCTIONS[articleId] ?? null;
}

export function isArticleRequirementSatisfied(
  articleId: string,
  snapshot: ArticleAccessSnapshot,
): boolean {
  if (articleId === "A2") {
    return snapshot.activityLog.some((entry) => entry.type === "meditation");
  }
  if (articleId === "A3") {
    return snapshot.goals.length > 0;
  }
  if (articleId === "A4") {
    return snapshot.activityLog.some((entry) => entry.type === "visualization");
  }
  return false;
}