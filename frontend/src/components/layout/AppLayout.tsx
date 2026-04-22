'use client';

import { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LoginPage } from '@/components/features/LoginPage';
import { DataLoader } from '@/components/features/DataLoader';
import { CreateClassGuide } from '@/components/features/CreateClassGuide';
import { useAuthStore } from '@/store';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());
  const role = useAuthStore((s) => s.role);
  const classes = useAuthStore((s) => s.classes);
  const currentClassId = useAuthStore((s) => s.currentClassId);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const needsClass = role === 'teacher' && classes.length === 0 && !currentClassId;

  if (needsClass) {
    return <CreateClassGuide />;
  }

  return (
    <div className="h-dvh bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <DataLoader />

      <div className="md:pl-60 h-full flex flex-col">
        <Header onMenuClick={handleMenuClick} />

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
