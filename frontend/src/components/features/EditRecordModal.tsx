'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, getAvatarClass } from '@/lib/utils';
import type { ScoreRecord } from '@/types';
import { useRuleStore, useRecordStore, useStudentStore } from '@/store';
import { toast } from 'sonner';

interface EditRecordModalProps {
  record: ScoreRecord | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditRecordModal({ record, open, onClose, onSuccess }: EditRecordModalProps) {
  const { rules } = useRuleStore();
  const { updateRecord } = useRecordStore();
  const { getStudentById, updateStudent } = useStudentStore();

  const [score, setScore] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (record) {
      setScore(Math.abs(record.score).toString());
      setReason(record.reason);
    }
  }, [record]);

  if (!record) return null;

  const student = getStudentById(record.studentId);
  const isAdd = record.score > 0;

  const handleSubmit = () => {
    const newAbsScore = parseInt(score);
    if (!newAbsScore || newAbsScore <= 0) {
      toast.error('请输入有效的分值');
      return;
    }

    const newScore = isAdd ? Math.abs(newAbsScore) : -Math.abs(newAbsScore);
    const scoreDiff = newScore - record.score;

    updateRecord(record.id, {
      score: newScore,
      reason: reason,
    });

    if (student && scoreDiff !== 0) {
      updateStudent(student.id, {
        totalScore: student.totalScore + scoreDiff,
      });
    }

    toast.success('记录已修改');
    onClose();
    onSuccess?.();
  };

  const filteredRules = rules.filter(r => r.type === (isAdd ? 'add' : 'minus'));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑积分记录</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {student && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
                  getAvatarClass(student.avatar)
                )}
              >
                {student.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold">{student.name}</div>
                <div className="text-sm text-muted-foreground">
                  当前总分: {student.totalScore}分
                </div>
              </div>
              <div className={cn(
                'ml-auto text-sm font-medium px-2 py-0.5 rounded',
                isAdd ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}>
                {isAdd ? '加分' : '扣分'}
              </div>
            </div>
          )}

          {filteredRules.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">快速选择分值</label>
              <div className="flex flex-wrap gap-2">
                {filteredRules.map((rule) => (
                  <Button
                    key={rule.id}
                    variant={parseInt(score) === rule.score ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      isAdd ? 'border-green-200' : 'border-red-200',
                      parseInt(score) === rule.score && (isAdd ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')
                    )}
                    onClick={() => {
                      setScore(rule.score.toString());
                      if (!reason) setReason(rule.name);
                    }}
                  >
                    {rule.icon} {rule.name} ({isAdd ? '+' : '-'}{rule.score})
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">分值</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="输入分值"
            />
            <p className="text-xs text-muted-foreground mt-1">
              原始分值: {isAdd ? '+' : ''}{record.score}
              {parseInt(score) > 0 && ` → 修改后: ${isAdd ? '+' : '-'}${parseInt(score)}`}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">原因/备注</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="输入原因"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit}>保存修改</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
