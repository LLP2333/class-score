'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, RefreshCw } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/': '首页',
  '/groups': '小组管理',
  '/ranking': '排行榜',
  '/timeline': '积分时间线',
  '/analysis': '数据分析',
  '/shop': '积分商城',
  '/rules': '积分规则',
  '/tools': '工具箱',
  '/settings': '系统设置',
};

interface HeaderProps {
  onMenuClick: () => void;
  onRefresh?: () => void;
}

export function Header({ onMenuClick, onRefresh }: HeaderProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || '首页';

  return (
    <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            title="刷新"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
