import { defineConfig, devices } from '@playwright/test';

// Uses the locally installed Google Chrome (channel: 'chrome'), so no browser download is needed.
// Run `npm run build` first; the tests serve the built site with `astro preview`.
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: 'list',
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:4321',
    channel: 'chrome',
  },
  webServer: {
    command: 'npx astro preview --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
});
