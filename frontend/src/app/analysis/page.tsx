'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStudentStore, useGroupStore, useRecordStore, useRuleStore } from '@/store';
import { StatsCard } from '@/components/features';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalysisPage() {
  const { students } = useStudentStore();
  const { groups } = useGroupStore();
  const { records } = useRecordStore();
  const { rules } = useRuleStore();

  // Statistics
  const stats = useMemo(() => {
    const totalScore = students.reduce((sum, s) => sum + s.totalScore, 0);
    const maxScore = students.length > 0 ? Math.max(...students.map(s => s.totalScore)) : 0;
    const avgScore = students.length > 0 ? Math.round(totalScore / students.length) : 0;
    return {
      studentCount: students.length,
      groupCount: groups.length,
      maxScore,
      avgScore,
      totalRecords: records.length,
    };
  }, [students, groups, records]);

  // Weekly trend data
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const weeks: { label: string; value: number }[] = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekRecords = records.filter(r => {
        const date = new Date(r.createdAt);
        return date >= weekStart && date <= weekEnd;
      });
      
      const total = weekRecords.reduce((sum, r) => sum + r.score, 0);
      weeks.push({
        label: `第${4-i}周`,
        value: total
      });
    }
    
    return weeks;
  }, [records]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    
    records.forEach(record => {
      const rule = rules.find(r => r.id === record.ruleId);
      if (rule) {
        const category = rule.category;
        distribution[category] = (distribution[category] || 0) + Math.abs(record.score);
      }
    });
    
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [records, rules]);

  // Top students
  const topStudents = useMemo(() => 
    [...students].sort((a, b) => b.totalScore - a.totalScore).slice(0, 10),
    [students]
  );

  // Chart data
  const lineChartData = {
    labels: weeklyTrend.map(w => w.label),
    datasets: [{
      label: '积分变化',
      data: weeklyTrend.map(w => w.value),
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const barChartData = {
    labels: topStudents.map(s => s.name),
    datasets: [{
      label: '积分',
      data: topStudents.map(s => s.totalScore),
      backgroundColor: [
        '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6',
        '#6366F1', '#14B8A6', '#F97316', '#EF4444', '#84CC16'
      ],
    }],
  };

  const doughnutChartData = {
    labels: categoryDistribution.map(c => c.name),
    datasets: [{
      data: categoryDistribution.map(c => c.value),
      backgroundColor: [
        '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#6366F1'
      ],
    }],
  };

  // Export to Excel
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    
    // Students sheet
    const studentsData = students.map((s, i) => ({
      '排名': i + 1,
      '姓名': s.name,
      '积分': s.totalScore,
      '小组': groups.find(g => g.id === s.groupId)?.name || '未分组',
    }));
    const wsStudents = XLSX.utils.json_to_sheet(studentsData);
    XLSX.utils.book_append_sheet(wb, wsStudents, '学生积分');

    // Records sheet
    const recordsData = records.map(r => {
      const student = students.find(s => s.id === r.studentId);
      const rule = rules.find(ru => ru.id === r.ruleId);
      return {
        '学生': student?.name || '未知',
        '分值': r.score,
        '原因': r.reason || rule?.name || '-',
        '时间': new Date(r.createdAt).toLocaleString('zh-CN'),
      };
    });
    const wsRecords = XLSX.utils.json_to_sheet(recordsData);
    XLSX.utils.book_append_sheet(wb, wsRecords, '积分记录');

    // Groups sheet
    const groupsData = groups.map(g => {
      const members = students.filter(s => s.groupId === g.id);
      const totalScore = members.reduce((sum, s) => sum + s.totalScore, 0);
      return {
        '小组名': g.name,
        '成员数': members.length,
        '总积分': totalScore,
        '人均积分': members.length > 0 ? Math.round(totalScore / members.length) : 0,
      };
    });
    const wsGroups = XLSX.utils.json_to_sheet(groupsData);
    XLSX.utils.book_append_sheet(wb, wsGroups, '小组统计');

    // Download
    XLSX.writeFile(wb, `班级积分报表_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>📊</span>
          数据分析
        </h2>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          导出报表
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon="👥" value={stats.studentCount} label="班级人数" color="purple" />
        <StatsCard icon="⭐" value={stats.maxScore} label="最高积分" color="orange" />
        <StatsCard icon="📊" value={stats.avgScore} label="平均积分" color="green" />
        <StatsCard icon="📝" value={stats.totalRecords} label="记录总数" color="blue" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📈 积分趋势（近4周）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {weeklyTrend.some(w => w.value !== 0) ? (
                <Line data={lineChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 10 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🏆 积分排行 TOP10</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {topStudents.length > 0 ? (
                <Bar data={barChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📊 分类分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {categoryDistribution.length > 0 ? (
                <Doughnut data={doughnutChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📋 快速统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span>加分记录</span>
                <span className="font-bold text-green-600">
                  {records.filter(r => r.score > 0).length} 次
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span>扣分记录</span>
                <span className="font-bold text-red-600">
                  {records.filter(r => r.score < 0).length} 次
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span>总加分</span>
                <span className="font-bold text-green-600">
                  +{records.filter(r => r.score > 0).reduce((sum, r) => sum + r.score, 0)} 分
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span>总扣分</span>
                <span className="font-bold text-red-600">
                  {records.filter(r => r.score < 0).reduce((sum, r) => sum + r.score, 0)} 分
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
