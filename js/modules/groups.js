/**
 * Groups Page Module
 */

const GroupsPage = {
    render() {
        const container = App.getPageContainer();
        if (!container) return;

        const groups = Store.getGroups();
        const students = Store.getStudents();
        const ungroupedStudents = students.filter(s => !s.groupId);

        container.innerHTML = `
            <div class="groups-page animate-fade-in">
                <!-- Section Header -->
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="section-title-icon">👥</span>
                        小组管理
                    </h2>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" id="groupPkBtn">⚔️ 小组PK</button>
                        <button class="btn btn-primary" id="addGroupBtn">➕ 创建小组</button>
                    </div>
                </div>

                <!-- Groups Grid -->
                <div class="group-grid" id="groupGrid">
                    ${this.renderGroups(groups)}
                </div>

                ${ungroupedStudents.length > 0 ? `
                    <!-- Ungrouped Students -->
                    <div style="margin-top: 32px;">
                        <div class="section-header">
                            <h2 class="section-title">
                                <span class="section-title-icon">👤</span>
                                未分组学生 (${ungroupedStudents.length})
                            </h2>
                        </div>
                        <div class="student-grid">
                            ${ungroupedStudents.map(student => `
                                <div class="student-card" data-id="${student.id}">
                                    <div class="student-avatar ${App.getAvatarClass(student.avatar)}">
                                        ${student.name.charAt(0)}
                                    </div>
                                    <div class="student-name">${student.name}</div>
                                    <div class="student-score">${student.totalScore}分</div>
                                    <button class="btn btn-sm btn-secondary assign-group-btn" data-id="${student.id}">
                                        分配小组
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        this.bindEvents();
    },

    renderGroups(groups) {
        if (groups.length === 0) {
            return App.renderEmpty(
                '👥',
                '还没有小组',
                '创建小组来进行团队管理和PK竞赛',
                '<button class="btn btn-primary" onclick="GroupsPage.showAddGroupModal()">创建小组</button>'
            );
        }

        return groups.map(group => {
            const members = Store.getGroupMembers(group.id);
            const totalScore = Store.getGroupTotalScore(group.id);
            const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
            const bgColor = colors[(group.color - 1) % colors.length];

            return `
                <div class="group-card" data-id="${group.id}">
                    <div class="group-header" style="background: ${bgColor};">
                        <div class="group-name">${group.name}</div>
                        <div class="group-score">${totalScore}分</div>
                    </div>
                    <div class="group-body">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="color: var(--text-muted); font-size: 13px;">
                                ${members.length} 名成员
                            </span>
                            <div style="display: flex; gap: 4px;">
                                <button class="btn btn-sm btn-success team-score-btn" data-id="${group.id}" data-action="add">
                                    +分
                                </button>
                                <button class="btn btn-sm btn-danger team-score-btn" data-id="${group.id}" data-action="minus">
                                    -分
                                </button>
                            </div>
                        </div>
                        <div class="group-members">
                            ${members.slice(0, 8).map(m => `
                                <div class="member-avatar ${App.getAvatarClass(m.avatar)}" title="${m.name}">
                                    ${m.name.charAt(0)}
                                </div>
                            `).join('')}
                            ${members.length > 8 ? `
                                <div class="member-avatar" style="background: var(--gray-300);" title="还有 ${members.length - 8} 人">
                                    +${members.length - 8}
                                </div>
                            ` : ''}
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 12px;">
                            <button class="btn btn-sm btn-secondary edit-group-btn" data-id="${group.id}" style="flex: 1;">
                                编辑
                            </button>
                            <button class="btn btn-sm btn-outline manage-members-btn" data-id="${group.id}" style="flex: 1;">
                                成员
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    bindEvents() {
        // Add group button
        document.getElementById('addGroupBtn')?.addEventListener('click', () => this.showAddGroupModal());

        // Group PK button
        document.getElementById('groupPkBtn')?.addEventListener('click', () => this.showGroupPkModal());

        // Group card events
        document.getElementById('groupGrid')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('team-score-btn')) {
                const groupId = e.target.dataset.id;
                const action = e.target.dataset.action;
                this.showTeamScoreModal(groupId, action);
            } else if (e.target.classList.contains('edit-group-btn')) {
                this.showEditGroupModal(e.target.dataset.id);
            } else if (e.target.classList.contains('manage-members-btn')) {
                this.showManageMembersModal(e.target.dataset.id);
            }
        });

        // Assign group buttons
        document.querySelectorAll('.assign-group-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showAssignGroupModal(btn.dataset.id));
        });
    },

    showAddGroupModal() {
        const content = `
            <form id="addGroupForm">
                <div class="form-group">
                    <label class="form-label">小组名称 *</label>
                    <input type="text" class="form-input" id="groupName" placeholder="例如：第一组" required>
                </div>
                <div class="form-group">
                    <label class="form-label">小组颜色</label>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="colorSelector">
                        ${['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'].map((color, i) => `
                            <button type="button" class="color-btn ${i === 0 ? 'active' : ''}" 
                                data-color="${i + 1}" 
                                style="width: 40px; height: 40px; border-radius: 50%; background: ${color}; border: 3px solid transparent; cursor: pointer;">
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="groupColor" value="1">
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" id="saveGroupBtn">创建</button>
        `;

        App.showModal('创建小组', content, footer);

        // Color selector
        document.getElementById('colorSelector')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-btn')) {
                document.querySelectorAll('.color-btn').forEach(b => b.style.borderColor = 'transparent');
                e.target.style.borderColor = 'var(--gray-800)';
                document.getElementById('groupColor').value = e.target.dataset.color;
            }
        });

        // Save button
        document.getElementById('saveGroupBtn')?.addEventListener('click', () => {
            const name = document.getElementById('groupName').value.trim();
            const color = parseInt(document.getElementById('groupColor').value);

            if (!name) {
                App.showToast('请输入小组名称', 'error');
                return;
            }

            Store.addGroup({ name, color });
            App.closeModal();
            App.showToast('创建成功', 'success');
            this.render();
        });
    },

    showEditGroupModal(groupId) {
        const group = Store.getGroupById(groupId);
        if (!group) return;

        const content = `
            <form id="editGroupForm">
                <div class="form-group">
                    <label class="form-label">小组名称</label>
                    <input type="text" class="form-input" id="editGroupName" value="${group.name}" required>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" id="deleteGroupBtn">删除小组</button>
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" id="updateGroupBtn">保存</button>
        `;

        App.showModal('编辑小组', content, footer);

        document.getElementById('updateGroupBtn')?.addEventListener('click', () => {
            const name = document.getElementById('editGroupName').value.trim();
            if (!name) {
                App.showToast('请输入小组名称', 'error');
                return;
            }
            Store.updateGroup(groupId, { name });
            App.closeModal();
            App.showToast('保存成功', 'success');
            this.render();
        });

        document.getElementById('deleteGroupBtn')?.addEventListener('click', () => {
            App.showConfirm(
                `确定要删除"${group.name}"吗？小组成员将变为未分组状态。`,
                () => {
                    Store.deleteGroup(groupId);
                    App.closeModal();
                    App.showToast('删除成功', 'success');
                    this.render();
                }
            );
        });
    },

    showManageMembersModal(groupId) {
        const group = Store.getGroupById(groupId);
        if (!group) return;

        const members = Store.getGroupMembers(groupId);
        const allStudents = Store.getStudents();
        const availableStudents = allStudents.filter(s => s.groupId !== groupId);

        const content = `
            <div class="manage-members">
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 12px;">当前成员 (${members.length})</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${members.length > 0 ? members.map(m => `
                            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--gray-100); border-radius: 20px;">
                                <div class="member-avatar ${App.getAvatarClass(m.avatar)}" style="width: 24px; height: 24px; font-size: 12px;">
                                    ${m.name.charAt(0)}
                                </div>
                                <span>${m.name}</span>
                                <button class="remove-member-btn" data-id="${m.id}" style="background: none; border: none; cursor: pointer; color: var(--red);">✕</button>
                            </div>
                        `).join('') : '<p style="color: var(--text-muted);">暂无成员</p>'}
                    </div>
                </div>
                
                <div>
                    <h4 style="margin-bottom: 12px;">添加成员</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; max-height: 200px; overflow-y: auto;">
                        ${availableStudents.length > 0 ? availableStudents.map(s => `
                            <button class="btn btn-sm btn-secondary add-member-btn" data-id="${s.id}">
                                + ${s.name}
                            </button>
                        `).join('') : '<p style="color: var(--text-muted);">没有可添加的学生</p>'}
                    </div>
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-primary" onclick="App.closeModal()">完成</button>
        `;

        App.showModal(`${group.name} - 成员管理`, content, footer);

        // Remove member
        document.querySelectorAll('.remove-member-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                Store.updateStudent(btn.dataset.id, { groupId: null });
                this.showManageMembersModal(groupId);
            });
        });

        // Add member
        document.querySelectorAll('.add-member-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                Store.updateStudent(btn.dataset.id, { groupId: groupId });
                this.showManageMembersModal(groupId);
            });
        });
    },

    showAssignGroupModal(studentId) {
        const student = Store.getStudentById(studentId);
        const groups = Store.getGroups();
        if (!student) return;

        const content = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div class="student-avatar ${App.getAvatarClass(student.avatar)}" style="width: 64px; height: 64px; margin: 0 auto 10px; font-size: 24px;">
                    ${student.name.charAt(0)}
                </div>
                <div style="font-size: 16px; font-weight: 500;">${student.name}</div>
            </div>
            <div class="form-group">
                <label class="form-label">选择小组</label>
                <select class="form-select" id="assignGroupSelect">
                    <option value="">不分组</option>
                    ${groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                </select>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" id="confirmAssignBtn">确认</button>
        `;

        App.showModal('分配小组', content, footer);

        document.getElementById('confirmAssignBtn')?.addEventListener('click', () => {
            const groupId = document.getElementById('assignGroupSelect').value || null;
            Store.updateStudent(studentId, { groupId });
            App.closeModal();
            App.showToast('分配成功', 'success');
            this.render();
        });
    },

    showTeamScoreModal(groupId, action) {
        const group = Store.getGroupById(groupId);
        const members = Store.getGroupMembers(groupId);
        const rules = Store.getRules().filter(r => r.type === action);

        if (!group || members.length === 0) {
            App.showToast('小组没有成员', 'error');
            return;
        }

        const content = `
            <div class="team-score-modal">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h3>${group.name}</h3>
                    <p style="color: var(--text-muted);">${members.length} 名成员将${action === 'add' ? '加分' : '扣分'}</p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">选择规则</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${rules.map(r => `
                            <button type="button" class="btn btn-sm ${action === 'add' ? 'btn-success' : 'btn-danger'} rule-btn" 
                                data-score="${r.score}">
                                ${r.icon} ${r.name} (${action === 'add' ? '+' : '-'}${r.score})
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">或自定义分值</label>
                    <input type="number" class="form-input" id="teamCustomScore" min="1" max="100">
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn ${action === 'add' ? 'btn-success' : 'btn-danger'}" id="confirmTeamScoreBtn">
                确认${action === 'add' ? '加分' : '扣分'}
            </button>
        `;

        App.showModal(`团队${action === 'add' ? '加分' : '扣分'}`, content, footer);

        let selectedScore = 0;
        document.querySelectorAll('.rule-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.rule-btn').forEach(b => b.style.opacity = '0.5');
                btn.style.opacity = '1';
                selectedScore = parseInt(btn.dataset.score);
                document.getElementById('teamCustomScore').value = '';
            });
        });

        document.getElementById('confirmTeamScoreBtn')?.addEventListener('click', () => {
            const customScore = parseInt(document.getElementById('teamCustomScore').value);
            let finalScore = customScore || selectedScore;

            if (!finalScore) {
                App.showToast('请选择规则或输入分值', 'error');
                return;
            }

            if (action === 'minus') {
                finalScore = -Math.abs(finalScore);
            }

            // Add score to all members
            members.forEach(member => {
                Store.addScoreRecord({
                    studentId: member.id,
                    score: finalScore,
                    reason: `小组${action === 'add' ? '加分' : '扣分'}`
                });
            });

            App.closeModal();
            App.showToast(`已为 ${members.length} 名成员${action === 'add' ? '加' : '扣'}分`, 'success');
            this.render();
        });
    },

    showGroupPkModal() {
        const groups = Store.getGroups();
        if (groups.length < 2) {
            App.showToast('至少需要2个小组才能进行PK', 'warning');
            return;
        }

        const groupsWithScore = groups.map(g => ({
            ...g,
            totalScore: Store.getGroupTotalScore(g.id),
            memberCount: Store.getGroupMembers(g.id).length
        })).sort((a, b) => b.totalScore - a.totalScore);

        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

        const content = `
            <div class="group-pk">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 48px; margin-bottom: 8px;">⚔️</div>
                    <h3>小组积分PK榜</h3>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${groupsWithScore.map((g, i) => {
                        const maxScore = groupsWithScore[0].totalScore || 1;
                        const percentage = (g.totalScore / maxScore) * 100;
                        const bgColor = colors[(g.color - 1) % colors.length];
                        
                        return `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;
                                    ${i === 0 ? 'background: linear-gradient(135deg, #FFD700, #FFA500); color: white;' : 
                                      i === 1 ? 'background: linear-gradient(135deg, #C0C0C0, #A0A0A0); color: white;' :
                                      i === 2 ? 'background: linear-gradient(135deg, #CD7F32, #B87333); color: white;' :
                                      'background: var(--gray-200); color: var(--text-secondary);'}">
                                    ${i + 1}
                                </div>
                                <div style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                        <span style="font-weight: 500;">${g.name}</span>
                                        <span style="font-weight: 700; color: ${bgColor};">${g.totalScore}分</span>
                                    </div>
                                    <div style="height: 8px; background: var(--gray-100); border-radius: 4px; overflow: hidden;">
                                        <div style="width: ${percentage}%; height: 100%; background: ${bgColor}; border-radius: 4px; transition: width 0.5s;"></div>
                                    </div>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                                        ${g.memberCount} 名成员 · 人均 ${g.memberCount > 0 ? Math.round(g.totalScore / g.memberCount) : 0} 分
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-primary" onclick="App.closeModal()">关闭</button>
        `;

        App.showModal('小组PK', content, footer);
    }
};
