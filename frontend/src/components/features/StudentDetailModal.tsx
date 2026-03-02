'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, getAvatarClass, formatRelativeTime } from '@/lib/utils';
import type { Student, ScoreRecord } from '@/types';
import { useGroupStore, useStudentStore, useRecordStore, useRuleStore } from '@/store';
import { EditRecordModal } from '@/components/features/EditRecordModal';
import { toast } from 'sonner';

interface StudentDetailModalProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function StudentDetailModal({ student: studentProp, open, onClose, onUpdate }: StudentDetailModalProps) {
  const { groups, getGroupById } = useGroupStore();
  const { getStudentById, updateStudent, deleteStudent } = useStudentStore();
  const { getRecordsByStudentId, deleteRecordsByStudentId, deleteRecord } = useRecordStore();
  const { getRuleById } = useRuleStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editScore, setEditScore] = useState('');
  const [editingRecord, setEditingRecord] = useState<ScoreRecord | null>(null);

  const student = studentProp ? getStudentById(studentProp.id) ?? studentProp : null;

  const handleDeleteRecord = (record: ScoreRecord) => {
    if (!confirm('确定要删除这条积分记录吗？学生总分将自动调整。')) return;
    const currentStudent = student ? getStudentById(student.id) : null;
    deleteRecord(record.id);
    if (currentStudent) {
      updateStudent(currentStudent.id, {
        totalScore: currentStudent.totalScore - record.score,
      });
    }
    toast.success('记录已删除，总分已调整');
    onUpdate?.();
  };

  if (!student) return null;

  const records = getRecordsByStudentId(student.id).slice(0, 10);
  const group = student.groupId ? getGroupById(student.groupId) : null;

  const handleEdit = () => {
    setEditName(student.name);
    setEditGroupId(student.groupId || '');
    setEditScore(student.totalScore.toString());
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      toast.error('请输入学生姓名');
      return;
    }

    updateStudent(student.id, {
      name: editName.trim(),
      groupId: editGroupId || null,
      totalScore: parseInt(editScore) || 0,
    });

    toast.success('保存成功');
    setIsEditing(false);
    onUpdate?.();
  };

  const handleDelete = () => {
    if (confirm(`确定要删除学生"${student.name}"吗？此操作不可撤销。`)) {
      deleteStudent(student.id);
      deleteRecordsByStudentId(student.id);
      toast.success('删除成功');
      onClose();
      onUpdate?.();
    }
  };

  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑学生</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">学生姓名</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">所属小组</label>
              <Select value={editGroupId || "__none__"} onValueChange={(v) => setEditGroupId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="未分组" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">未分组</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">当前积分</label>
              <Input
                type="number"
                value={editScore}
                onChange={(e) => setEditScore(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>取消</Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>学生详情</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Student info */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center',
                'text-white text-3xl font-semibold',
                getAvatarClass(student.avatar)
              )}
            >
              {student.name.charAt(0)}
            </div>
            <div className="text-lg font-semibold">{student.name}</div>
            <div className="text-2xl font-bold text-primary">{student.totalScore}分</div>
            {group && <Badge variant="secondary">{group.name}</Badge>}
          </div>

          {/* Recent records */}
          <div>
            <h4 className="text-sm font-medium mb-2">最近记录</h4>
            {records.length > 0 ? (
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {records.map((record) => {
                    const rule = record.ruleId ? getRuleById(record.ruleId) : null;
                    return (
                      <div
                        key={record.id}
                        className="group flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span>{rule?.icon || '📝'}</span>
                          <span className="text-sm truncate">
                            {record.reason || rule?.name || '积分变动'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              'font-semibold',
                              record.score >= 0 ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {record.score >= 0 ? '+' : ''}{record.score}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(record.createdAt)}
                          </span>
                          <div className="hidden group-hover:flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-xs"
                              onClick={() => setEditingRecord(record)}
                              title="编辑"
                            >
                              ✏️
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-xs"
                              onClick={() => handleDeleteRecord(record)}
                              title="删除"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">暂无记录</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleEdit}>编辑</Button>
          <Button variant="destructive" onClick={handleDelete}>删除</Button>
          <Button onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>

      <EditRecordModal
        record={editingRecord}
        open={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSuccess={onUpdate}
      />
    </Dialog>
  );
}
