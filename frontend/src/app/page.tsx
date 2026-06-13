'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard, StudentCard, ScoreModal, BatchScoreModal, AddStudentModal, StudentDetailModal } from '@/components/features';
import { useStudentStore, useGroupStore, useAuthStore } from '@/store';
import type { Student } from '@/types';
import { Plus, Minus, Search, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const { students } = useStudentStore();
  const { groups } = useGroupStore();
  const isTeacher = useAuthStore((s) => s.role === 'teacher');
  const currentClassId = useAuthStore((s) => s.currentClassId);
  
  const [searchText, setSearchText] = useState('');
  const [activeGroupId, setActiveGroupId] = useState('all');
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoreModalAction, setScoreModalAction] = useState<'add' | 'minus'>('add');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchAction, setBatchAction] = useState<'add' | 'minus'>('add');

  const stats = useMemo(() => {
    const totalScore = students.reduce((sum, s) => sum + s.total_score, 0);
    const maxScore = students.length > 0 ? Math.max(...students.map(s => s.total_score)) : 0;
    const avgScore = students.length > 0 ? Math.round(totalScore / students.length) : 0;
    
    return {
      studentCount: students.length,
      groupCount: groups.length,
      maxScore,
      avgScore,
    };
  }, [students, groups]);

  const filteredStudents = useMemo(() => {
    let result = students;
    
    if (searchText) {
      result = result.filter(s => s.name.includes(searchText));
    }
    
    if (activeGroupId !== 'all') {
      const gid = parseInt(activeGroupId);
      result = result.filter(s => s.group_id === gid);
    }
    
    return result;
  }, [students, searchText, activeGroupId]);

  const handleAddScore = useCallback((student: Student) => {
    setSelectedStudent(student);
    setScoreModalAction('add');
    setScoreModalOpen(true);
  }, []);

  const handleMinusScore = useCallback((student: Student) => {
    setSelectedStudent(student);
    setScoreModalAction('minus');
    setScoreModalOpen(true);
  }, []);

  const handleStudentClick = useCallback((student: Student) => {
    setSelectedStudent(student);
    setDetailModalOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    if (currentClassId) {
      useStudentStore.getState().fetchStudents(currentClassId);
    }
  }, [currentClassId]);

  const selectedStudents = useMemo(
    () => students.filter(s => selectedIds.has(s.id)),
    [students, selectedIds]
  );

  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = filteredStudents.length > 0 && filteredStudents.every(s => next.has(s.id));
      if (allSelected) {
        filteredStudents.forEach(s => next.delete(s.id));
      } else {
        filteredStudents.forEach(s => next.add(s.id));
      }
      return next;
    });
  }, [filteredStudents]);

  const toggleBatchMode = useCallback(() => {
    setBatchMode(prev => !prev);
    setSelectedIds(new Set());
  }, []);

  const openBatchModal = useCallback((action: 'add' | 'minus') => {
    if (selectedIds.size === 0) {
      toast.error('请先选择学生');
      return;
    }
    setBatchAction(action);
    setBatchModalOpen(true);
  }, [selectedIds]);

  const handleBatchSuccess = useCallback(() => {
    handleRefresh();
    setBatchMode(false);
    setSelectedIds(new Set());
  }, [handleRefresh]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon="👥" value={stats.studentCount} label="班级人数" color="purple" />
        <StatsCard icon="⭐" value={stats.maxScore} label="最高积分" color="orange" />
        <StatsCard icon="📊" value={stats.avgScore} label="平均积分" color="green" />
        <StatsCard icon="🏠" value={stats.groupCount} label="小组数量" color="blue" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>👨‍🎓</span>
          学生快速管理
        </h2>
        {isTeacher && (
          <div className="flex gap-2">
            {batchMode ? (
              <Button variant="secondary" onClick={toggleBatchMode}>
                退出批量
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={toggleBatchMode}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  批量加减分
                </Button>
                <Button onClick={() => setAddStudentModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加学生
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索学生姓名..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeGroupId} onValueChange={setActiveGroupId}>
        <TabsList className="w-full justify-start flex-wrap h-auto group-data-[orientation=horizontal]/tabs:h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="all" className="flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            全部
          </TabsTrigger>
          {groups.map((group) => (
            <TabsTrigger
              key={group.id}
              value={String(group.id)}
              className="flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {group.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isTeacher && batchMode && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/95 backdrop-blur p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={toggleSelectAll} disabled={filteredStudents.length === 0}>
              {allFilteredSelected ? '取消全选' : '全选'}
            </Button>
            <span className="text-sm text-muted-foreground">
              已选 <span className="font-semibold text-foreground">{selectedIds.size}</span> 人
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => openBatchModal('add')}
              disabled={selectedIds.size === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              批量加分
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => openBatchModal('minus')}
              disabled={selectedIds.size === 0}
            >
              <Minus className="h-4 w-4 mr-1" />
              批量扣分
            </Button>
          </div>
        </div>
      )}

      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onAddScore={isTeacher && !batchMode ? () => handleAddScore(student) : undefined}
              onMinusScore={isTeacher && !batchMode ? () => handleMinusScore(student) : undefined}
              onClick={() => handleStudentClick(student)}
              selectable={isTeacher && batchMode}
              selected={selectedIds.has(student.id)}
              onToggleSelect={() => toggleSelect(student.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium mb-2">还没有学生</h3>
          <p className="text-muted-foreground mb-4">
            {isTeacher ? '点击「添加学生」开始创建班级学生名单' : '老师还没有添加学生'}
          </p>
          {isTeacher && (
            <Button onClick={() => setAddStudentModalOpen(true)}>
              添加学生
            </Button>
          )}
        </div>
      )}

      {isTeacher && (
        <>
          <ScoreModal
            student={selectedStudent}
            action={scoreModalAction}
            open={scoreModalOpen}
            onClose={() => setScoreModalOpen(false)}
            onSuccess={handleRefresh}
          />

          <BatchScoreModal
            students={selectedStudents}
            action={batchAction}
            open={batchModalOpen}
            onClose={() => setBatchModalOpen(false)}
            onSuccess={handleBatchSuccess}
          />
          
          <AddStudentModal
            open={addStudentModalOpen}
            onClose={() => setAddStudentModalOpen(false)}
            onSuccess={handleRefresh}
          />
        </>
      )}
      
      <StudentDetailModal
        student={selectedStudent}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onUpdate={handleRefresh}
      />
    </div>
  );
}
