import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import Dashboard from '@/pages/Dashboard';
import InvoiceForm from '@/pages/InvoiceForm';
import InvoiceHistory from '@/pages/InvoiceHistory';
import Settings from '@/pages/Settings';
import { Sun, Moon } from 'lucide-react';

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
    setPage(p);
    if (p !== 'edit') setEditId(null);
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-5 bg-background/80 backdrop-blur-xl">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          {pageTitles[page] || 'Invoice App'}
        </h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
        >
          {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 md:px-8 lg:px-12 py-4 pb-24 overflow-auto max-w-5xl mx-auto w-full">
        {renderPage()}
      </main>

      {/* Bottom navigation — always visible */}
      <BottomNav activePage={page} onNavigate={navigate} />
    </div>
  );
};

export default Index;
