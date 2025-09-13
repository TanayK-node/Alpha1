import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TradingChatbot } from '@/components/chat/TradingChatbot';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar} 
      />
      
      <Header 
        onMenuToggle={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      <main className={cn(
        "pt-16 transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
      
      {/* Trading Chatbot */}
      <TradingChatbot />
    </div>
  );
}