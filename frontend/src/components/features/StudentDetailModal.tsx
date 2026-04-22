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
import { useGroupStore, useStudentStore, useRecordStore, useRuleStore, useAuthStore } from '@/store';
import { usePetStore } from '@/store/usePetStore';
import { PetDisplay } from '@/components/features/PetDisplay';
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
  const { getRecordsByStudentId, deleteRecord } = useRecordStore();
  const { getRuleById } = useRuleStore();
  const { config: petConfig, getStudentPet, getPetStage, getPetSpecies } = usePetStore();
  const isTeacher = useAuthStore((s) => s.role === 'teacher');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editingRecord, setEditingRecord] = useState<ScoreRecord | null>(null);

  const student = studentProp ? getStudentById(studentProp.id) ?? studentProp : null;

  const handleDeleteRecord = async (record: ScoreRecord) => {
    if (!confirm('确定要删除这条积分记录吗？学生总分将自动调整。')) return;
    const deleted = await deleteRecord(record.id);
    if (deleted) {
      toast.success('记录已删除，总分已调整');
      onUpdate?.();
    }
  };

  if (!student) return null;

  const records = getRecordsByStudentId(student.id).slice(0, 10);
  const group = student.group_id ? getGroupById(student.group_id) : null;

  const handleEdit = () => {
    setEditName(student.name);
    setEditGroupId(student.group_id ? String(student.group_id) : '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error('请输入学生姓名');
      return;
    }

    const updated = await updateStudent(student.id, {
      name: editName.trim(),
      group_id: editGroupId ? parseInt(editGroupId) : null,
    });

    if (updated) {
      toast.success('保存成功');
      setIsEditing(false);
      onUpdate?.();
    }
  };

  const handleDelete = async () => {
    if (confirm(`确定要删除学生"${student.name}"吗？此操作不可撤销。`)) {
      const success = await deleteStudent(student.id);
      if (success) {
        toast.success('删除成功');
        onClose();
        onUpdate?.();
      }
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
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="text-2xl font-bold text-primary">{student.total_score}分</div>
            {group && <Badge variant="secondary">{group.name}</Badge>}
          </div>

          {petConfig?.enabled && (() => {
            const pet = getStudentPet(student.id);
            const stage = pet ? getPetStage(student.id, student.total_score) : null;
            const sp = pet ? getPetSpecies(pet.species_id) : null;
            if (!pet || !stage || !sp) return null;

            const nextStage = sp.stages.find((s) => s.level === stage.level + 1);

            return (
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <div className="flex items-center gap-3">
                  <PetDisplay stage={stage} species={sp} size="sm" animate />
                  <div>
                    <div className="text-sm font-semibold">{pet.nickname}</div>
                    <div className="text-xs text-muted-foreground">
                      {stage.name} · Lv.{stage.level}
                    </div>
                  </div>
                  {nextStage && (
                    <div className="ml-auto text-right">
                      <div className="text-xs text-muted-foreground">下次进化</div>
                      <div className="text-sm font-semibold text-primary">
                        还需{nextStage.min_score - student.total_score}分
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div>
            <h4 className="text-sm font-medium mb-2">最近记录</h4>
            {records.length > 0 ? (
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {records.map((record) => {
                    const rule = record.rule_id ? getRuleById(record.rule_id) : null;
                    return (
                      <div
                        key={record.id}
                        className="group flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span>{rule?.icon || '📝'}</span>
                          <span className="text-sm truncate">
                            {rule?.name || record.reason || '积分变动'}
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
                            {formatRelativeTime(record.created_at)}
                          </span>
                          {isTeacher && (
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
                          )}
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
          {isTeacher && (
            <>
              <Button variant="outline" onClick={handleEdit}>编辑</Button>
              <Button variant="destructive" onClick={handleDelete}>删除</Button>
            </>
          )}
          <Button onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>

      {isTeacher && (
        <EditRecordModal
          record={editingRecord}
          open={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={onUpdate}
        />
      )}
    </Dialog>
  );
}
