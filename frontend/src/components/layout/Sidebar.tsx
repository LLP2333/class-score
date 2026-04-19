'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSettingsStore, useAuthStore } from '@/store';
import {
  Home,
  Users,
  Trophy,
  Calendar,
  BarChart3,
  ShoppingCart,
  ClipboardList,
  Wrench,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/', label: '首页', icon: Home, emoji: '🏠' },
  { href: '/groups', label: '小组管理', icon: Users, emoji: '👥' },
  { href: '/ranking', label: '排行榜', icon: Trophy, emoji: '🏆' },
  { href: '/timeline', label: '积分时间线', icon: Calendar, emoji: '📅' },
  { href: '/analysis', label: '数据分析', icon: BarChart3, emoji: '📊' },
  { href: '/shop', label: '积分商城', icon: ShoppingCart, emoji: '🛒' },
  { href: '/rules', label: '积分规则', icon: ClipboardList, emoji: '📋' },
  { href: '/pets', label: '宠物乐园', icon: Wrench, emoji: '🐾' },
  { href: '/tools', label: '工具箱', icon: Wrench, emoji: '🧰' },
  { href: '/settings', label: '系统设置', icon: Settings, emoji: '⚙️' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { classInfo } = useSettingsStore();
  const { isAvailable, user } = useAuthStore();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-60 bg-sidebar border-r border-sidebar-border',
          'flex flex-col transition-transform duration-300',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border">
          <span className="text-2xl">🌈</span>
          <span className="font-semibold text-lg text-sidebar-foreground">班级积分系统</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onClose()}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <span className="text-base">{item.emoji}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-sm font-medium text-sidebar-foreground">
            {classInfo.name}
          </div>
          {isAvailable && (
            <div className="mt-1">
              {user ? (
                <span className="text-xs text-green-500">● {user.username}</span>
              ) : (
                <span className="text-xs text-orange-500">● 未登录</span>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
