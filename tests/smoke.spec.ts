import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { routes } from './routes';

for (const route of routes) {
  test.describe(route, () => {
    test('renders with one h1, a title, and no console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
      page.on('pageerror', (err) => errors.push(err.message));

      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page).toHaveTitle(/Assess for Success|A4S Sports/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
      expect(errors).toEqual([]);
    });

    test('has no WCAG 2.2 A/AA violations (axe)', async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const summary = results.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
      expect(summary).toEqual([]);
    });

    test('has no horizontal scroll at 320px (400% zoom equivalent)', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

test('404 page renders for unknown URLs', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText("We can't find that page.");
});
