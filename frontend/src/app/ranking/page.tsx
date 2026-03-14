'use client';

import { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useStudentStore, useGroupStore, useRecordStore } from '@/store';
import { cn, getAvatarClass } from '@/lib/utils';

type TimePeriod = 'all' | 'week' | 'month' | 'custom';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

const groupColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

function getPresetDateRange(period: Exclude<TimePeriod, 'custom'>): DateRange {
  if (period === 'all') return { start: null, end: null };
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  if (period === 'week') {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return { start: monday, end: todayEnd };
  }
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: todayEnd };
}

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}/${mm}/${dd} ${hh}:${mi}`;
}

function toDateTimeInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mi}`;
}

export default function RankingPage() {
  const { students } = useStudentStore();
  const { groups } = useGroupStore();
  const { records } = useRecordStore();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return toDateTimeInputValue(d);
  });
  const [customEnd, setCustomEnd] = useState(() => toDateTimeInputValue(new Date()));

  const activeDateRange = useMemo<DateRange>(() => {
    if (timePeriod === 'custom') {
      return { start: new Date(customStart), end: new Date(customEnd) };
    }
    return getPresetDateRange(timePeriod);
  }, [timePeriod, customStart, customEnd]);

  const rangeLabel = useMemo(() => {
    if (!activeDateRange.start || !activeDateRange.end) return '全部时间';
    return `${formatDate(activeDateRange.start)} ~ ${formatDate(activeDateRange.end)}`;
  }, [activeDateRange]);

  const studentScoreMap = useMemo(() => {
    const { start, end } = activeDateRange;
    if (!start) {
      return new Map(students.map(s => [s.id, s.totalScore]));
    }
    const map = new Map<string, number>();
    students.forEach(s => map.set(s.id, 0));
    records.forEach(r => {
      const t = new Date(r.createdAt);
      if (t >= start && (!end || t <= end) && map.has(r.studentId)) {
        map.set(r.studentId, (map.get(r.studentId) || 0) + r.score);
      }
    });
    return map;
  }, [students, records, activeDateRange]);

  const sortedStudents = useMemo(() =>
    [...students]
      .map(s => ({ ...s, displayScore: studentScoreMap.get(s.id) || 0 }))
      .sort((a, b) => b.displayScore - a.displayScore),
    [students, studentScoreMap]
  );

  const top3Students = sortedStudents.slice(0, 3);
  const restStudents = sortedStudents.slice(3);

  const groupsWithScore = useMemo(() => {
    return groups.map(g => {
      const members = students.filter(s => s.groupId === g.id);
      const totalScore = members.reduce((sum, m) => sum + (studentScoreMap.get(m.id) || 0), 0);
      return {
        ...g,
        totalScore,
        memberCount: members.length,
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [groups, students, studentScoreMap]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏆</span>
        <h2 className="text-lg font-semibold">排行榜</h2>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {([['all', '全部'], ['week', '本周'], ['month', '本月'], ['custom', '自定义']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTimePeriod(key)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                timePeriod === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {timePeriod === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="datetime-local"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm"
            />
            <span className="text-muted-foreground text-sm">至</span>
            <input
              type="datetime-local"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              min={customStart}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm"
            />
          </div>
        )}

        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span>📅</span>
          <span>统计范围：{rangeLabel}</span>
        </div>
      </div>

      <Tabs defaultValue="student">
        <TabsList>
          <TabsTrigger value="student">👤 个人榜</TabsTrigger>
          <TabsTrigger value="group">👥 小组榜</TabsTrigger>
        </TabsList>

        <TabsContent value="student" className="mt-6">
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-lg font-medium mb-2">暂无排名数据</h3>
              <p className="text-muted-foreground">添加学生并记录积分后即可查看排行榜</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              <div className="flex justify-center items-end gap-4 mb-8 px-4">
                {/* 2nd Place */}
                {top3Students[1] && (
                  <div className="text-center">
                    <div
                      className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-2',
                        'border-3 border-gray-400',
                        getAvatarClass(top3Students[1].avatar)
                      )}
                    >
                      {top3Students[1].name.charAt(0)}
                    </div>
                    <div className="font-semibold">{top3Students[1].name}</div>
                    <div className="text-xl font-bold text-primary">{top3Students[1].displayScore}分</div>
                    <div className="bg-gradient-to-br from-gray-300 to-gray-400 text-white px-6 py-2 rounded-t-lg mt-2">
                      🥈 第2名
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {top3Students[0] && (
                  <div className="text-center">
                    <div
                      className={cn(
                        'w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-semibold mx-auto mb-2',
                        'border-3 border-yellow-400 shadow-lg shadow-yellow-400/30',
                        getAvatarClass(top3Students[0].avatar)
                      )}
                    >
                      {top3Students[0].name.charAt(0)}
                    </div>
                    <div className="font-semibold text-lg">{top3Students[0].name}</div>
                    <div className="text-2xl font-bold text-primary">{top3Students[0].displayScore}分</div>
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-8 py-3 rounded-t-lg mt-2">
                      🥇 第1名
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {top3Students[2] && (
                  <div className="text-center">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-semibold mx-auto mb-2',
                        'border-3 border-amber-600',
                        getAvatarClass(top3Students[2].avatar)
                      )}
                    >
                      {top3Students[2].name.charAt(0)}
                    </div>
                    <div className="font-semibold">{top3Students[2].name}</div>
                    <div className="text-lg font-bold text-primary">{top3Students[2].displayScore}分</div>
                    <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white px-5 py-1.5 rounded-t-lg mt-2">
                      🥉 第3名
                    </div>
                  </div>
                )}
              </div>

              {/* Rest of ranking */}
              {restStudents.length > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    {restStudents.map((student, index) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground">
                          {index + 4}
                        </div>
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
                            getAvatarClass(student.avatar)
                          )}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1 font-medium">{student.name}</div>
                        <div className="font-bold text-primary">{student.displayScore}分</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="group" className="mt-6">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium mb-2">暂无小组数据</h3>
              <p className="text-muted-foreground">创建小组后即可查看小组排行榜</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-2">
                {groupsWithScore.map((group, index) => {
                  const bgColor = groupColors[(group.color - 1) % groupColors.length];
                  return (
                    <div
                      key={group.id}
                      className={cn(
                        'flex items-center gap-4 p-3 rounded-lg transition-colors',
                        index < 3 && 'bg-gradient-to-r from-transparent'
                      )}
                      style={index < 3 ? { background: `linear-gradient(90deg, ${bgColor}10, transparent)` } : undefined}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-white',
                          index === 0 && 'bg-gradient-to-br from-yellow-400 to-orange-500',
                          index === 1 && 'bg-gradient-to-br from-gray-300 to-gray-400',
                          index === 2 && 'bg-gradient-to-br from-amber-600 to-amber-700',
                          index > 2 && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {index + 1}
                      </div>
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                        style={{ background: bgColor }}
                      >
                        {group.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-muted-foreground">{group.memberCount} 名成员</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: bgColor }}>{group.totalScore}分</div>
                        <div className="text-xs text-muted-foreground">
                          人均 {group.memberCount > 0 ? Math.round(group.totalScore / group.memberCount) : 0} 分
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
