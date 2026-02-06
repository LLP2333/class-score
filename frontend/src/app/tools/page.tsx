'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentStore, useSettingsStore } from '@/store';
import { cn, getAvatarClass, formatRelativeTime } from '@/lib/utils';
import type { Student } from '@/types';
import { toast } from 'sonner';
import { Play, History, Users, Gift, Dices } from 'lucide-react';

export default function ToolsPage() {
  const { students } = useStudentStore();
  const { rollCallHistory, lotteryHistory, addRollCallRecord, addLotteryRecord } = useSettingsStore();

  // Roll call state
  const [rollCallCount, setRollCallCount] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [rolledStudents, setRolledStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [rollCallHistoryOpen, setRollCallHistoryOpen] = useState(false);

  // Lottery state
  const [lotteryRunning, setLotteryRunning] = useState(false);
  const [lotteryResult, setLotteryResult] = useState<string | null>(null);
  const lotteryPrizes = useMemo(() => [
    '再接再厉', '加油鼓励', '小礼物', '免作业卡',
    '谢谢参与', '积分+5', '积分+10', '神秘礼物', '特等奖'
  ], []);
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [lotteryHistoryOpen, setLotteryHistoryOpen] = useState(false);
  
  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lotteryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (lotteryIntervalRef.current) clearInterval(lotteryIntervalRef.current);
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

  // Lottery logic
  const startLottery = useCallback(() => {
    if (!selectedStudentId) {
      toast.error('请选择参与抽奖的学生');
      return;
    }

    setLotteryRunning(true);
    setLotteryResult(null);

    let elapsed = 0;
    const duration = 3000; // 3 seconds
    const interval = 100;

    lotteryIntervalRef.current = setInterval(() => {
      setCurrentPrizeIndex(Math.floor(Math.random() * lotteryPrizes.length));
      elapsed += interval;

      if (elapsed >= duration) {
        if (lotteryIntervalRef.current) clearInterval(lotteryIntervalRef.current);
        
        // Select random prize
        const prizeIndex = Math.floor(Math.random() * lotteryPrizes.length);
        const prize = lotteryPrizes[prizeIndex];
        
        setCurrentPrizeIndex(prizeIndex);
        setLotteryResult(prize);
        setLotteryRunning(false);
        
        // Save to history
        addLotteryRecord(prize, selectedStudentId);
        
        toast.success(`恭喜抽中：${prize}`);
      }
    }, interval);
  }, [selectedStudentId, lotteryPrizes, addLotteryRecord]);

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

        {/* Lottery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              九宫格抽奖
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prize Grid */}
            <div className="grid grid-cols-3 gap-2">
              {lotteryPrizes.map((prize, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg text-center text-sm font-medium transition-all',
                    currentPrizeIndex === index && lotteryRunning
                      ? 'bg-primary text-primary-foreground scale-105'
                      : lotteryResult === prize && !lotteryRunning
                      ? 'bg-green-500 text-white scale-105'
                      : 'bg-muted'
                  )}
                >
                  {prize}
                </div>
              ))}
            </div>

            {/* Student selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">选择学生</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={lotteryRunning}>
                <SelectTrigger>
                  <SelectValue placeholder="选择参与抽奖的学生" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Result */}
            {lotteryResult && !lotteryRunning && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-1">🎉</div>
                <div className="font-semibold text-green-600">恭喜获得: {lotteryResult}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={startLottery}
                className="flex-1"
                disabled={lotteryRunning || !selectedStudentId}
              >
                {lotteryRunning ? '抽奖中...' : '开始抽奖'}
              </Button>
              <Button variant="outline" onClick={() => setLotteryHistoryOpen(true)}>
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

      {/* Lottery History Modal */}
      <Dialog open={lotteryHistoryOpen} onOpenChange={setLotteryHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>抽奖历史</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-80">
            {lotteryHistory.length > 0 ? (
              <div className="space-y-2">
                {lotteryHistory.map((record) => {
                  const student = students.find(s => s.id === record.studentId);
                  return (
                    <div key={record.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      {student && (
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold', getAvatarClass(student.avatar))}>
                          {student.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{student?.name || '未知学生'}</div>
                        <div className="text-sm text-primary">获得: {record.prize}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(record.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无抽奖记录</p>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setLotteryHistoryOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
