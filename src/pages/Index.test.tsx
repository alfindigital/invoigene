import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Index from './Index';

vi.mock('@/pages/Dashboard', () => ({
  default: () => <div data-testid="page-dashboard">Dashboard</div>,
}));
vi.mock('@/pages/InvoiceForm', () => ({
  default: () => <div data-testid="page-form">Form</div>,
}));
vi.mock('@/pages/InvoiceHistory', () => ({
  default: () => <div data-testid="page-history">History</div>,
}));
vi.mock('@/pages/Settings', () => ({
  default: () => <div data-testid="page-settings">Settings</div>,
}));
vi.mock('@/pages/Items', () => ({
  default: () => <div data-testid="page-items">Items</div>,
}));
vi.mock('@/components/InvoicePreview', () => ({
  default: () => <div data-testid="page-preview">Preview</div>,
}));
vi.mock('@/hooks/useInvoiceStore', () => ({
  useInvoiceStore: () => ({ invoices: [], profile: {} }),
}));
vi.mock('@/assets/logo.png', () => ({ default: 'logo.png' }));

const click = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: label }));

describe('Index — sinkronisasi navigasi cepat saat transisi 150ms', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it('langsung menampilkan halaman terakhir yang diklik tanpa menunggu transisi', () => {
    render(<Index />);
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();

    // Tiga klik cepat berturut-turut dalam window 150ms
    click('Riwayat');
    act(() => void vi.advanceTimersByTime(20));
    click('Item');
    act(() => void vi.advanceTimersByTime(20));
    click('Setelan');

    // page (rendered) sinkron dengan displayedPage (active tab) pada klik terakhir
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
    expect(screen.queryByTestId('page-history')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page-items')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Setelan' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    const active = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-current') === 'page');
    expect(active).toHaveLength(1);
  });

  it('sinkron tetap stabil setelah timer 150ms selesai', () => {
    render(<Index />);
    click('Riwayat');
    act(() => void vi.advanceTimersByTime(50));
    click('Item');
    act(() => void vi.advanceTimersByTime(300));

    expect(screen.getByTestId('page-items')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Item' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('FAB selama transisi tetap mengarahkan ke new dan menandai FAB aktif', () => {
    render(<Index />);
    click('Riwayat');
    act(() => void vi.advanceTimersByTime(30));
    click('Buat nota baru');

    expect(screen.getByTestId('page-form')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buat nota baru' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('button', { name: 'Riwayat' }),
    ).not.toHaveAttribute('aria-current', 'page');
  });

  it('klik cepat bolak-balik tidak meninggalkan dua tab aktif', () => {
    render(<Index />);
    click('Riwayat');
    click('Setelan');
    click('Riwayat');

    expect(screen.getByTestId('page-history')).toBeInTheDocument();
    const active = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-current') === 'page');
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAccessibleName('Riwayat');
  });

  it('stress: puluhan klik cepat acak tidak membuat tab tertukar dan selalu hanya satu aktif', () => {
    render(<Index />);
    const tabNames = ['Beranda', 'Riwayat', 'Item', 'Setelan'] as const;
    const labelToTestId: Record<string, string> = {
      Beranda: 'page-dashboard',
      Riwayat: 'page-history',
      Item: 'page-items',
      Setelan: 'page-settings',
    };
    const clicks = 30;

    for (let i = 0; i < clicks; i++) {
      const label = tabNames[i % tabNames.length];
      act(() => void vi.advanceTimersByTime(5));
      click(label);

      const activeButtons = screen
        .getAllByRole('button')
        .filter((b) => b.getAttribute('aria-current') === 'page');

      expect(activeButtons).toHaveLength(1);
      expect(activeButtons[0]).toHaveAccessibleName(label);
      expect(screen.getByTestId(labelToTestId[label])).toBeInTheDocument();
    }
  });

  it('stress: klik acak dengan interval 10ms tetap sinkron page dan tab', () => {
    render(<Index />);
    const tabNames = ['Riwayat', 'Item', 'Setelan', 'Beranda'];
    const sequence = Array.from({ length: 24 }, (_, i) => tabNames[i % tabNames.length]);

    for (const label of sequence) {
      act(() => void vi.advanceTimersByTime(10));
      click(label);
    }

    const last = sequence[sequence.length - 1];
    const activeButtons = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-current') === 'page');
    expect(activeButtons).toHaveLength(1);
    expect(activeButtons[0]).toHaveAccessibleName(last);
  });

  it('stress: klik FAB dan tab bergantian dalam loop cepat', () => {
    render(<Index />);
    const cycle = ['Riwayat', 'Buat nota baru', 'Item', 'Buat nota baru'] as const;

    for (let i = 0; i < 16; i++) {
      const label = cycle[i % cycle.length];
      act(() => void vi.advanceTimersByTime(8));
      click(label);

      const activeButtons = screen
        .getAllByRole('button')
        .filter((b) => b.getAttribute('aria-current') === 'page');
      expect(activeButtons).toHaveLength(1);
      expect(activeButtons[0]).toHaveAccessibleName(label);
    }
  });
});
