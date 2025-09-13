import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { 
  LayoutDashboard, 
  Wrench, 
  BarChart3, 
  TrendingUp, 
  Briefcase, 
  LineChart,
  Settings,
  ChevronDown,
  Activity,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';


const menuItems = [
  { 
    title: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard 
  },
  { 
    title: 'Strategy Builder', 
    href: '/strategy', 
    icon: Wrench 
  },
  { 
    title: 'Backtesting', 
    href: '/backtest', 
    icon: BarChart3 
  },
  { 
    title: 'Live Trading', 
    href: '/trading', 
    icon: TrendingUp 
  },
  { 
    title: 'Portfolio', 
    href: '/portfolio', 
    icon: Briefcase 
  },
  { 
    title: 'Market Data', 
    href: '/market', 
    icon: LineChart 
  },
  { 
    title: 'Community', 
    href: '/community', 
    icon: Users 
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { profile, signOut } = useUser();
  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-trading-secondary border-r transition-all duration-300 z-50",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo/Brand */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-trading-primary" />
            <span className="font-bold text-lg text-trading-primary">Alpha Forge</span>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            collapsed ? "rotate-90" : "-rotate-90"
          )} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <li key={item.href}>
                <NavLink 
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-trading-primary/10 hover:text-trading-primary",
                    isActive 
                      ? "bg-trading-primary text-trading-primary-foreground shadow-trading" 
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium">{item.title}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <div className={cn(
          "flex items-center space-x-3 p-3 rounded-lg bg-gradient-card",
          collapsed ? "justify-center" : ""
        )}>
          <div className="h-8 w-8 rounded-full bg-trading-primary flex items-center justify-center">
            <span className="text-xs font-medium text-trading-primary-foreground">{(profile?.display_name?.[0] || 'A')}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.display_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">Alpha Forger</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}