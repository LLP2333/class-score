/**
 * 时间线模块 - 展示学生积分变动记录
 */
const TimelinePage = {
    currentFilter: {
        studentName: '',
        groupId: null
    },

    init() {
        this.render();
    },

    render() {
        const container = App.getPageContainer();
        const students = Store.getStudents();
        const groups = Store.getGroups();
        const records = Store.getScoreRecords();

        container.innerHTML = `
            <div class="timeline-page">
                <div class="page-header-actions">
                    <div class="timeline-filters">
                        <div class="filter-group">
                            <label>学生姓名:</label>
                            <input type="text" id="studentSearch" class="form-input" placeholder="输入学生姓名搜索..." value="${this.currentFilter.studentName}">
                        </div>
                        <div class="filter-group">
                            <label>小组:</label>
                            <select id="groupFilter" class="form-select">
                                <option value="">全部小组</option>
                                ${groups.map(g => `<option value="${g.id}" ${this.currentFilter.groupId === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}
                            </select>
                        </div>
                        <button class="btn btn-secondary" id="clearFilters">清除</button>
                    </div>
                </div>

                <div class="timeline-container">
                    ${this.renderTimeline(records, students, groups)}
                </div>
            </div>
        `;

        this.bindEvents();
    },

    renderTimeline(records, students, groups) {
        // 过滤记录
        let filteredRecords = this.filterRecords(records, students);

        if (filteredRecords.length === 0) {
            return App.renderEmpty('📅', '暂无积分记录', '记录学生的每一次进步');
        }

        // 按日期分组
        const groupedByDate = this.groupRecordsByDate(filteredRecords);

        let html = '<div class="timeline">';

        for (const [date, dayRecords] of Object.entries(groupedByDate)) {
            html += `
                <div class="timeline-date-group">
                    <div class="timeline-date-header">
                        <span class="date-badge">${this.formatDateHeader(date)}</span>
                    </div>
                    <div class="timeline-items">
                        ${dayRecords.map(record => this.renderTimelineItem(record, students, groups)).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    renderTimelineItem(record, students, groups) {
        const student = students.find(s => s.id === record.studentId);
        const studentName = student ? student.name : '未知学生';
        
        // 兼容性处理：有些记录可能直接存了学生当时的小组信息，或者从当前学生对象获取
        const groupId = record.groupId || (student ? student.groupId : null);
        const group = groupId ? groups.find(g => g.id === groupId) : null;
        
        const groupName = group ? group.name : '';
        const groupColorClass = group ? App.getGroupColorClass(group.color) : '';

        const isPositive = record.score > 0;
        const pointsClass = isPositive ? 'points-positive' : 'points-negative';
        const pointsIcon = isPositive ? '↑' : '↓';
        const pointsText = isPositive ? `+${record.score}` : record.score;

        return `
            <div class="timeline-item">
                <div class="timeline-marker ${pointsClass}"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="student-name">${studentName}</span>
                        ${groupName ? `<span class="group-badge ${groupColorClass}">${groupName}</span>` : ''}
                        <span class="timeline-time">${this.formatTime(record.createdAt)}</span>
                    </div>
                    <div class="timeline-body">
                        <span class="action-text">${record.reason || '积分变动'}</span>
                        <span class="points-badge ${pointsClass}">
                            ${pointsIcon} ${pointsText}
                        </span>
                    </div>
                    ${record.ruleId ? `<div class="timeline-rule">规则: ${this.getRuleName(record.ruleId)}</div>` : ''}
                </div>
            </div>
        `;
    },

    filterRecords(records, students) {
        let filtered = [...records];

        // 同时支持按学生姓名和小组过滤
        if (this.currentFilter.studentName || this.currentFilter.groupId) {
            filtered = filtered.filter(r => {
                const student = students.find(s => s.id === r.studentId);
                if (!student) return false;

                // 姓名匹配 (模糊搜索)
                const nameMatch = !this.currentFilter.studentName || 
                    student.name.toLowerCase().includes(this.currentFilter.studentName.toLowerCase());
                
                // 小组匹配
                const groupMatch = !this.currentFilter.groupId || 
                    student.groupId === this.currentFilter.groupId;

                return nameMatch && groupMatch;
            });
        }

        // 按时间倒序排列
        return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    groupRecordsByDate(records) {
        const grouped = {};
        records.forEach(record => {
            const date = new Date(record.createdAt).toLocaleDateString('zh-CN');
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(record);
        });
        return grouped;
    },

    formatDateHeader(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return '今天';
        if (date.toDateString() === yesterday.toDateString()) return '昨天';
        
        return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
    },

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    getRuleName(ruleId) {
        const rules = Store.getRules();
        const rule = rules.find(r => r.id === ruleId);
        return rule ? rule.name : '自定义';
    },

    bindEvents() {
        // 学生姓名搜索 (输入即搜索)
        const studentSearch = document.getElementById('studentSearch');
        studentSearch?.addEventListener('input', (e) => {
            this.currentFilter.studentName = e.target.value.trim();
            this.updateTimelineOnly();
        });

        // 小组筛选
        document.getElementById('groupFilter')?.addEventListener('change', (e) => {
            this.currentFilter.groupId = e.target.value || null;
            this.render();
        });

        // 清除筛选
        document.getElementById('clearFilters')?.addEventListener('click', () => {
            this.currentFilter = { studentName: '', groupId: null };
            this.render();
        });
    },

    // 仅更新时间线内容，避免输入框失去焦点
    updateTimelineOnly() {
        const students = Store.getStudents();
        const groups = Store.getGroups();
        const records = Store.getScoreRecords();
        const timelineContainer = document.querySelector('.timeline-container');
        if (timelineContainer) {
            timelineContainer.innerHTML = this.renderTimeline(records, students, groups);
        }
    }
};
