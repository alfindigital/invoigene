import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { BottomNav } from './BottomNav';

function Harness({ initial = 'dashboard' }: { initial?: string }) {
  const [active, setActive] = useState(initial);
  return <BottomNav activePage={active} onNavigate={setActive} />;
}

const TABS = ['Beranda', 'Riwayat', 'Item', 'Setelan'] as const;
const FAB = 'Buat nota baru';

describe('BottomNav — aksesibilitas aria-current & fokus keyboard', () => {
  it('hanya satu elemen memiliki aria-current="page" setelah klik tab apa pun', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    for (const label of TABS) {
      await user.click(screen.getByRole('button', { name: label }));
      const actives = screen
        .getAllByRole('button')
        .filter((b) => b.getAttribute('aria-current') === 'page');
      expect(actives).toHaveLength(1);
      expect(actives[0]).toHaveAccessibleName(label);
    }
  });

  it('FAB mendapatkan aria-current="page" dan tab kehilangan miliknya', async () => {
    const user = userEvent.setup();
    render(<Harness initial="history" />);
    expect(screen.getByRole('button', { name: 'Riwayat' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: FAB }));
    expect(screen.getByRole('button', { name: FAB })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Riwayat' })).not.toHaveAttribute('aria-current', 'page');

    const actives = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-current') === 'page');
    expect(actives).toHaveLength(1);
  });

  it('Tab keyboard menelusuri FAB lalu seluruh tab bawah dalam urutan DOM', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // Urutan DOM: FAB di-render lebih dulu, lalu tab-tab.
    const order = [FAB, ...TABS];
    for (const name of order) {
      await user.tab();
      expect(screen.getByRole('button', { name })).toHaveFocus();
    }
  });

  it('Enter & Space pada tab yang difokuskan mengaktifkan navigasi', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const riwayat = screen.getByRole('button', { name: 'Riwayat' });
    riwayat.focus();
    await user.keyboard('{Enter}');
    expect(riwayat).toHaveAttribute('aria-current', 'page');

    const item = screen.getByRole('button', { name: 'Item' });
    item.focus();
    await user.keyboard(' ');
    expect(item).toHaveAttribute('aria-current', 'page');
    expect(riwayat).not.toHaveAttribute('aria-current', 'page');
  });

  it('Enter pada FAB yang difokuskan menandainya aktif', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const fab = screen.getByRole('button', { name: FAB });
    fab.focus();
    await user.keyboard('{Enter}');
    expect(fab).toHaveAttribute('aria-current', 'page');
  });

  it('fokus tetap pada elemen yang ditekan setelah aktivasi (tidak hilang)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const setelan = screen.getByRole('button', { name: 'Setelan' });
    setelan.focus();
    await user.keyboard('{Enter}');
    expect(setelan).toHaveFocus();
    expect(setelan).toHaveAttribute('aria-current', 'page');
  });

  it('nav memiliki aria-label yang dapat ditemukan oleh screen reader', () => {
    render(<Harness />);
    expect(screen.getByRole('navigation', { name: 'Navigasi utama' })).toBeInTheDocument();
  });

  it('semua tombol navigasi memiliki nama yang dapat diakses', () => {
    render(<Harness />);
    for (const label of [...TABS, FAB]) {
      const btn = screen.getByRole('button', { name: label });
      expect(btn).toHaveAccessibleName(label);
    }
  });
});
