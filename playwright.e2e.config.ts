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
    // Mobile (Android)
    { name: 'mobile-pixel5', use: { ...devices['Pixel 5'] } },
    // Mobile (iOS) — viewport lebih kecil & DPR berbeda
    { name: 'mobile-iphone12', use: { ...devices['iPhone 12'] } },
    // Tablet
    { name: 'tablet-ipad', use: { ...devices['iPad (gen 7)'] } },
    // Desktop
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'desktop-large',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
  ],
});
