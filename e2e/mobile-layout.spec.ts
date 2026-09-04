import { test, expect, type Page } from '@playwright/test';

// Real-layout checks that jsdom/Vitest can't perform. These run against
// actual rendered pages in a real browser at the configured device
// viewports (see playwright.config.ts) — the only way to catch CSS bugs
// like grid tracks that ignore their container width.

const getHorizontalOverflow = (page: Page) =>
  page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

test.describe('no horizontal overflow', () => {
  test('home page fits the viewport width', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const { scrollWidth, clientWidth } = await getHorizontalOverflow(page);
    expect(scrollWidth, 'page content should not be wider than the viewport').toBeLessThanOrEqual(clientWidth);
  });

  test('event detail page fits the viewport width', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click into whatever the first event day happens to be, then check
    // the detail page, since it renders a differently-shaped layout
    // (no calendar grid) that could overflow for its own reasons.
    await page.locator('.calendar-day.has-event').first().click();
    const eventLink = page.locator('.event-link').first();
    await expect(eventLink).toBeVisible();
    await eventLink.click();
    await page.waitForLoadState('networkidle');

    const { scrollWidth, clientWidth } = await getHorizontalOverflow(page);
    expect(scrollWidth, 'event detail page should not be wider than the viewport').toBeLessThanOrEqual(clientWidth);
  });

  test('theme toggle does not introduce overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /switch to/i }).click();
    await page.waitForTimeout(300); // theme transition

    const { scrollWidth, clientWidth } = await getHorizontalOverflow(page);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

test.describe('tap targets', () => {
  // WCAG 2.5.5 / platform guidance (Apple HIG, Material Design) recommend
  // at least 44x44 CSS px for touch targets. We check height specifically
  // since these are all full-width-ish or text-driven elements where width
  // isn't the constraint.
  const MIN_TAP_TARGET = 44;

  test('calendar day cells are large enough to tap', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const day = page.locator('.calendar-day.has-event').first();
    const box = await day.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(MIN_TAP_TARGET);
  });

  test('back-to-calendar button is large enough to tap', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.calendar-day.has-event').first().click();
    await page.locator('.event-link').first().click();
    await page.waitForLoadState('networkidle');

    const backButton = page.getByRole('button', { name: /back to calendar/i });
    const box = await backButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(MIN_TAP_TARGET);
  });

  test('sign-up link on an event detail page is large enough to tap', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.calendar-day.has-event').first().click();
    await page.locator('.event-link').first().click();
    await page.waitForLoadState('networkidle');

    const signUpLink = page.getByRole('link', { name: /sign up here/i }).first();
    await expect(signUpLink).toBeVisible();
    const box = await signUpLink.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(MIN_TAP_TARGET);
  });
});
