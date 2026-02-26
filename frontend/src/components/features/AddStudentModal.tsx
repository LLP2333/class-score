'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGroupStore, useStudentStore } from '@/store';
import { toast } from 'sonner';

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddStudentModal({ open, onClose, onSuccess }: AddStudentModalProps) {
  const { groups } = useGroupStore();
  const { addStudent } = useStudentStore();
  
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState<string>('');
  const [score, setScore] = useState('0');

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('请输入学生姓名');
      return;
    }

    addStudent({
      name: name.trim(),
      avatar: Math.floor(Math.random() * 8) + 1,
      groupId: groupId || null,
      totalScore: parseInt(score) || 0,
    });

    toast.success('添加成功');
    
    // Reset form
    setName('');
    setGroupId('');
    setScore('0');
    
    onClose();
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加学生</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">学生姓名 *</label>
            <Input
              placeholder="请输入学生姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">所属小组</label>
            <Select value={groupId || "__none__"} onValueChange={(v) => setGroupId(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="未分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未分组</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">初始积分</label>
            <Input
              type="number"
              min={0}
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
