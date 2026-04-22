'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { GroupCard } from '@/components/features/GroupCard';
import { useStudentStore, useGroupStore, useRuleStore, useRecordStore, useAuthStore } from '@/store';
import { cn, getAvatarClass } from '@/lib/utils';
import type { Student, Group } from '@/types';
import { toast } from 'sonner';
import { Plus, Swords } from 'lucide-react';

const groupColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

export default function GroupsPage() {
  const { students, updateStudent, getStudentsByGroupId } = useStudentStore();
  const { groups, addGroup, updateGroup, deleteGroup, getGroupById } = useGroupStore();
  const { getRulesByType } = useRuleStore();
  const { addRecord } = useRecordStore();
  const isTeacher = useAuthStore((s) => s.role === 'teacher');
  const currentClassId = useAuthStore((s) => s.currentClassId);

  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [manageMembersOpen, setManageMembersOpen] = useState(false);
  const [teamScoreOpen, setTeamScoreOpen] = useState(false);
  const [assignGroupOpen, setAssignGroupOpen] = useState(false);
  const [pkModalOpen, setPkModalOpen] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [scoreAction, setScoreAction] = useState<'add' | 'minus'>('add');

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(1);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupLeaderId, setEditGroupLeaderId] = useState('');
  const [selectedScore, setSelectedScore] = useState(0);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [customScore, setCustomScore] = useState('');
  const [assignGroupId, setAssignGroupId] = useState('');

  const ungroupedStudents = useMemo(() => 
    students.filter(s => !s.group_id),
    [students]
  );

  const getGroupLeader = useCallback((groupId: number) => {
    const group = getGroupById(groupId);
    if (group?.leader_id) {
      return students.find(s => s.id === group.leader_id);
    }
    const members = getStudentsByGroupId(groupId);
    if (members.length > 0) {
      return members[0];
    }
    return null;
  }, [getGroupById, students, getStudentsByGroupId]);

  const getGroupTotalScore = useCallback((groupId: number) => {
    const members = getStudentsByGroupId(groupId);
    return members.reduce((sum, s) => sum + s.total_score, 0);
  }, [getStudentsByGroupId]);

  const handleAddGroup = async () => {
    if (!newGroupName.trim() || !currentClassId) return;
    await addGroup(currentClassId, { name: newGroupName.trim(), color: newGroupColor });
    toast.success('创建成功');
    setNewGroupName('');
    setNewGroupColor(1);
    setAddGroupOpen(false);
  };

  const handleEditGroup = async () => {
    if (!selectedGroup || !editGroupName.trim()) return;
    await updateGroup(selectedGroup.id, {
      name: editGroupName.trim(),
      leader_id: editGroupLeaderId ? parseInt(editGroupLeaderId) : null,
    });
    toast.success('保存成功');
    setEditGroupOpen(false);
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    if (confirm(`确定要删除"${selectedGroup.name}"吗？`)) {
      await deleteGroup(selectedGroup.id);
      toast.success('删除成功');
      setEditGroupOpen(false);
      if (currentClassId) useStudentStore.getState().fetchStudents(currentClassId);
    }
  };

  const handleTeamScore = async () => {
    if (!selectedGroup || !currentClassId) return;
    const members = getStudentsByGroupId(selectedGroup.id);
    if (members.length === 0) { toast.error('小组没有成员'); return; }
    
    const finalScore = customScore ? parseInt(customScore) : selectedScore;
    if (!finalScore) { toast.error('请选择规则或输入分值'); return; }

    const scoreValue = scoreAction === 'minus' ? -Math.abs(finalScore) : Math.abs(finalScore);
    
    for (const member of members) {
      await addRecord(currentClassId, {
        student_id: member.id,
        group_id: selectedGroup.id,
        rule_id: selectedRuleId,
        score: scoreValue,
        reason: `小组${scoreAction === 'add' ? '加分' : '扣分'}`,
      });
    }

    await useStudentStore.getState().fetchStudents(currentClassId);
    toast.success(`已为 ${members.length} 名成员${scoreAction === 'add' ? '加' : '扣'}分`);
    setTeamScoreOpen(false);
    resetScoreForm();
  };

  const handleAssignGroup = async () => {
    if (!selectedStudent) return;
    await updateStudent(selectedStudent.id, { group_id: assignGroupId ? parseInt(assignGroupId) : null });
    toast.success('分配成功');
    setAssignGroupOpen(false);
  };

  const handleAddMember = async (studentId: number, groupId: number) => {
    await updateStudent(studentId, { group_id: groupId });
    toast.success('已添加到小组');
  };

  const handleRemoveMember = async (studentId: number) => {
    await updateStudent(studentId, { group_id: null });
    toast.success('已移出小组');
  };

  const handleSetLeader = async (studentId: number, groupId: number) => {
    await updateGroup(groupId, { leader_id: studentId });
    toast.success('已设置为组长');
  };

  const resetScoreForm = () => {
    setSelectedScore(0);
    setSelectedRuleId(null);
    setCustomScore('');
  };

  const openEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setEditGroupName(group.name);
    setEditGroupLeaderId(group.leader_id ? String(group.leader_id) : '');
    setEditGroupOpen(true);
  };

  const openManageMembers = (group: Group) => {
    setSelectedGroup(group);
    setManageMembersOpen(true);
  };

  const openTeamScore = (group: Group, action: 'add' | 'minus') => {
    setSelectedGroup(group);
    setScoreAction(action);
    resetScoreForm();
    setTeamScoreOpen(true);
  };

  const openAssignGroup = (student: Student) => {
    setSelectedStudent(student);
    setAssignGroupId(student.group_id ? String(student.group_id) : '');
    setAssignGroupOpen(true);
  };

  const groupsWithScore = useMemo(() => {
    return groups.map(g => ({
      ...g,
      totalScore: getGroupTotalScore(g.id),
      memberCount: getStudentsByGroupId(g.id).length,
    })).sort((a, b) => b.totalScore - a.totalScore);
  }, [groups, getGroupTotalScore, getStudentsByGroupId]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>👥</span>
          小组管理
        </h2>
        {isTeacher && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPkModalOpen(true)}>
              <Swords className="h-4 w-4 mr-1" />
              小组PK
            </Button>
            <Button onClick={() => setAddGroupOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              创建小组
            </Button>
          </div>
        )}
      </div>

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groups.map((group) => {
            const members = getStudentsByGroupId(group.id);
            const leader = getGroupLeader(group.id);
            const totalScore = getGroupTotalScore(group.id);
            return (
              <GroupCard
                key={group.id}
                group={group}
                members={members}
                totalScore={totalScore}
                leader={leader || null}
                onAddScore={isTeacher ? () => openTeamScore(group, 'add') : undefined}
                onMinusScore={isTeacher ? () => openTeamScore(group, 'minus') : undefined}
                onEdit={isTeacher ? () => openEditGroup(group) : undefined}
                onManageMembers={isTeacher ? () => openManageMembers(group) : undefined}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium mb-2">还没有小组</h3>
          <p className="text-muted-foreground mb-4">创建小组来进行团队管理和PK竞赛</p>
          {isTeacher && <Button onClick={() => setAddGroupOpen(true)}>创建小组</Button>}
        </div>
      )}

      {isTeacher && ungroupedStudents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <span>👤</span>
            未分组学生 ({ungroupedStudents.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {ungroupedStudents.map((student) => (
              <div key={student.id} className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center gap-2">
                <div className={cn('w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-semibold', getAvatarClass(student.avatar))}>
                  {student.name.charAt(0)}
                </div>
                <div className="text-sm font-medium">{student.name}</div>
                <div className="text-sm text-primary font-bold">{student.total_score}分</div>
                <Button variant="outline" size="sm" onClick={() => openAssignGroup(student)}>
                  分配小组
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>创建小组</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">小组名称 *</label>
              <Input placeholder="例如：第一组" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">小组颜色</label>
              <div className="flex gap-2 flex-wrap">
                {groupColors.map((color, i) => (
                  <button key={i} className={cn('w-10 h-10 rounded-full border-3 transition-all', newGroupColor === i + 1 ? 'border-gray-800 scale-110' : 'border-transparent')} style={{ background: color }} onClick={() => setNewGroupColor(i + 1)} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGroupOpen(false)}>取消</Button>
            <Button onClick={handleAddGroup}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Modal */}
      <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑小组</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">小组名称</label>
              <Input value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">指定组长</label>
              <Select value={editGroupLeaderId || "__none__"} onValueChange={(v) => setEditGroupLeaderId(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="自动" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">自动</SelectItem>
                  {selectedGroup && getStudentsByGroupId(selectedGroup.id).map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name} ({m.total_score}分)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteGroup}>删除小组</Button>
            <Button variant="outline" onClick={() => setEditGroupOpen(false)}>取消</Button>
            <Button onClick={handleEditGroup}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Members Modal */}
      <Dialog open={manageMembersOpen} onOpenChange={setManageMembersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedGroup?.name} - 成员管理</DialogTitle></DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">当前成员 ({getStudentsByGroupId(selectedGroup.id).length})</h4>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {getStudentsByGroupId(selectedGroup.id).map(m => {
                      const isLeader = getGroupLeader(selectedGroup.id)?.id === m.id;
                      return (
                        <div key={m.id} className={cn('flex items-center gap-2 p-2 rounded-lg', isLeader ? 'bg-orange-50' : 'bg-muted/50')}>
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium', getAvatarClass(m.avatar))}>
                            {m.name.charAt(0)}
                          </div>
                          <span className={cn('flex-1', isLeader && 'font-semibold')}>{m.name} {isLeader && '👑'}</span>
                          {!isLeader && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleSetLeader(m.id, selectedGroup.id)}>设为组长</Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => handleRemoveMember(m.id)}>✕</Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">添加成员</h4>
                <ScrollArea className="h-32">
                  <div className="flex flex-wrap gap-2">
                    {students.filter(s => s.group_id !== selectedGroup.id).map(s => {
                      const currentGroup = s.group_id ? getGroupById(s.group_id) : null;
                      return (
                        <Button key={s.id} variant="outline" size="sm" onClick={() => handleAddMember(s.id, selectedGroup.id)}>
                          + {s.name}{currentGroup ? ` (${currentGroup.name})` : ''}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setManageMembersOpen(false)}>完成</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Score Modal */}
      <Dialog open={teamScoreOpen} onOpenChange={setTeamScoreOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>团队{scoreAction === 'add' ? '加分' : '扣分'}</DialogTitle></DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold">{selectedGroup.name}</h3>
                <p className="text-sm text-muted-foreground">{getStudentsByGroupId(selectedGroup.id).length} 名成员</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">选择规则</label>
                <div className="flex flex-wrap gap-2">
                  {getRulesByType(scoreAction).map(r => (
                    <Button key={r.id} variant={selectedRuleId === r.id ? 'default' : 'outline'} size="sm" onClick={() => { setSelectedRuleId(r.id); setSelectedScore(r.score); setCustomScore(''); }}>
                      {r.icon} {r.name} ({scoreAction === 'add' ? '+' : '-'}{r.score})
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">自定义分值</label>
                <Input type="number" min={1} value={customScore} onChange={(e) => { setCustomScore(e.target.value); setSelectedRuleId(null); }} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamScoreOpen(false)}>取消</Button>
            <Button variant={scoreAction === 'add' ? 'default' : 'destructive'} onClick={handleTeamScore}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Group Modal */}
      <Dialog open={assignGroupOpen} onOpenChange={setAssignGroupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>分配小组</DialogTitle></DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold', getAvatarClass(selectedStudent.avatar))}>
                  {selectedStudent.name.charAt(0)}
                </div>
                <div className="font-semibold">{selectedStudent.name}</div>
              </div>
              <Select value={assignGroupId || "__none__"} onValueChange={(v) => setAssignGroupId(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="不分组" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">不分组</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.name} ({getStudentsByGroupId(g.id).length}人)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignGroupOpen(false)}>取消</Button>
            <Button onClick={handleAssignGroup}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PK Modal */}
      <Dialog open={pkModalOpen} onOpenChange={setPkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="text-5xl mb-2">⚔️</div>
              小组积分PK榜
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2">
            <div className="space-y-3">
              {groupsWithScore.map((g, i) => {
                const maxScore = groupsWithScore[0]?.totalScore || 1;
                const percentage = (g.totalScore / maxScore) * 100;
                const bgColor = groupColors[(g.color - 1) % groupColors.length];
                return (
                  <div key={g.id} className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0', i === 0 && 'bg-gradient-to-br from-yellow-400 to-orange-500', i === 1 && 'bg-gradient-to-br from-gray-300 to-gray-400', i === 2 && 'bg-gradient-to-br from-amber-600 to-amber-700', i > 2 && 'bg-gray-200 text-gray-600')}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium truncate">{g.name}</span>
                        <span className="font-bold shrink-0 ml-2" style={{ color: bgColor }}>{g.totalScore}分</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: bgColor }} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {g.memberCount} 名成员 · 人均 {g.memberCount > 0 ? Math.round(g.totalScore / g.memberCount) : 0} 分
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter><Button onClick={() => setPkModalOpen(false)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
