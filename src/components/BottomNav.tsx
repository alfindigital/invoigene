import { LayoutDashboard, History, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Beranda', key: 'dashboard', icon: LayoutDashboard },
  { title: 'Riwayat', key: 'history', icon: History },
  { title: 'Nota Baru', key: 'new', icon: Plus },
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
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-foreground))] safe-area-bottom shadow-[0_-2px_24px_rgba(0,0,0,0.18)]"
      aria-label="Navigasi utama"
    >
      <div className="flex items-stretch h-[64px] max-w-2xl mx-auto px-2">
        {items.map((item) => {
          const isActive =
            activePage === item.key ||
            (item.key === 'new' && (activePage === 'new' || activePage === 'edit'));
          return (
            <NavButton
              key={item.key}
              item={item}
              isActive={isActive}
              onNavigate={onNavigate}
            />
          );
        })}
      </div>
    </nav>
  );
}
