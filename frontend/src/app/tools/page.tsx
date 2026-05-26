'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store';
import { ChevronRight, Dices } from 'lucide-react';

const tools = [
  {
    href: '/tools/roll-call',
    title: '随机点名',
    description: '由后端抽取学生，支持排除最近已点名记录',
    icon: Dices,
  },
];

export default function ToolsPage() {
  const isTeacher = useAuthStore((s) => s.role === 'teacher');

  if (!isTeacher) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">🧰</div>
        <h3 className="text-lg font-medium mb-2">工具箱仅供老师使用</h3>
        <p className="text-muted-foreground">学生暂无可用工具</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.href} href={tool.href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Card className="rounded-lg transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{tool.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
