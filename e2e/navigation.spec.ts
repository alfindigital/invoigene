import { test, expect, Page } from '@playwright/test';

/**
 * E2E: alur Beranda → Buat Nota Baru → Edit → Riwayat
 * Memverifikasi sinkronisasi `aria-current="page"` pada tab BottomNav & FAB.
 */

const tab = (page: Page, name: 'Beranda' | 'Riwayat' | 'Item' | 'Setelan') =>
  page.getByRole('button', { name, exact: true });

const fab = (page: Page) => page.getByRole('button', { name: 'Buat nota baru' });

async function expectOnlyActive(page: Page, activeName: string) {
  const actives = page.locator('button[aria-current="page"]');
  await expect(actives).toHaveCount(1);
  await expect(actives.first()).toHaveAccessibleName(activeName);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { window.localStorage.clear(); } catch { /* ignore */ }
  });
  await page.goto('/');
  // Pastikan app sudah mount
  await expect(tab(page, 'Beranda')).toBeVisible();
});

test('Beranda aktif saat pertama dibuka', async ({ page }) => {
  await expect(tab(page, 'Beranda')).toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Beranda');
});

test('alur lengkap: Beranda → Buat Nota → Simpan → Riwayat → Edit → Riwayat', async ({ page }) => {
  // 1. Klik FAB → halaman Nota Baru, FAB aktif
  await fab(page).click();
  await expect(page.getByRole('heading', { name: 'Nota Baru' })).toBeVisible();
  await expect(fab(page)).toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Buat nota baru');

  // 2. Isi pembeli & tambahkan satu item manual
  await page.getByPlaceholder('Pak Budi...').fill('Pak Budi');
  await page.getByPlaceholder('Nama item...').fill('Kopi Susu');
  await page.getByPlaceholder('0').first().fill('15000');
  await page.getByRole('button', { name: 'Tambah item manual' }).click();

  // 3. Simpan → otomatis pindah ke Riwayat
  await page.getByRole('button', { name: /^Simpan$/ }).click();
  await expect(page.getByRole('heading', { name: /Riwayat/i })).toBeVisible();
  await expect(tab(page, 'Riwayat')).toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Riwayat');

  // 4. Klik Edit pada nota yang baru disimpan → kembali ke form, FAB aktif
  await page.locator('button[aria-label^="Edit "]').first().click();
  await expect(page.getByRole('heading', { name: 'Edit Nota' })).toBeVisible();
  await expect(fab(page)).toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Buat nota baru');

  // 5. Simpan perubahan → kembali ke Riwayat, tab Riwayat aktif
  await page.getByRole('button', { name: /^Simpan$/ }).click();
  await expect(page.getByRole('heading', { name: /Riwayat/i })).toBeVisible();
  await expect(tab(page, 'Riwayat')).toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Riwayat');

  // 6. Kembali ke Beranda
  await tab(page, 'Beranda').click();
  await expect(tab(page, 'Beranda')).toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Beranda');
});

test('navigasi antar tab selalu sinkron (Item & Setelan)', async ({ page }) => {
  await tab(page, 'Item').click();
  await expect(tab(page, 'Item')).toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Item');

  await tab(page, 'Setelan').click();
  await expect(tab(page, 'Setelan')).toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Setelan');

  await tab(page, 'Beranda').click();
  await expect(tab(page, 'Beranda')).toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Beranda');
});

test('klik FAB lalu Riwayat memindahkan status aktif dengan benar', async ({ page }) => {
  await fab(page).click();
  await expect(fab(page)).toHaveAttribute('aria-current', 'page');

  await tab(page, 'Riwayat').click();
  await expect(tab(page, 'Riwayat')).toHaveAttribute('aria-current', 'page');
  await expect(fab(page)).not.toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Riwayat');
});
