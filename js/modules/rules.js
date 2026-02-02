/**
 * Rules Page Module
 */

const RulesPage = {
    render() {
        const container = App.getPageContainer();
        if (!container) return;

        const rules = Store.getRules();
        const addRules = rules.filter(r => r.type === 'add');
        const minusRules = rules.filter(r => r.type === 'minus');

        container.innerHTML = `
            <div class="rules-page animate-fade-in">
                <!-- Section Header -->
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="section-title-icon">📋</span>
                        积分规则管理
                    </h2>
                    <button class="btn btn-primary" id="addRuleBtn">
                        ➕ 添加规则
                    </button>
                </div>

                <!-- Rules Tabs -->
                <div class="tabs" id="ruleTabs">
                    <button class="tab active" data-type="all">全部 (${rules.length})</button>
                    <button class="tab" data-type="add">加分规则 (${addRules.length})</button>
                    <button class="tab" data-type="minus">扣分规则 (${minusRules.length})</button>
                </div>

                <!-- Rules List -->
                <div class="rule-list" id="ruleList">
                    ${this.renderRules(rules)}
                </div>
            </div>
        `;

        this.bindEvents();
    },

    renderRules(rules) {
        if (rules.length === 0) {
            return App.renderEmpty(
                '📋',
                '还没有积分规则',
                '添加积分规则来快速加减分',
                '<button class="btn btn-primary" onclick="RulesPage.showAddRuleModal()">添加规则</button>'
            );
        }

        // Group by category
        const categories = {};
        rules.forEach(rule => {
            const cat = rule.category || '其他';
            if (!categories[cat]) {
                categories[cat] = [];
            }
            categories[cat].push(rule);
        });

        let html = '';
        Object.entries(categories).forEach(([category, categoryRules]) => {
            html += `
                <div class="rule-category" style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; color: var(--text-muted); margin-bottom: 12px; padding-left: 4px;">
                        ${category}
                    </h3>
                    ${categoryRules.map(rule => `
                        <div class="rule-item ${rule.type}" data-id="${rule.id}">
                            <div class="rule-icon">${rule.icon}</div>
                            <div class="rule-info">
                                <div class="rule-name">${rule.name}</div>
                                <div class="rule-category">${rule.category}</div>
                            </div>
                            <div class="rule-score">
                                ${rule.type === 'add' ? '+' : '-'}${rule.score}分
                            </div>
                            <div class="rule-actions">
                                <button class="btn btn-sm btn-secondary edit-rule-btn" data-id="${rule.id}">编辑</button>
                                <button class="btn btn-sm btn-danger delete-rule-btn" data-id="${rule.id}">删除</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        return html;
    },

    bindEvents() {
        // Add rule button
        const addBtn = document.getElementById('addRuleBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddRuleModal());
        }

        // Tabs
        const tabs = document.getElementById('ruleTabs');
        if (tabs) {
            tabs.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab')) {
                    tabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    this.filterRules(e.target.dataset.type);
                }
            });
        }

        // Edit and delete buttons
        const ruleList = document.getElementById('ruleList');
        if (ruleList) {
            ruleList.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-rule-btn')) {
                    this.showEditRuleModal(e.target.dataset.id);
                } else if (e.target.classList.contains('delete-rule-btn')) {
                    this.deleteRule(e.target.dataset.id);
                }
            });
        }
    },

    filterRules(type) {
        let rules = Store.getRules();
        if (type === 'add') {
            rules = rules.filter(r => r.type === 'add');
        } else if (type === 'minus') {
            rules = rules.filter(r => r.type === 'minus');
        }

        const ruleList = document.getElementById('ruleList');
        if (ruleList) {
            ruleList.innerHTML = this.renderRules(rules);
        }
    },

    showAddRuleModal() {
        const categories = ['学习', '纪律', '劳动', '品德', '其他'];
        const icons = ['📝', '✋', '⭐', '🏆', '💪', '🎯', '📚', '✅', '❌', '⏰', '🧹', '🤝', '💡', '🎨', '🏃'];

        const content = `
            <form id="addRuleForm">
                <div class="form-group">
                    <label class="form-label">规则名称 *</label>
                    <input type="text" class="form-input" id="ruleName" placeholder="例如：课堂回答问题" required>
                </div>
                <div class="form-group">
                    <label class="form-label">规则类型 *</label>
                    <div style="display: flex; gap: 12px;">
                        <label class="form-checkbox" style="flex: 1; padding: 12px; border: 2px solid var(--green); border-radius: 8px; cursor: pointer;">
                            <input type="radio" name="ruleType" value="add" checked>
                            <span style="color: var(--green); font-weight: 500;">➕ 加分规则</span>
                        </label>
                        <label class="form-checkbox" style="flex: 1; padding: 12px; border: 2px solid var(--red); border-radius: 8px; cursor: pointer;">
                            <input type="radio" name="ruleType" value="minus">
                            <span style="color: var(--red); font-weight: 500;">➖ 扣分规则</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">分值 *</label>
                    <input type="number" class="form-input" id="ruleScore" placeholder="请输入分值" min="1" max="100" required>
                </div>
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <select class="form-select" id="ruleCategory">
                        ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">图标</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="iconSelector">
                        ${icons.map((icon, i) => `
                            <button type="button" class="btn btn-sm btn-secondary icon-btn ${i === 0 ? 'active' : ''}" 
                                data-icon="${icon}" style="font-size: 20px; padding: 8px;">
                                ${icon}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="ruleIcon" value="${icons[0]}">
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" id="saveRuleBtn">保存</button>
        `;

        App.showModal('添加积分规则', content, footer);

        // Icon selector
        document.getElementById('iconSelector').addEventListener('click', (e) => {
            if (e.target.classList.contains('icon-btn')) {
                document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('ruleIcon').value = e.target.dataset.icon;
            }
        });

        // Save button
        document.getElementById('saveRuleBtn').addEventListener('click', () => {
            const name = document.getElementById('ruleName').value.trim();
            const type = document.querySelector('input[name="ruleType"]:checked').value;
            const score = parseInt(document.getElementById('ruleScore').value);
            const category = document.getElementById('ruleCategory').value;
            const icon = document.getElementById('ruleIcon').value;

            if (!name) {
                App.showToast('请输入规则名称', 'error');
                return;
            }
            if (!score || score < 1) {
                App.showToast('请输入有效分值', 'error');
                return;
            }

            Store.addRule({
                name: name,
                type: type,
                score: score,
                category: category,
                icon: icon
            });

            App.closeModal();
            App.showToast('添加成功', 'success');
            this.render();
        });
    },

    showEditRuleModal(ruleId) {
        const rule = Store.getRules().find(r => r.id === ruleId);
        if (!rule) return;

        const categories = ['学习', '纪律', '劳动', '品德', '其他'];
        const icons = ['📝', '✋', '⭐', '🏆', '💪', '🎯', '📚', '✅', '❌', '⏰', '🧹', '🤝', '💡', '🎨', '🏃'];

        const content = `
            <form id="editRuleForm">
                <div class="form-group">
                    <label class="form-label">规则名称</label>
                    <input type="text" class="form-input" id="editRuleName" value="${rule.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">规则类型</label>
                    <div style="display: flex; gap: 12px;">
                        <label class="form-checkbox" style="flex: 1; padding: 12px; border: 2px solid var(--green); border-radius: 8px; cursor: pointer;">
                            <input type="radio" name="editRuleType" value="add" ${rule.type === 'add' ? 'checked' : ''}>
                            <span style="color: var(--green); font-weight: 500;">➕ 加分规则</span>
                        </label>
                        <label class="form-checkbox" style="flex: 1; padding: 12px; border: 2px solid var(--red); border-radius: 8px; cursor: pointer;">
                            <input type="radio" name="editRuleType" value="minus" ${rule.type === 'minus' ? 'checked' : ''}>
                            <span style="color: var(--red); font-weight: 500;">➖ 扣分规则</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">分值</label>
                    <input type="number" class="form-input" id="editRuleScore" value="${rule.score}" min="1" max="100" required>
                </div>
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <select class="form-select" id="editRuleCategory">
                        ${categories.map(c => `<option value="${c}" ${rule.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">图标</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="editIconSelector">
                        ${icons.map(icon => `
                            <button type="button" class="btn btn-sm btn-secondary icon-btn ${rule.icon === icon ? 'active' : ''}" 
                                data-icon="${icon}" style="font-size: 20px; padding: 8px;">
                                ${icon}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="editRuleIcon" value="${rule.icon}">
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" id="updateRuleBtn">保存</button>
        `;

        App.showModal('编辑积分规则', content, footer);

        // Icon selector
        document.getElementById('editIconSelector').addEventListener('click', (e) => {
            if (e.target.classList.contains('icon-btn')) {
                document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('editRuleIcon').value = e.target.dataset.icon;
            }
        });

        // Update button
        document.getElementById('updateRuleBtn').addEventListener('click', () => {
            const name = document.getElementById('editRuleName').value.trim();
            const type = document.querySelector('input[name="editRuleType"]:checked').value;
            const score = parseInt(document.getElementById('editRuleScore').value);
            const category = document.getElementById('editRuleCategory').value;
            const icon = document.getElementById('editRuleIcon').value;

            if (!name || !score) {
                App.showToast('请填写完整信息', 'error');
                return;
            }

            Store.updateRule(ruleId, {
                name: name,
                type: type,
                score: score,
                category: category,
                icon: icon
            });

            App.closeModal();
            App.showToast('保存成功', 'success');
            this.render();
        });
    },

    deleteRule(ruleId) {
        const rule = Store.getRules().find(r => r.id === ruleId);
        if (!rule) return;

        App.showConfirm(
            `确定要删除规则"${rule.name}"吗？`,
            () => {
                Store.deleteRule(ruleId);
                App.showToast('删除成功', 'success');
                this.render();
            }
        );
    }
};
