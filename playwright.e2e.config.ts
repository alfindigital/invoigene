import { defineConfig, devices } from '@playwright/test';

/**
 * Self-contained Playwright config untuk E2E lokal.
 * Dipisah dari `playwright.config.ts` (yang dipakai harness Lovable)
 * agar bisa dijalankan dengan:
 *   bunx playwright test --config playwright.e2e.config.ts
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
    viewport: { width: 414, height: 896 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Pixel 5'] } },
  ],
});
