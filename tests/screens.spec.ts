import { test } from '@playwright/test';
import { routes } from './routes';

// Full-page screenshots for visual review: SHOTS=1 npx playwright test screens
test.skip(!process.env.SHOTS, 'Set SHOTS=1 to capture screenshots');

const widths = [375, 768, 1440];

for (const route of routes) {
  for (const width of widths) {
    test(`${route} @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      // Scroll through the page so lazy-loaded images are in the screenshot.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      const name = route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '_');
      await page.screenshot({ path: `test-results/shots/${name}-${width}.png`, fullPage: true });
    });
  }
}
