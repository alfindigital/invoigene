import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

const TABS = [
  { label: 'Beranda', key: 'dashboard' },
  { label: 'Riwayat', key: 'history' },
  { label: 'Item', key: 'items' },
  { label: 'Setelan', key: 'settings' },
];

describe('BottomNav', () => {
  it('memanggil onNavigate dengan key yang tepat untuk tiap tab', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<BottomNav activePage="dashboard" onNavigate={onNavigate} />);

    for (const tab of TABS) {
      await user.click(screen.getByRole('button', { name: tab.label }));
    }

    expect(onNavigate.mock.calls.map(c => c[0])).toEqual(
      TABS.map(t => t.key),
    );
  });

  it('FAB selalu memanggil onNavigate("new")', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<BottomNav activePage="dashboard" onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: /buat nota baru/i }));
    expect(onNavigate).toHaveBeenCalledWith('new');
  });

  it.each(TABS)('menandai tab "$label" sebagai aktif saat activePage="$key"', ({ label, key }) => {
    const { rerender } = render(<BottomNav activePage="dashboard" onNavigate={() => {}} />);
    rerender(<BottomNav activePage={key} onNavigate={() => {}} />);
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-current', 'page');
  });

  it('hanya satu tab aktif pada satu waktu', () => {
    render(<BottomNav activePage="history" onNavigate={() => {}} />);
    const active = TABS.filter(
      t => screen.getByRole('button', { name: t.label }).getAttribute('aria-current') === 'page',
    );
    expect(active).toHaveLength(1);
    expect(active[0].key).toBe('history');
  });

  it.each(['new', 'edit'])('FAB aktif saat activePage="%s"', (page) => {
    render(<BottomNav activePage={page} onNavigate={() => {}} />);
    const fab = screen.getByRole('button', { name: /buat nota baru/i });
    expect(fab).toHaveAttribute('aria-current', 'page');
    // tidak ada tab bawah yang aktif
    for (const t of TABS) {
      expect(screen.getByRole('button', { name: t.label })).not.toHaveAttribute('aria-current', 'page');
    }
  });

  it('FAB tidak aktif untuk halaman tab biasa', () => {
    render(<BottomNav activePage="dashboard" onNavigate={() => {}} />);
    expect(screen.getByRole('button', { name: /buat nota baru/i })).not.toHaveAttribute('aria-current', 'page');
  });
});
