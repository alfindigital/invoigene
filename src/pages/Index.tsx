import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import Dashboard from '@/pages/Dashboard';
import InvoiceForm from '@/pages/InvoiceForm';
import InvoiceHistory from '@/pages/InvoiceHistory';
import Settings from '@/pages/Settings';

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activePage={page} onNavigate={navigate} darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {renderPage()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
