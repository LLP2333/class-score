'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentStore, useSettingsStore } from '@/store';
import { cn, getAvatarClass, formatRelativeTime } from '@/lib/utils';
import type { Student } from '@/types';
import { toast } from 'sonner';
import { Play, History, Users, Dices } from 'lucide-react';

export default function ToolsPage() {
  const { students } = useStudentStore();
  const { rollCallHistory, addRollCallRecord } = useSettingsStore();

  // Roll call state
  const [rollCallCount, setRollCallCount] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [rolledStudents, setRolledStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [rollCallHistoryOpen, setRollCallHistoryOpen] = useState(false);

  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    };
  }, []);

  // Roll call logic
  const startRollCall = useCallback(() => {
    if (students.length === 0) {
      toast.error('没有学生可以点名');
      return;
    }
    if (rollCallCount > students.length) {
      toast.error('点名人数不能超过学生总数');
      return;
    }

    setIsRolling(true);
    setRolledStudents([]);
    setCurrentStudent(null);

    let elapsed = 0;
    const duration = 2000; // 2 seconds
    const interval = 50; // Update every 50ms

    rollIntervalRef.current = setInterval(() => {
      // Show random student during rolling
      const randomStudent = students[Math.floor(Math.random() * students.length)];
      setCurrentStudent(randomStudent);
      
      elapsed += interval;
      
      if (elapsed >= duration) {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        
        // Select final students
        const shuffled = [...students].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, rollCallCount);
        
        setRolledStudents(selected);
        setCurrentStudent(null);
        setIsRolling(false);
        
        // Save to history
        addRollCallRecord(selected.map(s => s.name));
        
        toast.success(`点名完成！选中 ${selected.length} 人`);
      }
    }, interval);
  }, [students, rollCallCount, addRollCallRecord]);

  const stopRollCall = useCallback(() => {
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }
    
    // Select final students immediately
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, rollCallCount);
    
    setRolledStudents(selected);
    setCurrentStudent(null);
    setIsRolling(false);
    
    addRollCallRecord(selected.map(s => s.name));
    toast.success(`点名完成！选中 ${selected.length} 人`);
  }, [students, rollCallCount, addRollCallRecord]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <span>🧰</span>
        工具箱
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Roll Call */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              随机点名
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Settings */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">点名人数:</label>
              <Select
                value={rollCallCount.toString()}
                onValueChange={(v) => setRollCallCount(parseInt(v))}
                disabled={isRolling}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}人</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rolling display */}
            <div className="min-h-[120px] flex items-center justify-center bg-muted/50 rounded-xl p-4">
              {isRolling && currentStudent ? (
                <div className="text-center animate-pulse">
                  <div className={cn('w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-2', getAvatarClass(currentStudent.avatar))}>
                    {currentStudent.name.charAt(0)}
                  </div>
                  <div className="text-xl font-semibold">{currentStudent.name}</div>
                </div>
              ) : rolledStudents.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-4">
                  {rolledStudents.map((student) => (
                    <div key={student.id} className="text-center">
                      <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-1', getAvatarClass(student.avatar))}>
                        {student.name.charAt(0)}
                      </div>
                      <div className="font-medium">{student.name}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center">
                  <Dices className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  点击开始随机点名
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isRolling ? (
                <Button onClick={stopRollCall} variant="destructive" className="flex-1">
                  停止
                </Button>
              ) : (
                <Button onClick={startRollCall} className="flex-1">
                  <Play className="h-4 w-4 mr-1" />
                  开始点名
                </Button>
              )}
              <Button variant="outline" onClick={() => setRollCallHistoryOpen(true)}>
                <History className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Roll Call History Modal */}
      <Dialog open={rollCallHistoryOpen} onOpenChange={setRollCallHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>点名历史</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-80">
            {rollCallHistory.length > 0 ? (
              <div className="space-y-2">
                {rollCallHistory.map((record) => (
                  <div key={record.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{record.students.join('、')}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(record.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无点名记录</p>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setRollCallHistoryOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
