'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Student, Rule } from '@/types';
import { useRuleStore, useRecordStore, useAuthStore } from '@/store';
import { toast } from 'sonner';

interface BatchScoreModalProps {
  students: Student[];
  action: 'add' | 'minus';
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BatchScoreModal({ students, action, open, onClose, onSuccess }: BatchScoreModalProps) {
  const { rules } = useRuleStore();
  const { addRecord } = useRecordStore();
  const currentClassId = useAuthStore((s) => s.currentClassId);

  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [selectedScore, setSelectedScore] = useState(0);
  const [customScore, setCustomScore] = useState('');
  const [reason, setReason] = useState('');
  const [ruleSearch, setRuleSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredRules = rules
    .filter(r => r.type === action)
    .filter(r => !ruleSearch.trim() || r.name.includes(ruleSearch.trim()));

  const handleRuleSelect = (rule: Rule) => {
    setSelectedRuleId(rule.id);
    setSelectedScore(rule.score);
    setCustomScore('');
  };

  const resetForm = () => {
    setSelectedRuleId(null);
    setSelectedScore(0);
    setCustomScore('');
    setReason('');
    setRuleSearch('');
  };

  const handleSubmit = async () => {
    if (students.length === 0 || !currentClassId) return;

    const finalScore = customScore ? parseInt(customScore) : selectedScore;
    if (!finalScore) {
      toast.error('请选择规则或输入分值');
      return;
    }

    const scoreValue = action === 'minus' ? -Math.abs(finalScore) : Math.abs(finalScore);
    const selectedRule = selectedRuleId ? rules.find(r => r.id === selectedRuleId) : null;
    const finalReason = reason || selectedRule?.name || (action === 'add' ? '批量加分' : '批量扣分');

    setSubmitting(true);
    let successCount = 0;
    for (const student of students) {
      const record = await addRecord(currentClassId, {
        student_id: student.id,
        group_id: student.group_id,
        rule_id: selectedRuleId,
        score: scoreValue,
        reason: finalReason,
      });
      if (record) successCount++;
    }
    setSubmitting(false);

    if (successCount > 0) {
      toast.success(`已为 ${successCount} 名学生${action === 'add' ? '加' : '扣'}分: ${action === 'add' ? '+' : ''}${scoreValue}分`);
    } else {
      toast.error('操作失败');
    }

    resetForm();
    onClose();
    onSuccess?.();
  };

  if (students.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>批量{action === 'add' ? '加分' : '扣分'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
            <div className="text-sm font-medium mb-2">
              已选 <span className="text-primary">{students.length}</span> 名学生
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {students.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-xs"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium whitespace-nowrap">
                {action === 'add' ? '加分' : '扣分'}原因
              </label>
              <Input
                placeholder="搜索关键词..."
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div
              className="flex flex-wrap gap-2 max-h-52 overflow-y-auto min-w-0 rounded-md border border-border/40 p-2"
              style={{ scrollbarWidth: 'thin' }}
            >
              {filteredRules.map((rule) => (
                <Button
                  key={rule.id}
                  variant={selectedRuleId === rule.id ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'whitespace-normal h-auto text-left',
                    action === 'add' ? 'border-green-200' : 'border-red-200',
                    selectedRuleId === rule.id && (action === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')
                  )}
                  onClick={() => handleRuleSelect(rule)}
                >
                  {rule.icon} {rule.name} ({action === 'add' ? '+' : '-'}{rule.score})
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">自定义分值</label>
            <Input
              type="number"
              placeholder="输入自定义分值"
              min={1}
              max={100}
              value={customScore}
              onChange={(e) => {
                setCustomScore(e.target.value);
                setSelectedRuleId(null);
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">备注</label>
            <Input
              placeholder="可选备注"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>取消</Button>
          <Button
            variant={action === 'add' ? 'default' : 'destructive'}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '处理中...' : `确认${action === 'add' ? '加分' : '扣分'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
