import { useState, useEffect, useRef } from 'react';
import { BottomNav } from '@/components/BottomNav';
import Dashboard from '@/pages/Dashboard';
import InvoiceForm from '@/pages/InvoiceForm';
import InvoiceHistory from '@/pages/InvoiceHistory';
import Settings from '@/pages/Settings';
import { Sun, Moon } from 'lucide-react';
import logoImg from '@/assets/logo.png';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  new: 'Buat Invoice',
  edit: 'Edit Invoice',
  history: 'Riwayat',
  settings: 'Pengaturan',
};

const Index = () => {
  const [page, setPage] = useState('dashboard');
  const [editId, setEditId] = useState<string | null>(null);
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

  const navigate = (p: string) => {
    if (p === displayedPage && p !== 'edit') return;
    setIsTransitioning(true);
    if (p !== 'edit') setEditId(null);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setPage(p);
      setDisplayedPage(p);
      setIsTransitioning(false);
    }, 150);
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setPage('edit');
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'new':
        return <InvoiceForm onNavigate={navigate} />;
      case 'edit':
        return <InvoiceForm editId={editId} onNavigate={navigate} />;
      case 'history':
        return <InvoiceHistory onNavigate={navigate} onEdit={handleEdit} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col app-bg-pattern">
      {/* Top bar — dark blue branded */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-5 bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-foreground))] shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src={logoImg} alt="Logo" width={32} height={32} className="rounded-lg" />
          <h1 className="text-lg font-bold tracking-tight">
            {pageTitles[page] || 'Invoice App'}
          </h1>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-[hsl(var(--nav-foreground))]"
        >
          {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 md:px-8 lg:px-12 py-5 pb-24 overflow-auto max-w-5xl mx-auto w-full">
        <div
          className={`transition-all duration-200 ease-out ${
            isTransitioning
              ? 'opacity-0 translate-y-3 scale-[0.98]'
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          {renderPage()}
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav activePage={page} onNavigate={navigate} />
    </div>
  );
};

export default Index;
