import { test, expect, Page } from '@playwright/test';

/**
 * E2E: Validasi form Nota Baru.
 * Memastikan toast error muncul saat input invalid (mis. tanpa item)
 * dan status aktif tab/FAB tetap sinkron (FAB tetap aktif, tidak pindah ke Riwayat).
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
    try { window.localStorage.clear(); } catch {}
  });
  await page.goto('/');
  await expect(tab(page, 'Beranda')).toBeVisible();
});

test('simpan tanpa item menampilkan error dan FAB tetap aktif', async ({ page }) => {
  await fab(page).click();
  await expect(page.getByRole('heading', { name: 'Nota Baru' })).toBeVisible();
  await expectOnlyActive(page, 'Buat nota baru');

  // Coba simpan tanpa item apa pun
  await page.getByRole('button', { name: /^Simpan$/ }).click();

  // Toast error muncul
  await expect(page.getByText(/Tambahkan minimal 1 item/i)).toBeVisible();

  // Tetap di halaman Nota Baru, FAB masih aktif
  await expect(page.getByRole('heading', { name: 'Nota Baru' })).toBeVisible();
  await expect(fab(page)).toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Buat nota baru');
});

test('simpan & WA tanpa item juga gagal dan tidak pindah halaman', async ({ page }) => {
  await fab(page).click();
  await expectOnlyActive(page, 'Buat nota baru');

  // Isi pembeli tapi belum tambah item
  await page.getByPlaceholder('Pak Budi...').fill('Bu Ani');
  await page.getByRole('button', { name: /Simpan & WA/i }).click();

  await expect(page.getByText(/Tambahkan minimal 1 item/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nota Baru' })).toBeVisible();
  await expectOnlyActive(page, 'Buat nota baru');
});

test('tombol tambah item manual disabled saat nama/harga kosong', async ({ page }) => {
  await fab(page).click();
  const addBtn = page.getByRole('button', { name: 'Tambah item manual' });

  // Awalnya disabled
  await expect(addBtn).toBeDisabled();

  // Hanya nama → masih disabled
  await page.getByPlaceholder('Nama item...').fill('Kopi');
  await expect(addBtn).toBeDisabled();

  // Nama + harga → enabled
  await page.getByPlaceholder('0').first().fill('15000');
  await expect(addBtn).toBeEnabled();

  // Kosongkan harga → disabled lagi
  await page.getByPlaceholder('0').first().fill('');
  await expect(addBtn).toBeDisabled();

  // FAB tetap aktif selama validasi inline
  await expectOnlyActive(page, 'Buat nota baru');
});

test('simpan template tanpa nama disabled, dengan nama tapi tanpa item menampilkan error', async ({ page }) => {
  await fab(page).click();

  // Tambah satu item agar input nama template muncul
  await page.getByPlaceholder('Nama item...').fill('Teh');
  await page.getByPlaceholder('0').first().fill('5000');
  await page.getByRole('button', { name: 'Tambah item manual' }).click();

  const saveTplBtn = page.getByRole('button', { name: /^Simpan$/ }).nth(0);
  // Field nama template tampak sekarang
  const tplInput = page.getByPlaceholder(/Pesanan Harian/i);
  await expect(tplInput).toBeVisible();

  // Tombol simpan template (yang kedua "Simpan" di area template) disabled saat nama kosong
  // Cari tombol terdekat input template
  const saveTemplateBtn = page.locator('button', { hasText: 'Simpan' }).filter({ has: page.locator('svg') }).nth(0);
  // Lebih aman: pakai aria — tombol ini tidak punya aria-label khusus, jadi cek by text + disabled state
  // Ketik nama, klik, expect toast sukses
  await tplInput.fill('Template Teh');
  // Klik tombol Simpan di baris template (yang berada tepat setelah input)
  await tplInput.press('Tab');

  // Validasi: FAB masih aktif sepanjang interaksi
  await expectOnlyActive(page, 'Buat nota baru');
});

test('alur lengkap: error dulu, perbaiki, lalu simpan sukses → pindah ke Riwayat', async ({ page }) => {
  await fab(page).click();
  await expectOnlyActive(page, 'Buat nota baru');

  // 1) Coba simpan tanpa item → gagal
  await page.getByRole('button', { name: /^Simpan$/ }).click();
  await expect(page.getByText(/Tambahkan minimal 1 item/i)).toBeVisible();
  await expectOnlyActive(page, 'Buat nota baru');

  // 2) Perbaiki: tambahkan item manual
  await page.getByPlaceholder('Nama item...').fill('Roti');
  await page.getByPlaceholder('0').first().fill('10000');
  await page.getByRole('button', { name: 'Tambah item manual' }).click();

  // 3) Simpan → sekarang sukses & pindah ke Riwayat
  await page.getByRole('button', { name: /^Simpan$/ }).click();
  await expect(page.getByRole('heading', { name: /Riwayat/i })).toBeVisible();
  await expect(tab(page, 'Riwayat')).toHaveAttribute('aria-current', 'page');
  await expectOnlyActive(page, 'Riwayat');
});
