'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useRecordStore, useStudentStore, useRuleStore, useGroupStore } from '@/store';
import { cn, getAvatarClass } from '@/lib/utils';
import { EditRecordModal } from '@/components/features/EditRecordModal';
import type { ScoreRecord } from '@/types';
import { toast } from 'sonner';

type FilterType = 'all' | 'add' | 'minus';

export default function TimelinePage() {
  const { records, deleteRecord } = useRecordStore();
  const { students, getStudentById, updateStudent } = useStudentStore();
  const { getRuleById } = useRuleStore();
  const { getGroupById } = useGroupStore();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchName, setSearchName] = useState('');
  const [editingRecord, setEditingRecord] = useState<ScoreRecord | null>(null);

  const handleDeleteRecord = (record: ScoreRecord) => {
    if (!confirm('确定要删除这条积分记录吗？学生总分将自动调整。')) return;
    const student = getStudentById(record.studentId);
    deleteRecord(record.id);
    if (student) {
      updateStudent(student.id, {
        totalScore: student.totalScore - record.score,
      });
    }
    toast.success('记录已删除，总分已调整');
  };

  const matchedStudentIds = useMemo(() => {
    const keyword = searchName.trim();
    if (!keyword) return null;
    return new Set(
      students.filter(s => s.name.includes(keyword)).map(s => s.id)
    );
  }, [students, searchName]);

  const filteredRecords = useMemo(() => {
    let result = [...records];
    
    if (matchedStudentIds) {
      result = result.filter(r => matchedStudentIds.has(r.studentId));
    }

    if (filter === 'add') {
      result = result.filter(r => r.score > 0);
    } else if (filter === 'minus') {
      result = result.filter(r => r.score < 0);
    }
    
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [records, filter, matchedStudentIds]);

  // Group records by date
  const groupedRecords = useMemo(() => {
    const groups: Record<string, typeof filteredRecords> = {};
    
    filteredRecords.forEach(record => {
      const date = new Date(record.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
    });
    
    return groups;
  }, [filteredRecords]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>📅</span>
          积分时间线
        </h2>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="搜索学生姓名..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-40 h-9"
          />
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="add">加分</TabsTrigger>
              <TabsTrigger value="minus">扣分</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Timeline */}
      {Object.keys(groupedRecords).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedRecords).map(([date, dayRecords]) => (
            <div key={date}>
              {/* Date header */}
              <div className="sticky top-0 z-10 bg-background py-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm font-medium">
                  <span>📆</span>
                  {date}
                  <span className="text-muted-foreground">({dayRecords.length}条)</span>
                </div>
              </div>
              
              {/* Records for this date */}
              <div className="relative ml-4 pl-6 border-l-2 border-muted space-y-3 mt-3">
                {dayRecords.map((record) => {
                  const student = getStudentById(record.studentId);
                  const rule = record.ruleId ? getRuleById(record.ruleId) : null;
                  const group = student?.groupId ? getGroupById(student.groupId) : null;
                  
                  return (
                    <div key={record.id} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          'absolute -left-[29px] w-4 h-4 rounded-full border-2 border-background',
                          record.score > 0 ? 'bg-green-500' : 'bg-red-500'
                        )}
                      />
                      
                      {/* Record card */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Student avatar */}
                            {student && (
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0',
                                  getAvatarClass(student.avatar)
                                )}
                              >
                                {student.name.charAt(0)}
                              </div>
                            )}
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{student?.name || '未知学生'}</span>
                                {group && (
                                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                    {group.name}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm mt-1 flex items-center gap-1">
                                <span>{rule?.icon || '📝'}</span>
                                <span className="text-foreground">{rule?.name || record.reason || '积分变动'}</span>
                              </div>
                            </div>
                            
                            {/* Score, time, and actions */}
                            <div className="text-right shrink-0 flex items-start gap-2">
                              <div>
                                <div
                                  className={cn(
                                    'text-lg font-bold',
                                    record.score > 0 ? 'text-green-600' : 'text-red-600'
                                  )}
                                >
                                  {record.score > 0 ? '+' : ''}{record.score}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(record.createdAt).toLocaleTimeString('zh-CN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <span className="text-sm">⋮</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingRecord(record)}>
                                    ✏️ 编辑记录
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => handleDeleteRecord(record)}
                                  >
                                    🗑️ 删除记录
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">{searchName ? '🔍' : '📅'}</div>
          <h3 className="text-lg font-medium mb-2">
            {searchName ? `未找到"${searchName}"的积分记录` : '暂无积分记录'}
          </h3>
          <p className="text-muted-foreground">
            {searchName ? '请检查学生姓名是否正确' : '开始为学生加减分后，记录会显示在这里'}
          </p>
        </div>
      )}

      <EditRecordModal
        record={editingRecord}
        open={!!editingRecord}
        onClose={() => setEditingRecord(null)}
      />
    </div>
  );
}
