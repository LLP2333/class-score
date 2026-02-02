/**
 * Settings Page Module
 */

const SettingsPage = {
    render() {
        const container = App.getPageContainer();
        if (!container) return;

        const classInfo = Store.getClassInfo();
        const stats = Store.getStatistics();

        container.innerHTML = `
            <div class="settings-page animate-fade-in">
                <!-- Section Header -->
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="section-title-icon">⚙️</span>
                        系统设置
                    </h2>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                    <!-- Class Info -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📚 班级信息</h3>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label class="form-label">班级名称</label>
                                <input type="text" class="form-input" id="className" value="${classInfo.name}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">班主任</label>
                                <input type="text" class="form-input" id="teacherName" value="${classInfo.teacher || ''}">
                            </div>
                            <button class="btn btn-primary w-full" id="saveClassInfoBtn">保存班级信息</button>
                        </div>
                    </div>

                    <!-- Data Stats -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📊 数据统计</h3>
                        </div>
                        <div class="card-body">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: 700; color: var(--primary);">${stats.studentCount}</div>
                                    <div style="font-size: 13px; color: var(--text-muted);">学生数</div>
                                </div>
                                <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: 700; color: var(--green);">${stats.groupCount}</div>
                                    <div style="font-size: 13px; color: var(--text-muted);">小组数</div>
                                </div>
                                <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: 700; color: var(--orange);">${stats.totalRecords}</div>
                                    <div style="font-size: 13px; color: var(--text-muted);">积分记录</div>
                                </div>
                                <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: 700; color: var(--blue);">${Store.getProducts().length}</div>
                                    <div style="font-size: 13px; color: var(--text-muted);">商品数</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Import Data -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📥 数据导入</h3>
                        </div>
                        <div class="card-body">
                            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
                                支持从Excel文件批量导入学生名单。Excel需包含"姓名"列。
                            </p>
                            <input type="file" id="importExcelInput" accept=".xlsx,.xls" style="display: none;">
                            <button class="btn btn-secondary w-full" id="importExcelBtn">
                                📄 导入Excel学生名单
                            </button>
                        </div>
                    </div>

                    <!-- Backup & Restore -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">💾 备份与恢复</h3>
                        </div>
                        <div class="card-body">
                            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
                                导出完整数据备份，或从备份文件恢复数据。
                            </p>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-primary" id="exportBackupBtn" style="flex: 1;">
                                    📤 导出备份
                                </button>
                                <input type="file" id="importBackupInput" accept=".json" style="display: none;">
                                <button class="btn btn-secondary" id="importBackupBtn" style="flex: 1;">
                                    📥 恢复备份
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Demo Data -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">🎯 演示数据</h3>
                        </div>
                        <div class="card-body">
                            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
                                生成演示数据用于体验系统功能。
                            </p>
                            <button class="btn btn-secondary w-full" id="generateDemoBtn">
                                🎲 生成演示数据
                            </button>
                        </div>
                    </div>

                    <!-- Danger Zone -->
                    <div class="card" style="border: 1px solid var(--red);">
                        <div class="card-header" style="background: var(--red-bg);">
                            <h3 class="card-title" style="color: var(--red);">⚠️ 危险操作</h3>
                        </div>
                        <div class="card-body">
                            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
                                清空所有数据，此操作不可撤销。
                            </p>
                            <button class="btn btn-danger w-full" id="clearAllDataBtn">
                                🗑️ 清空所有数据
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        // Save class info
        document.getElementById('saveClassInfoBtn')?.addEventListener('click', () => {
            const name = document.getElementById('className').value.trim();
            const teacher = document.getElementById('teacherName').value.trim();

            if (!name) {
                App.showToast('请输入班级名称', 'error');
                return;
            }

            Store.setClassInfo({ ...Store.getClassInfo(), name, teacher });
            App.updateClassInfo();
            App.showToast('保存成功', 'success');
        });

        // Import Excel
        const importExcelInput = document.getElementById('importExcelInput');
        document.getElementById('importExcelBtn')?.addEventListener('click', () => {
            importExcelInput?.click();
        });
        importExcelInput?.addEventListener('change', (e) => this.handleExcelImport(e));

        // Export backup
        document.getElementById('exportBackupBtn')?.addEventListener('click', () => this.exportBackup());

        // Import backup
        const importBackupInput = document.getElementById('importBackupInput');
        document.getElementById('importBackupBtn')?.addEventListener('click', () => {
            importBackupInput?.click();
        });
        importBackupInput?.addEventListener('change', (e) => this.handleBackupImport(e));

        // Generate demo data
        document.getElementById('generateDemoBtn')?.addEventListener('click', () => this.generateDemoData());

        // Clear all data
        document.getElementById('clearAllDataBtn')?.addEventListener('click', () => this.clearAllData());
    },

    handleExcelImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (typeof XLSX === 'undefined') {
            App.showToast('Excel功能未加载', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                if (jsonData.length === 0) {
                    App.showToast('Excel文件为空', 'error');
                    return;
                }

                // Find name column
                const nameKey = Object.keys(jsonData[0]).find(key => 
                    key.includes('姓名') || key.includes('名字') || key.toLowerCase() === 'name'
                );

                if (!nameKey) {
                    App.showToast('未找到"姓名"列', 'error');
                    return;
                }

                let importCount = 0;
                jsonData.forEach(row => {
                    const name = row[nameKey]?.toString().trim();
                    if (name) {
                        Store.addStudent({ name });
                        importCount++;
                    }
                });

                App.showToast(`成功导入 ${importCount} 名学生`, 'success');
                this.render();
            } catch (error) {
                console.error('Import error:', error);
                App.showToast('导入失败，请检查文件格式', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
        
        // Reset input
        event.target.value = '';
    },

    exportBackup() {
        const data = Store.exportAllData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `班级积分备份_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        App.showToast('备份已导出', 'success');
    },

    handleBackupImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            App.showConfirm(
                '恢复备份会覆盖当前所有数据，确定继续吗？',
                () => {
                    const success = Store.importAllData(e.target.result);
                    if (success) {
                        App.showToast('恢复成功', 'success');
                        App.updateClassInfo();
                        this.render();
                    } else {
                        App.showToast('恢复失败，文件格式错误', 'error');
                    }
                }
            );
        };
        reader.readAsText(file);
        
        // Reset input
        event.target.value = '';
    },

    generateDemoData() {
        App.showConfirm(
            '这将添加演示学生和数据，确定继续吗？',
            () => {
                // Clear existing
                Store.clearAllData();
                
                // Reinitialize with demo data
                Store.initDemoData();
                
                App.showToast('演示数据已生成', 'success');
                App.updateClassInfo();
                this.render();
            }
        );
    },

    clearAllData() {
        App.showConfirm(
            '⚠️ 确定要清空所有数据吗？此操作不可撤销！',
            () => {
                Store.clearAllData();
                App.showToast('数据已清空', 'success');
                App.updateClassInfo();
                this.render();
            }
        );
    }
};
