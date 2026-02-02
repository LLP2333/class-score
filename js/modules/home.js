/**
 * Home Page Module
 */

const HomePage = {
    render() {
        const container = App.getPageContainer();
        if (!container) return;

        const stats = Store.getStatistics();
        const students = Store.getStudents();
        const groups = Store.getGroups();

        container.innerHTML = `
            <div class="home-page animate-fade-in">
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
                        <div class="stats-icon blue">🏠</div>
                        <div class="stats-info">
                            <div class="stats-value">${stats.groupCount}</div>
                            <div class="stats-label">小组数量</div>
                        </div>
                    </div>
                </div>

                <!-- Search and Actions -->
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="section-title-icon">👨‍🎓</span>
                        学生快速管理
                    </h2>
                    <button class="btn btn-primary" id="addStudentBtn">
                        ➕ 添加学生
                    </button>
                </div>

                <!-- Search Box -->
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" class="search-input" id="searchInput" placeholder="搜索学生姓名...">
                </div>

                <!-- Filter by Group -->
                <div class="tabs" id="groupFilter">
                    <button class="tab active" data-group="all">全部</button>
                    ${groups.map(g => `
                        <button class="tab" data-group="${g.id}">${g.name}</button>
                    `).join('')}
                </div>

                <!-- Students Grid -->
                <div class="student-grid" id="studentGrid">
                    ${this.renderStudentCards(students)}
                </div>
            </div>
        `;

        this.bindEvents();
    },

    renderStudentCards(students) {
        if (students.length === 0) {
            return App.renderEmpty(
                '📚',
                '还没有学生',
                '点击"添加学生"开始创建班级学生名单',
                '<button class="btn btn-primary" onclick="HomePage.showAddStudentModal()">添加学生</button>'
            );
        }

        return students.map(student => `
            <div class="student-card" data-id="${student.id}">
                <div class="student-avatar ${App.getAvatarClass(student.avatar)}">
                    ${student.name.charAt(0)}
                </div>
                <div class="student-name" title="${student.name}">${student.name}</div>
                <div class="student-score">${student.totalScore}分</div>
                <div class="student-actions">
                    <button class="score-btn add" data-id="${student.id}" data-action="add" title="加分">+</button>
                    <button class="score-btn minus" data-id="${student.id}" data-action="minus" title="扣分">-</button>
                </div>
            </div>
        `).join('');
    },

    bindEvents() {
        // Add student button
        const addBtn = document.getElementById('addStudentBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddStudentModal());
        }

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterStudents(e.target.value));
        }

        // Group filter tabs
        const groupFilter = document.getElementById('groupFilter');
        if (groupFilter) {
            groupFilter.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab')) {
                    groupFilter.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    this.filterByGroup(e.target.dataset.group);
                }
            });
        }

        // Student card clicks
        const studentGrid = document.getElementById('studentGrid');
        if (studentGrid) {
            studentGrid.addEventListener('click', (e) => {
                // Score buttons
                if (e.target.classList.contains('score-btn')) {
                    const studentId = e.target.dataset.id;
                    const action = e.target.dataset.action;
                    this.showScoreModal(studentId, action);
                    e.stopPropagation();
                }
                // Student card
                else if (e.target.closest('.student-card')) {
                    const card = e.target.closest('.student-card');
                    this.showStudentDetail(card.dataset.id);
                }
            });
        }
    },

    filterStudents(searchText) {
        const students = Store.getStudents();
        const filtered = searchText 
            ? students.filter(s => s.name.includes(searchText))
            : students;
        
        const grid = document.getElementById('studentGrid');
        if (grid) {
            grid.innerHTML = this.renderStudentCards(filtered);
        }
    },

    filterByGroup(groupId) {
        const students = Store.getStudents();
        const filtered = groupId === 'all' 
            ? students 
            : students.filter(s => s.groupId === groupId);
        
        const grid = document.getElementById('studentGrid');
        if (grid) {
            grid.innerHTML = this.renderStudentCards(filtered);
        }
    },

    showAddStudentModal() {
        const groups = Store.getGroups();
        
        const content = `
            <form id="addStudentForm">
                <div class="form-group">
                    <label class="form-label">学生姓名 *</label>
                    <input type="text" class="form-input" id="studentName" placeholder="请输入学生姓名" required>
                </div>
                <div class="form-group">
                    <label class="form-label">所属小组</label>
                    <select class="form-select" id="studentGroup">
                        <option value="">未分组</option>
                        ${groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">初始积分</label>
                    <input type="number" class="form-input" id="studentScore" value="0" min="0">
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" id="saveStudentBtn">保存</button>
        `;

        App.showModal('添加学生', content, footer);

        document.getElementById('saveStudentBtn').addEventListener('click', () => {
            const name = document.getElementById('studentName').value.trim();
            const groupId = document.getElementById('studentGroup').value || null;
            const score = parseInt(document.getElementById('studentScore').value) || 0;

            if (!name) {
                App.showToast('请输入学生姓名', 'error');
                return;
            }

            Store.addStudent({
                name: name,
                groupId: groupId,
                totalScore: score
            });

            App.closeModal();
            App.showToast('添加成功', 'success');
            this.render();
        });
    },

    showScoreModal(studentId, action) {
        const student = Store.getStudentById(studentId);
        const rules = Store.getRules().filter(r => r.type === action);

        if (!student) return;

        const content = `
            <div class="score-modal">
                <div class="student-info" style="text-align: center; margin-bottom: 20px;">
                    <div class="student-avatar ${App.getAvatarClass(student.avatar)}" style="width: 64px; height: 64px; margin: 0 auto 10px; font-size: 28px;">
                        ${student.name.charAt(0)}
                    </div>
                    <div style="font-size: 18px; font-weight: 600;">${student.name}</div>
                    <div style="color: var(--text-muted);">当前积分: ${student.totalScore}分</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">${action === 'add' ? '加分' : '扣分'}原因</label>
                    <div class="rule-quick-select" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
                        ${rules.map(r => `
                            <button type="button" class="btn btn-sm ${action === 'add' ? 'btn-success' : 'btn-danger'}" 
                                data-rule-id="${r.id}" data-score="${r.score}">
                                ${r.icon} ${r.name} (${action === 'add' ? '+' : '-'}${r.score})
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">自定义分值</label>
                    <input type="number" class="form-input" id="customScore" placeholder="输入自定义分值" min="1" max="100">
                </div>
                
                <div class="form-group">
                    <label class="form-label">备注</label>
                    <input type="text" class="form-input" id="scoreReason" placeholder="可选备注">
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn ${action === 'add' ? 'btn-success' : 'btn-danger'}" id="confirmScoreBtn">
                确认${action === 'add' ? '加分' : '扣分'}
            </button>
        `;

        App.showModal(action === 'add' ? '加分操作' : '扣分操作', content, footer);

        let selectedRuleId = null;
        let selectedScore = 0;

        // Rule quick select
        document.querySelectorAll('.rule-quick-select button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.rule-quick-select button').forEach(b => b.style.opacity = '0.5');
                btn.style.opacity = '1';
                selectedRuleId = btn.dataset.ruleId;
                selectedScore = parseInt(btn.dataset.score);
                document.getElementById('customScore').value = '';
            });
        });

        // Confirm button
        document.getElementById('confirmScoreBtn').addEventListener('click', () => {
            const customScore = parseInt(document.getElementById('customScore').value);
            const reason = document.getElementById('scoreReason').value.trim();

            let finalScore = customScore || selectedScore;
            if (!finalScore) {
                App.showToast('请选择规则或输入分值', 'error');
                return;
            }

            // Apply sign based on action
            if (action === 'minus') {
                finalScore = -Math.abs(finalScore);
            }

            Store.addScoreRecord({
                studentId: studentId,
                ruleId: selectedRuleId,
                score: finalScore,
                reason: reason || (action === 'add' ? '加分' : '扣分')
            });

            App.closeModal();
            App.showToast(`${action === 'add' ? '加' : '扣'}分成功: ${action === 'add' ? '+' : ''}${finalScore}分`, 'success');
            this.render();
        });
    },

    showStudentDetail(studentId) {
        const student = Store.getStudentById(studentId);
        if (!student) return;

        const records = Store.getStudentRecords(studentId).slice(0, 10);
        const rules = Store.getRules();
        const group = student.groupId ? Store.getGroupById(student.groupId) : null;

        const content = `
            <div class="student-detail">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div class="student-avatar ${App.getAvatarClass(student.avatar)}" style="width: 80px; height: 80px; margin: 0 auto 10px; font-size: 32px;">
                        ${student.name.charAt(0)}
                    </div>
                    <h3 style="margin-bottom: 4px;">${student.name}</h3>
                    <div style="color: var(--primary); font-size: 24px; font-weight: 700;">${student.totalScore}分</div>
                    ${group ? `<span class="badge badge-primary">${group.name}</span>` : ''}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">最近记录</h4>
                    ${records.length > 0 ? `
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${records.map(r => {
                                const rule = rules.find(ru => ru.id === r.ruleId);
                                return `
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-light);">
                                        <span>${rule ? rule.icon : '📝'} ${r.reason || (rule ? rule.name : '积分变动')}</span>
                                        <span style="color: ${r.score >= 0 ? 'var(--green)' : 'var(--red)'}; font-weight: 600;">
                                            ${r.score >= 0 ? '+' : ''}${r.score}
                                        </span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : '<p style="color: var(--text-muted);">暂无记录</p>'}
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="HomePage.editStudent('${studentId}')">编辑</button>
            <button class="btn btn-danger" onclick="HomePage.deleteStudent('${studentId}')">删除</button>
            <button class="btn btn-primary" onclick="App.closeModal()">关闭</button>
        `;

        App.showModal('学生详情', content, footer);
    },

    editStudent(studentId) {
        const student = Store.getStudentById(studentId);
        const groups = Store.getGroups();
        if (!student) return;

        const content = `
            <form id="editStudentForm">
                <div class="form-group">
                    <label class="form-label">学生姓名</label>
                    <input type="text" class="form-input" id="editStudentName" value="${student.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">所属小组</label>
                    <select class="form-select" id="editStudentGroup">
                        <option value="">未分组</option>
                        ${groups.map(g => `
                            <option value="${g.id}" ${student.groupId === g.id ? 'selected' : ''}>${g.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">当前积分</label>
                    <input type="number" class="form-input" id="editStudentScore" value="${student.totalScore}">
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" id="saveEditBtn">保存</button>
        `;

        App.showModal('编辑学生', content, footer);

        document.getElementById('saveEditBtn').addEventListener('click', () => {
            const name = document.getElementById('editStudentName').value.trim();
            const groupId = document.getElementById('editStudentGroup').value || null;
            const score = parseInt(document.getElementById('editStudentScore').value) || 0;

            if (!name) {
                App.showToast('请输入学生姓名', 'error');
                return;
            }

            Store.updateStudent(studentId, {
                name: name,
                groupId: groupId,
                totalScore: score
            });

            App.closeModal();
            App.showToast('保存成功', 'success');
            this.render();
        });
    },

    deleteStudent(studentId) {
        const student = Store.getStudentById(studentId);
        if (!student) return;

        App.showConfirm(
            `确定要删除学生"${student.name}"吗？此操作不可撤销。`,
            () => {
                Store.deleteStudent(studentId);
                App.showToast('删除成功', 'success');
                this.render();
            }
        );
    }
};
