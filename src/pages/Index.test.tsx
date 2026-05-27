import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Index from './Index';

// Mock heavy page components to keep the integration test focused on routing.
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

describe('Index — sinkronisasi navigasi cepat saat transisi 150ms', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const getUser = () =>
    userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });

  const clickTab = async (user: ReturnType<typeof getUser>, label: string) => {
    await user.click(screen.getByRole('button', { name: label }));
  };

  it('langsung menampilkan halaman terakhir yang diklik tanpa menunggu transisi', async () => {
    const user = getUser();
    render(<Index />);

    // Default: dashboard
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();

    // Klik cepat berurutan dalam <150ms
    await clickTab(user, 'Riwayat');
    await clickTab(user, 'Item');
    await clickTab(user, 'Setelan');

    // displayedPage (BottomNav active) HARUS sinkron dengan page (rendered)
    // pada klik terakhir, bukan tertinggal pada klik pertama.
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
    expect(screen.queryByTestId('page-history')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page-items')).not.toBeInTheDocument();

    const setelanBtn = screen.getByRole('button', { name: 'Setelan' });
    expect(setelanBtn).toHaveAttribute('aria-current', 'page');

    // Hanya satu tab aktif
    const activeButtons = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-current') === 'page');
    expect(activeButtons).toHaveLength(1);
  });

  it('mempertahankan sinkronisasi displayedPage & page setelah timer 150ms selesai', async () => {
    const user = getUser();
    render(<Index />);

    await clickTab(user, 'Riwayat');
    // Sebelum 150ms berlalu, klik lagi
    act(() => {
      vi.advanceTimersByTime(50);
    });
    await clickTab(user, 'Item');

    // Selesaikan transisi
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByTestId('page-items')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Item' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('FAB klik cepat tetap mengarahkan ke halaman new dan menandai FAB aktif', async () => {
    const user = getUser();
    render(<Index />);

    await clickTab(user, 'Riwayat');
    await clickTab(user, 'Buat nota baru');

    expect(screen.getByTestId('page-form')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buat nota baru' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // Riwayat tidak boleh tetap aktif
    expect(screen.getByRole('button', { name: 'Riwayat' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('klik tab yang sama dua kali cepat tidak menyebabkan desync', async () => {
    const user = getUser();
    render(<Index />);

    await clickTab(user, 'Riwayat');
    await clickTab(user, 'Riwayat');

    expect(screen.getByTestId('page-history')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Riwayat' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
