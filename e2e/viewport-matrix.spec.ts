import { test, expect, Page } from '@playwright/test';

/**
 * E2E matrix: jalankan alur navigasi inti pada beberapa ukuran viewport
 * di dalam satu project — memastikan `aria-current` tab & FAB konsisten
 * di mobile, tablet, dan desktop tanpa bergantung pada konfigurasi project Playwright.
 */

const VIEWPORTS = [
  { label: 'mobile-small', width: 360, height: 800 },
  { label: 'mobile-iphone', width: 390, height: 844 },
  { label: 'tablet-portrait', width: 768, height: 1024 },
  { label: 'tablet-landscape', width: 1024, height: 768 },
  { label: 'desktop-hd', width: 1366, height: 768 },
  { label: 'desktop-fhd', width: 1920, height: 1080 },
] as const;

const tab = (page: Page, name: 'Beranda' | 'Riwayat' | 'Item' | 'Setelan') =>
  page.getByRole('button', { name, exact: true });
const fab = (page: Page) => page.getByRole('button', { name: 'Buat nota baru' });

async function expectOnlyActive(page: Page, activeName: string) {
  const actives = page.locator('button[aria-current="page"]');
  await expect(actives).toHaveCount(1);
  await expect(actives.first()).toHaveAccessibleName(activeName);
}

for (const vp of VIEWPORTS) {
  test.describe(`viewport ${vp.label} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        try { window.localStorage.clear(); } catch {}
      });
      await page.goto('/');
      await expect(tab(page, 'Beranda')).toBeVisible();
    });

    test('Beranda aktif saat load awal', async ({ page }) => {
      await expect(tab(page, 'Beranda')).toHaveAttribute('aria-current', 'page');
      await expectOnlyActive(page, 'Beranda');
    });

    test('siklus tab → FAB → tab menjaga aria-current tunggal', async ({ page }) => {
      await tab(page, 'Item').click();
      await expectOnlyActive(page, 'Item');

      await tab(page, 'Setelan').click();
      await expectOnlyActive(page, 'Setelan');

      await fab(page).click();
      await expect(fab(page)).toHaveAttribute('aria-current', 'page');
      await expectOnlyActive(page, 'Buat nota baru');

      await tab(page, 'Riwayat').click();
      await expect(fab(page)).not.toHaveAttribute('aria-current', 'page');
      await expectOnlyActive(page, 'Riwayat');

      await tab(page, 'Beranda').click();
      await expectOnlyActive(page, 'Beranda');
    });

    test('validasi form gagal: FAB tetap aktif lintas viewport', async ({ page }) => {
      await fab(page).click();
      await expect(page.getByRole('heading', { name: 'Nota Baru' })).toBeVisible();
      await page.getByRole('button', { name: /^Simpan$/ }).click();
      await expect(page.getByText(/Tambahkan minimal 1 item/i)).toBeVisible();
      await expect(fab(page)).toHaveAttribute('aria-current', 'page');
      await expectOnlyActive(page, 'Buat nota baru');
    });

    test('klik tab cepat berulang hanya menyisakan satu aktif', async ({ page }) => {
      const order: Array<'Beranda' | 'Riwayat' | 'Item' | 'Setelan'> = [
        'Riwayat', 'Item', 'Setelan', 'Beranda', 'Item', 'Riwayat', 'Setelan', 'Beranda',
      ];
      for (const name of order) {
        await tab(page, name).click({ delay: 5 });
      }
      await expectOnlyActive(page, order[order.length - 1]);
    });
  });
}
