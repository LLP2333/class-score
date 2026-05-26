'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
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
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

const teacherNavItems = [
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

const studentNavItems = [
  { href: '/', label: '首页', icon: Home, emoji: '🏠' },
  { href: '/ranking', label: '排行榜', icon: Trophy, emoji: '🏆' },
  { href: '/timeline', label: '积分时间线', icon: Calendar, emoji: '📅' },
  { href: '/analysis', label: '数据分析', icon: BarChart3, emoji: '📊' },
  { href: '/shop', label: '积分商城', icon: ShoppingCart, emoji: '🛒' },
  { href: '/pets', label: '宠物乐园', icon: Wrench, emoji: '🐾' },
  { href: '/settings', label: '我的设置', icon: Settings, emoji: '⚙️' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { username, role, classes, currentClassId, clearAuth, setCurrentClassId } = useAuthStore();
  const [classMenuOpen, setClassMenuOpen] = useState(false);

  const navItems = role === 'student' ? studentNavItems : teacherNavItems;
  const currentClass = classes.find(c => c.id === currentClassId);

  const handleLogout = () => {
    clearAuth();
    onClose();
  };

  const handleClassSwitch = (classId: number) => {
    setCurrentClassId(classId);
    setClassMenuOpen(false);
    window.location.reload();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-60 bg-sidebar border-r border-sidebar-border',
          'flex flex-col transition-transform duration-300',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border">
          <span className="text-2xl">🌈</span>
          <span className="font-semibold text-lg text-sidebar-foreground">班级积分系统</span>
        </div>

        {role === 'teacher' && classes.length > 0 && (
          <div className="px-2 py-2 border-b border-sidebar-border">
            {classes.length === 1 ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground">
                <span className="truncate font-medium">{currentClass?.name}</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setClassMenuOpen(!classMenuOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sm text-sidebar-foreground"
                >
                  <span className="truncate">{currentClass?.name || '选择班级'}</span>
                  <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', classMenuOpen && 'rotate-180')} />
                </button>
                {classMenuOpen && (
                  <div className="mt-1 space-y-0.5">
                    {classes.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleClassSwitch(c.id)}
                        className={cn(
                          'w-full text-left px-3 py-1.5 rounded text-sm',
                          c.id === currentClassId
                            ? 'bg-primary text-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent'
                        )}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = item.href === '/'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
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

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {username}
              </div>
              <div className="text-xs text-muted-foreground">
                {role === 'teacher' ? '教师' : '学生'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
