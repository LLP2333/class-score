'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore, useSettingsStore, useStudentStore } from '@/store';
import { cn, formatRelativeTime, getAvatarClass } from '@/lib/utils';
import type { Student } from '@/types';
import { ArrowLeft, History, Play, Save, Users } from 'lucide-react';
import { toast } from 'sonner';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function RollCallPage() {
  const { students } = useStudentStore();
  const { settings, rollCallHistory, createRandomRollCall, updateSettings } = useSettingsStore();
  const currentClassId = useAuthStore((s) => s.currentClassId);
  const isTeacher = useAuthStore((s) => s.role === 'teacher');

  const [rollCallCount, setRollCallCount] = useState(1);
  const [excludeRecentCount, setExcludeRecentCount] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [rolledStudents, setRolledStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const studentByName = useMemo(() => {
    return new Map(students.map(student => [student.name, student]));
  }, [students]);

  const countOptions = useMemo(() => {
    const max = Math.min(Math.max(students.length, 1), 5);
    return Array.from({ length: max }, (_, index) => index + 1);
  }, [students.length]);

  useEffect(() => {
    if (rollCallCount > students.length && students.length > 0) {
      setRollCallCount(Math.min(students.length, 5));
    }
  }, [rollCallCount, students.length]);

  useEffect(() => {
    if (!settings) return;
    setRollCallCount(Math.max(1, settings.roll_call_count || 1));
    setExcludeRecentCount(Math.max(0, settings.roll_call_exclude_recent_count || 0));
  }, [settings]);

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    };
  }, []);

  const saveRollCallSettings = useCallback(async () => {
    if (!currentClassId) return;
    if (rollCallCount <= 0) {
      toast.error('点名人数必须大于0');
      return;
    }
    if (excludeRecentCount < 0) {
      toast.error('排除次数不能小于0');
      return;
    }

    setIsSavingSettings(true);
    try {
      await updateSettings(currentClassId, {
        roll_call_count: rollCallCount,
        roll_call_exclude_recent_count: excludeRecentCount,
      });
      toast.success('点名设置已保存');
    } catch {
      toast.error('保存点名设置失败');
    } finally {
      setIsSavingSettings(false);
    }
  }, [currentClassId, excludeRecentCount, rollCallCount, updateSettings]);

  const startRollCall = useCallback(async () => {
    if (!currentClassId) return;
    if (students.length === 0) {
      toast.error('没有学生可以点名');
      return;
    }
    if (rollCallCount > students.length) {
      toast.error('点名人数不能超过学生总数');
      return;
    }
    if (excludeRecentCount < 0) {
      toast.error('排除次数不能小于0');
      return;
    }

    setIsRolling(true);
    setRolledStudents([]);
    setCurrentStudent(null);

    rollIntervalRef.current = setInterval(() => {
      const randomStudent = students[Math.floor(Math.random() * students.length)];
      setCurrentStudent(randomStudent);
    }, 50);

    try {
      const [record] = await Promise.all([
        createRandomRollCall(currentClassId, rollCallCount, excludeRecentCount),
        delay(1200),
      ]);

      const selected = record.student_names.map((name, index) => {
        return studentByName.get(name) || {
          id: -index - 1,
          name,
          avatar: 1,
          class_id: currentClassId,
          group_id: null,
          total_score: 0,
          created_at: record.created_at,
        };
      });

      setRolledStudents(selected);
      toast.success(`点名完成！选中 ${selected.length} 人`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '点名失败');
    } finally {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }
      setCurrentStudent(null);
      setIsRolling(false);
    }
  }, [createRandomRollCall, currentClassId, excludeRecentCount, rollCallCount, studentByName, students]);

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
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="返回工具箱">
            <Link href="/tools">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            随机点名
          </h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>点名结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-[180px] flex items-center justify-center rounded-lg bg-muted/50 p-4">
              {isRolling && currentStudent ? (
                <div className="text-center animate-pulse">
                  <div className={cn('w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-3', getAvatarClass(currentStudent.avatar))}>
                    {currentStudent.name.charAt(0)}
                  </div>
                  <div className="text-2xl font-semibold">{currentStudent.name}</div>
                </div>
              ) : rolledStudents.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-4">
                  {rolledStudents.map((student) => (
                    <div key={`${student.id}-${student.name}`} className="text-center">
                      <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-1', getAvatarClass(student.avatar))}>
                        {student.name.charAt(0)}
                      </div>
                      <div className="font-medium">{student.name}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  点击开始随机点名
                </div>
              )}
            </div>

            <Button onClick={startRollCall} disabled={isRolling || students.length === 0} className="w-full">
              <Play className="h-4 w-4 mr-1" />
              {isRolling ? '点名中' : '开始点名'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>点名设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">点名人数</label>
              <Select
                value={rollCallCount.toString()}
                onValueChange={(value) => setRollCallCount(parseInt(value))}
                disabled={isRolling}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countOptions.map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}人</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">排除最近点名次数</label>
                <span className="text-sm font-medium text-primary">{excludeRecentCount}次</span>
              </div>
              <Input
                type="range"
                min={0}
                max={100}
                step={1}
                value={excludeRecentCount}
                onChange={(event) => setExcludeRecentCount(parseInt(event.target.value) || 0)}
                disabled={isRolling}
                className="h-2 cursor-pointer appearance-none rounded-full bg-muted p-0 accent-primary disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0次</span>
                <span>100次</span>
              </div>
              <p className="text-xs text-muted-foreground">
                最近这些点名记录里的学生姓名不会再次被抽中。
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              当前班级共有 {students.length} 名学生。排除过多时，后端会阻止点名，避免重复抽中。
            </div>

            <Button
              variant="outline"
              onClick={saveRollCallSettings}
              disabled={isRolling || isSavingSettings}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSavingSettings ? '保存中' : '保存设置'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            点名历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            {rollCallHistory.length > 0 ? (
              <div className="space-y-2 pr-3">
                {rollCallHistory.map((record) => (
                  <div key={record.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium">{record.student_names.join('、')}</div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(record.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无点名记录</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
