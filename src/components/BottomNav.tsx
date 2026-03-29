import { LayoutDashboard, FilePlus, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
  { title: 'Buat', key: 'new', icon: FilePlus },
  { title: 'Riwayat', key: 'history', icon: History },
  { title: 'Pengaturan', key: 'settings', icon: Settings },
];

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-xl safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 rounded-xl mx-0.5',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-300',
                  isActive && 'bg-primary/10 scale-110'
                )}
              >
                <item.icon className={cn('h-5 w-5 transition-all', isActive && 'stroke-[2.5px]')} />
              </div>
              <span className={cn('text-[10px] font-medium leading-tight', isActive && 'font-semibold')}>
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
