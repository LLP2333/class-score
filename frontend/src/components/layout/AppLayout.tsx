'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleRefresh = useCallback(() => {
    router.refresh();
    toast.success('已刷新');
  }, [router]);

  return (
    <div className="h-dvh bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      
      <div className="md:pl-60 h-full flex flex-col">
        <Header onMenuClick={handleMenuClick} onRefresh={handleRefresh} />
        
        <main className="flex-1 overflow-y-auto overscroll-y-contain">
          <div className="p-4 md:p-6 min-h-full flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <footer className="py-4 text-center text-xs text-muted-foreground">
              Made with ❤️ by LLP2333
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
