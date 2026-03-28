import {
  LayoutDashboard,
  FilePlus,
  History,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const items = [
  { title: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
  { title: 'Buat Invoice', key: 'new', icon: FilePlus },
  { title: 'Riwayat Invoice', key: 'history', icon: History },
  { title: 'Pengaturan', key: 'settings', icon: Settings },
];

interface AppSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export function AppSidebar({ activePage, onNavigate, darkMode, onToggleDark }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && <span className="font-bold text-base">Invoice App</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.key)}
                    className={activePage === item.key ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted/50'}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-3">
          <Button variant="ghost" size="icon" onClick={onToggleDark} className="w-full justify-center">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
