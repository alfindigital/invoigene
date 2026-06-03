import { LayoutDashboard, History, Settings, Plus, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Beranda', key: 'dashboard', icon: LayoutDashboard },
  { title: 'Riwayat', key: 'history', icon: History },
  { title: 'Item', key: 'items', icon: Package },
  { title: 'Setelan', key: 'settings', icon: Settings },
];

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

function NavButton({
  item,
  isActive,
  onNavigate,
}: {
  item: { title: string; key: string; icon: typeof LayoutDashboard };
  isActive: boolean;
  onNavigate: (k: string) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onNavigate(item.key)}
      aria-label={item.title}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[56px] transition-all tap-scale',
        isActive ? 'text-white' : 'text-white/60 hover:text-white/90',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300',
          isActive && 'bg-white/15',
        )}
      >
        <Icon className={cn('h-[22px] w-[22px]', isActive && 'stroke-[2.5px]')} />
      </div>
      <span className={cn('text-[11px] font-medium leading-none', isActive && 'font-semibold')}>
        {item.title}
      </span>
    </button>
  );
}

export function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  const isFabActive = activePage === 'new' || activePage === 'edit';
  return (
    <>
      {/* FAB — Nota Baru. Tetap di DOM (utk a11y & e2e), tapi disembunyikan
          secara visual saat form aktif agar tidak menimpa sticky total bar. */}
      <button
        onClick={() => onNavigate('new')}
        aria-label="Buat nota baru"
        aria-current={isFabActive ? 'page' : undefined}
        aria-hidden={isFabActive ? true : undefined}
        tabIndex={isFabActive ? -1 : 0}
        className={cn(
          'fixed z-50 bottom-[76px] right-4 md:right-8 h-14 w-14 rounded-full',
          'bg-primary text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.45)]',
          'flex items-center justify-center tap-scale transition-all',
          'hover:shadow-[0_10px_28px_hsl(var(--primary)/0.55)]',
          isFabActive && 'opacity-0 pointer-events-none scale-90',
        )}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>



      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-foreground))] safe-area-bottom shadow-[0_-2px_24px_rgba(0,0,0,0.18)]"
        aria-label="Navigasi utama"
      >
        <div className="flex items-stretch h-[64px] max-w-2xl mx-auto px-2">
          {items.map((item) => (
            <NavButton
              key={item.key}
              item={item}
              isActive={activePage === item.key}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>
    </>
  );
}
