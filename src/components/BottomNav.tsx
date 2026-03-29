import { LayoutDashboard, FilePlus, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
  { title: 'Buat', key: 'new', icon: FilePlus },
  { title: 'Riwayat', key: 'history', icon: History },
  { title: 'Setelan', key: 'settings', icon: Settings },
];

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-foreground))] safe-area-bottom shadow-[0_-2px_20px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-around h-[68px] max-w-2xl mx-auto px-4">
        {items.map((item) => {
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200',
                isActive
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/80'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-white" />
              )}
              <div
                className={cn(
                  'flex items-center justify-center w-11 h-8 rounded-2xl transition-all duration-300',
                  isActive && 'bg-white/15'
                )}
              >
                <item.icon className={cn('h-[22px] w-[22px] transition-all', isActive && 'stroke-[2.5px]')} />
              </div>
              <span className={cn('text-[11px] font-medium leading-none', isActive && 'font-bold')}>
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
