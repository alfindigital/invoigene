import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { Sun, Moon, Loader2 } from 'lucide-react';
import logoImg from '@/assets/logo.png';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const InvoiceForm = lazy(() => import('@/pages/InvoiceForm'));
const InvoiceHistory = lazy(() => import('@/pages/InvoiceHistory'));
const InvoicePreview = lazy(() => import('@/components/InvoicePreview'));
const Settings = lazy(() => import('@/pages/Settings'));
const Items = lazy(() => import('@/pages/Items'));


const pageMeta: Record<string, { title: string; description: string }> = {
  dashboard: {
    title: 'Dashboard Penjualan — Notaku',
    description: 'Pantau penjualan harian, omzet, dan transaksi terbaru toko Anda di Notaku.',
  },
  new: {
    title: 'Buat Nota Baru — Notaku',
    description: 'Buat nota & invoice profesional dalam 3 tap. Gratis dan tanpa daftar.',
  },
  edit: {
    title: 'Edit Nota — Notaku',
    description: 'Perbarui data nota dan kirim ulang ke pelanggan via WhatsApp.',
  },
  preview: {
    title: 'Preview Nota — Notaku',
    description: 'Pratinjau nota sebelum cetak struk thermal atau kirim ke pelanggan.',
  },
  history: {
    title: 'Riwayat Nota — Notaku',
    description: 'Cari, filter, dan kelola seluruh nota & invoice yang pernah dibuat.',
  },
  settings: {
    title: 'Pengaturan Toko — Notaku',
    description: 'Atur profil toko, logo, format struk, dan preferensi Notaku.',
  },
  items: {
    title: 'Katalog Item — Notaku',
    description: 'Kelola katalog produk yang sering dijual agar nota bisa dibuat sekali tap.',
  },
};

const Index = () => {
  const { invoices, profile } = useInvoiceStore();
  const [page, setPage] = useState('dashboard');
  const [editId, setEditId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedPage, setDisplayedPage] = useState('dashboard');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('inv_dark') === 'true';
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('inv_dark', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const meta = pageMeta[displayedPage] || pageMeta.dashboard;
    document.title = meta.title;
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    descTag.setAttribute('content', meta.description);
  }, [displayedPage]);

  const navigate = (p: string) => {
    if (p === displayedPage && p !== 'edit' && p !== 'preview') return;
    if (p !== 'edit' && p !== 'preview') { setEditId(null); setPreviewId(null); }
    setIsTransitioning(true);
    setPage(p);
    setDisplayedPage(p);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsTransitioning(false), 150);
  };

  const handleEdit = (id: string) => { setEditId(id); setPage('edit'); setDisplayedPage('edit'); };
  const handlePreview = (id: string) => { setPreviewId(id); setPage('preview'); setDisplayedPage('preview'); };

  const renderPage = () => {
    const previewInvoice = previewId ? invoices.find(i => i.id === previewId) : null;
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
      case 'new': return <InvoiceForm onNavigate={navigate} />;
      case 'edit': return <InvoiceForm editId={editId} onNavigate={navigate} />;
      case 'preview': return previewInvoice
        ? <InvoicePreview invoice={previewInvoice} profile={profile} onBack={() => navigate('history')} />
        : <InvoiceHistory onNavigate={navigate} onEdit={handleEdit} onPreview={handlePreview} />;
      case 'history': return <InvoiceHistory onNavigate={navigate} onEdit={handleEdit} onPreview={handlePreview} />;
      case 'items': return <Items />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col app-bg-pattern">
      <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-foreground))] shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={logoImg} alt="Logo Notaku" width={32} height={32} className="rounded-lg shrink-0" />
          <span className="font-display text-base font-bold tracking-tight">Notaku</span>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[hsl(var(--nav-foreground))]"
        >
          {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
      </header>

      <main className="flex-1 px-4 md:px-8 lg:px-12 py-5 pb-32 overflow-auto max-w-5xl mx-auto w-full">
        <div className={`transition-all duration-200 ease-out ${isTransitioning ? 'opacity-0 translate-y-3 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}>
          <Suspense fallback={
            <div className="flex items-center justify-center py-20 text-muted-foreground" role="status" aria-label="Memuat halaman">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          }>
            {renderPage()}
          </Suspense>
        </div>
      </main>

      <BottomNav activePage={displayedPage} onNavigate={navigate} />
    </div>
  );
};

export default Index;
