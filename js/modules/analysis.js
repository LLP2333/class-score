/**
 * Analysis Page Module
 */

const AnalysisPage = {
    charts: {},

    render() {
        const container = App.getPageContainer();
        if (!container) return;

        const stats = Store.getStatistics();

        container.innerHTML = `
            <div class="analysis-page animate-fade-in">
                <!-- Section Header -->
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="section-title-icon">📊</span>
                        数据分析
                    </h2>
                    <button class="btn btn-primary" id="exportExcelBtn">
                        📥 导出Excel
                    </button>
                </div>

                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stats-card">
                        <div class="stats-icon purple">👥</div>
                        <div class="stats-info">
                            <div class="stats-value">${stats.studentCount}</div>
                            <div class="stats-label">班级人数</div>
                        </div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-icon orange">⭐</div>
                        <div class="stats-info">
                            <div class="stats-value">${stats.maxScore}</div>
                            <div class="stats-label">最高积分</div>
                        </div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-icon green">📊</div>
                        <div class="stats-info">
                            <div class="stats-value">${stats.avgScore}</div>
                            <div class="stats-label">平均积分</div>
                        </div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-icon blue">📝</div>
                        <div class="stats-info">
                            <div class="stats-value">${stats.totalRecords}</div>
                            <div class="stats-label">积分记录数</div>
                        </div>
                    </div>
                </div>

                <!-- Charts -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">
                    <!-- Trend Chart -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📈 积分趋势</h3>
                        </div>
                        <div class="card-body">
                            <canvas id="trendChart" height="200"></canvas>
                        </div>
                    </div>

                    <!-- Category Distribution -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📊 积分分布</h3>
                        </div>
                        <div class="card-body">
                            <canvas id="categoryChart" height="200"></canvas>
                        </div>
                    </div>

                    <!-- Group Comparison -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">👥 小组对比</h3>
                        </div>
                        <div class="card-body">
                            <canvas id="groupChart" height="200"></canvas>
                        </div>
                    </div>

                    <!-- Score Distribution -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📉 积分区间分布</h3>
                        </div>
                        <div class="card-body">
                            <canvas id="distributionChart" height="200"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Top Students Table -->
                <div class="card" style="margin-top: 24px;">
                    <div class="card-header">
                        <h3 class="card-title">🏆 积分排行榜</h3>
                    </div>
                    <div class="card-body">
                        ${this.renderTopStudentsTable()}
                    </div>
                </div>
            </div>
        `;

        this.initCharts();
        this.bindEvents();
    },

    renderTopStudentsTable() {
        const students = Store.getStudents()
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 10);

        if (students.length === 0) {
            return '<p style="text-align: center; color: var(--text-muted);">暂无数据</p>';
        }

        return `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-light);">
                        <th style="padding: 12px; text-align: left;">排名</th>
                        <th style="padding: 12px; text-align: left;">姓名</th>
                        <th style="padding: 12px; text-align: left;">小组</th>
                        <th style="padding: 12px; text-align: right;">积分</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map((s, i) => {
                        const group = s.groupId ? Store.getGroupById(s.groupId) : null;
                        return `
                            <tr style="border-bottom: 1px solid var(--border-light);">
                                <td style="padding: 12px;">
                                    ${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                                </td>
                                <td style="padding: 12px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="student-avatar ${App.getAvatarClass(s.avatar)}" style="width: 32px; height: 32px; font-size: 14px;">
                                            ${s.name.charAt(0)}
                                        </div>
                                        ${s.name}
                                    </div>
                                </td>
                                <td style="padding: 12px;">
                                    ${group ? `<span class="badge badge-primary">${group.name}</span>` : '-'}
                                </td>
                                <td style="padding: 12px; text-align: right; font-weight: 600; color: var(--primary);">
                                    ${s.totalScore}分
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    initCharts() {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        this.initTrendChart();
        this.initCategoryChart();
        this.initGroupChart();
        this.initDistributionChart();
    },

    initTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        const weeklyData = Store.getWeeklyScoreTrend();

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeklyData.map(d => d.label),
                datasets: [{
                    label: '积分变化',
                    data: weeklyData.map(d => d.value),
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    initCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const distribution = Store.getCategoryDistribution();
        const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#EF4444'];

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: distribution.map(d => d.name),
                datasets: [{
                    data: distribution.map(d => d.value),
                    backgroundColor: colors.slice(0, distribution.length)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    },

    initGroupChart() {
        const ctx = document.getElementById('groupChart');
        if (!ctx) return;

        const groups = Store.getGroups().map(g => ({
            name: g.name,
            score: Store.getGroupTotalScore(g.id)
        }));

        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

        this.charts.group = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: groups.map(g => g.name),
                datasets: [{
                    label: '小组总积分',
                    data: groups.map(g => g.score),
                    backgroundColor: colors.slice(0, groups.length)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    initDistributionChart() {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) return;

        const students = Store.getStudents();
        const ranges = [
            { label: '0-50分', min: 0, max: 50 },
            { label: '51-100分', min: 51, max: 100 },
            { label: '101-150分', min: 101, max: 150 },
            { label: '151-200分', min: 151, max: 200 },
            { label: '200分以上', min: 201, max: Infinity }
        ];

        const distribution = ranges.map(range => ({
            label: range.label,
            count: students.filter(s => s.totalScore >= range.min && s.totalScore <= range.max).length
        }));

        this.charts.distribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: distribution.map(d => d.label),
                datasets: [{
                    label: '学生人数',
                    data: distribution.map(d => d.count),
                    backgroundColor: '#10B981'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    bindEvents() {
        // Export Excel button
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => this.exportToExcel());
    },

    exportToExcel() {
        if (typeof XLSX === 'undefined') {
            App.showToast('Excel导出功能未加载', 'error');
            return;
        }

        const students = Store.getStudents().sort((a, b) => b.totalScore - a.totalScore);
        const groups = Store.getGroups();
        const records = Store.getScoreRecords();
        const rules = Store.getRules();

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Student Sheet
        const studentData = students.map((s, i) => {
            const group = s.groupId ? groups.find(g => g.id === s.groupId) : null;
            return {
                '排名': i + 1,
                '姓名': s.name,
                '小组': group ? group.name : '未分组',
                '总积分': s.totalScore,
                '创建时间': App.formatDate(s.createdAt)
            };
        });
        const studentSheet = XLSX.utils.json_to_sheet(studentData);
        XLSX.utils.book_append_sheet(wb, studentSheet, '学生列表');

        // Records Sheet
        const recordData = records.map(r => {
            const student = students.find(s => s.id === r.studentId);
            const rule = rules.find(ru => ru.id === r.ruleId);
            return {
                '学生': student ? student.name : '未知',
                '积分变化': r.score,
                '规则': rule ? rule.name : r.reason,
                '时间': App.formatDate(r.createdAt)
            };
        });
        const recordSheet = XLSX.utils.json_to_sheet(recordData);
        XLSX.utils.book_append_sheet(wb, recordSheet, '积分记录');

        // Group Sheet
        const groupData = groups.map(g => ({
            '小组名称': g.name,
            '成员数': Store.getGroupMembers(g.id).length,
            '总积分': Store.getGroupTotalScore(g.id)
        }));
        const groupSheet = XLSX.utils.json_to_sheet(groupData);
        XLSX.utils.book_append_sheet(wb, groupSheet, '小组统计');

        // Download
        const fileName = `班级积分数据_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        App.showToast('导出成功', 'success');
    }
};
