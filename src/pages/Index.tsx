import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { BottomNav } from '@/components/BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import Dashboard from '@/pages/Dashboard';
import InvoiceForm from '@/pages/InvoiceForm';
import InvoiceHistory from '@/pages/InvoiceHistory';
import Settings from '@/pages/Settings';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [page, setPage] = useState('dashboard');
  const [editId, setEditId] = useState<string | null>(null);
  const isMobile = useIsMobile();
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

  // Mobile layout - no sidebar, bottom nav
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b bg-background/80 backdrop-blur-xl">
          <h1 className="text-lg font-bold tracking-tight text-foreground">Invoice App</h1>
          <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="h-9 w-9 rounded-full">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-4 pb-20 overflow-auto">
          {renderPage()}
        </main>

        {/* Bottom navigation */}
        <BottomNav activePage={page} onNavigate={navigate} />
      </div>
    );
  }

  // Desktop layout - sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activePage={page} onNavigate={navigate} darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4 bg-background/80 backdrop-blur-xl">
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
