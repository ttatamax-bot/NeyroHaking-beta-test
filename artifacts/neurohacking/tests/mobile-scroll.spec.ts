import { test, expect, type Page } from "@playwright/test";

const routes = [
  { name: "Home", path: "/", container: "[data-testid=home-scroll-container]" },
  { name: "Academy", path: "/academy", container: "[data-testid=academy-scroll-container]" },
  { name: "Memory", path: "/technique/memory", container: "[data-testid=practice-card-stack]" },
  { name: "Concentration", path: "/technique/concentration", container: "[data-testid=practice-card-stack]" },
];

async function assertMobileScrollContract(page: Page, route: (typeof routes)[number]) {
  await page.goto(route.path);
  const container = page.locator(route.container);
  await expect(container).toBeVisible();

  const metrics = await container.evaluate((element) => {
    const node = element as HTMLElement;
    node.scrollTo({ top: node.scrollHeight, left: 0, behavior: "instant" });
    const cards = node.querySelectorAll(
      "[data-testid^='card-memory-mode-'], [data-testid^='card-concentration-mode-'], .article-stack-card, .news-stack-card",
    );
    const lastCard = cards[cards.length - 1] as HTMLElement | null;
    const navigation = document.querySelector("[data-testid=bottom-navigation]") as HTMLElement | null;
    const nodeRect = node.getBoundingClientRect();
    const lastRect = lastCard?.getBoundingClientRect() ?? null;
    const navigationRect = navigation?.getBoundingClientRect() ?? null;

    return {
      route: location.pathname,
      canScrollVertically: node.scrollHeight > node.clientHeight,
      scrollTop: node.scrollTop,
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight,
      overflowX: getComputedStyle(node).overflowX,
      touchAction: getComputedStyle(node).touchAction,
      lastCardBottom: lastRect?.bottom ?? null,
      scrollViewportBottom: nodeRect.bottom,
      navigationTop: navigationRect?.top ?? null,
      lastCardCount: node.querySelectorAll(
        "[data-testid^='card-memory-mode-'], [data-testid^='card-concentration-mode-'], .article-stack-card, .news-stack-card",
      ).length,
    };
  });

  expect(metrics.route).toBe(route.path);
  expect(metrics.canScrollVertically, `${route.name} must own vertical scrolling: ${JSON.stringify(metrics)}`).toBeTruthy();
  expect(metrics.scrollTop, `${route.name} must reach the end of its scroll container`).toBeGreaterThan(0);
  expect(["hidden", "clip"], `${route.name} must not allow horizontal scrolling`).toContain(metrics.overflowX);
  expect(metrics.touchAction, `${route.name} must reserve touch gestures for vertical scrolling`).toBe("pan-y");
  expect(metrics.lastCardCount, `${route.name} must expose cards to check`).toBeGreaterThan(0);
  expect(metrics.lastCardBottom, `${route.name} must expose the last card`).not.toBeNull();

  if (metrics.lastCardBottom !== null && metrics.navigationTop !== null) {
    expect(
      metrics.lastCardBottom,
      `${route.name} last card must clear the fixed bottom navigation`,
    ).toBeLessThanOrEqual(metrics.navigationTop - 8);
  }
}

test.describe("mobile scroll contract", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "neyro_state",
        JSON.stringify({ userState: "active", onboardingComplete: true }),
      );
    });
  });

  test("keeps the final cards reachable at 390px", async ({ page }) => {
    for (const route of routes) {
      await assertMobileScrollContract(page, route);
    }
  });

  test("also fits the 402px release width", async ({ page }) => {
    await page.setViewportSize({ width: 402, height: 874 });
    for (const route of routes) {
      await assertMobileScrollContract(page, route);
    }
  });
});