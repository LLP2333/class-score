/**
 * Settings Page Module
 */

const SettingsPage = {
    render() {
        const container = App.getPageContainer();
        if (!container) return;

        const classInfo = Store.getClassInfo();
        const stats = Store.getStatistics();
        const backendStatus = Backend.getStatusInfo();

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
                    <!-- Backend Sync - 后端同步 -->
                    <div class="card" style="border: 2px solid ${backendStatus.available ? 'var(--green)' : 'var(--gray-300)'};">
                        <div class="card-header" style="background: ${backendStatus.available ? 'var(--green-bg)' : 'var(--gray-50)'};">
                            <h3 class="card-title">
                                ${backendStatus.available ? '🟢' : '⚪'} 数据同步
                                <span style="font-size: 12px; font-weight: normal; margin-left: 8px;">
                                    ${backendStatus.available ? '(后端已连接)' : '(后端未启动)'}
                                </span>
                            </h3>
                        </div>
                        <div class="card-body">
                            ${backendStatus.available ? this.renderBackendUI(backendStatus) : this.renderNoBackendUI()}
                        </div>
                    </div>

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

    // 渲染无后端时的提示UI
    renderNoBackendUI() {
        return `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 12px;">💾</div>
                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 16px;">
                    当前使用浏览器本地存储<br>
                    数据仅保存在此设备上
                </p>
                <div style="background: var(--gray-50); border-radius: 8px; padding: 12px; font-size: 13px; color: var(--text-secondary);">
                    <strong>如需同步数据到U盘：</strong><br>
                    1. 启动U盘上的后端程序<br>
                    2. 刷新此页面<br>
                    3. 登录后即可同步数据
                </div>
            </div>
        `;
    },

    // 渲染有后端时的UI
    renderBackendUI(status) {
        if (status.loggedIn) {
            return `
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <span style="font-size: 24px;">👤</span>
                        <div>
                            <div style="font-weight: 600;">${status.username}</div>
                            <div style="font-size: 12px; color: var(--text-muted);">已登录</div>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="logoutBtn" style="margin-left: auto;">
                            退出
                        </button>
                    </div>
                </div>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
                    同步数据到后端，下课带走U盘即可随身携带数据
                </p>
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                    <button class="btn btn-primary" id="uploadDataBtn" style="flex: 1;">
                        📤 上传到U盘
                    </button>
                    <button class="btn btn-secondary" id="downloadDataBtn" style="flex: 1;">
                        📥 从U盘下载
                    </button>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); text-align: center;">
                    上传会覆盖U盘数据，下载会覆盖本地数据
                </div>
            `;
        } else {
            return `
                <div id="authForm">
                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                        <button class="btn ${this.authMode === 'login' ? 'btn-primary' : 'btn-secondary'}" 
                                id="showLoginBtn" style="flex: 1;">登录</button>
                        <button class="btn ${this.authMode === 'register' ? 'btn-primary' : 'btn-secondary'}" 
                                id="showRegisterBtn" style="flex: 1;">注册</button>
                    </div>
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input type="text" class="form-input" id="authUsername" placeholder="输入用户名">
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input type="password" class="form-input" id="authPassword" placeholder="输入密码">
                    </div>
                    <button class="btn btn-primary w-full" id="authSubmitBtn">
                        ${this.authMode === 'register' ? '注册' : '登录'}
                    </button>
                    <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px; text-align: center;">
                        ${this.authMode === 'register' 
                            ? '注册账号用于同步数据到U盘' 
                            : '登录后可同步数据'}
                    </p>
                </div>
            `;
        }
    },

    // 认证模式
    authMode: 'login',

    bindEvents() {
        // Backend auth events
        this.bindBackendEvents();

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
    },

    // 绑定后端相关事件
    bindBackendEvents() {
        // 切换到登录模式
        document.getElementById('showLoginBtn')?.addEventListener('click', () => {
            this.authMode = 'login';
            this.render();
        });

        // 切换到注册模式
        document.getElementById('showRegisterBtn')?.addEventListener('click', () => {
            this.authMode = 'register';
            this.render();
        });

        // 登录/注册提交
        document.getElementById('authSubmitBtn')?.addEventListener('click', async () => {
            const username = document.getElementById('authUsername')?.value.trim();
            const password = document.getElementById('authPassword')?.value;

            if (!username) {
                App.showToast('请输入用户名', 'error');
                return;
            }
            if (!password) {
                App.showToast('请输入密码', 'error');
                return;
            }

            const btn = document.getElementById('authSubmitBtn');
            btn.disabled = true;
            btn.textContent = '处理中...';

            try {
                let result;
                if (this.authMode === 'register') {
                    result = await Backend.register(username, password);
                } else {
                    result = await Backend.login(username, password);
                }

                if (result.success) {
                    App.showToast(result.message || '操作成功', 'success');
                    App.updateBackendStatus();
                    
                    // 如果登录且后端有数据，询问是否下载
                    if (this.authMode === 'login' && result.hasRemoteData) {
                        App.showConfirm(
                            '检测到U盘上有保存的数据，是否下载覆盖本地数据？',
                            async () => {
                                const downloadResult = await Backend.downloadData();
                                if (downloadResult.success) {
                                    App.showToast('数据已从U盘下载', 'success');
                                    App.updateClassInfo();
                                }
                                this.render();
                            },
                            () => this.render()
                        );
                    } else {
                        this.render();
                    }
                } else {
                    App.showToast(result.error || '操作失败', 'error');
                    btn.disabled = false;
                    btn.textContent = this.authMode === 'register' ? '注册' : '登录';
                }
            } catch (e) {
                App.showToast('操作失败', 'error');
                btn.disabled = false;
                btn.textContent = this.authMode === 'register' ? '注册' : '登录';
            }
        });

        // 退出登录
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            Backend.logout();
            App.updateBackendStatus();
            App.showToast('已退出登录', 'success');
            this.render();
        });

        // 上传数据到U盘
        document.getElementById('uploadDataBtn')?.addEventListener('click', async () => {
            App.showConfirm(
                '上传将覆盖U盘上的数据，确定继续吗？',
                async () => {
                    const btn = document.getElementById('uploadDataBtn');
                    btn.disabled = true;
                    btn.textContent = '上传中...';

                    const result = await Backend.uploadData();
                    
                    if (result.success) {
                        App.showToast('数据已上传到U盘', 'success');
                    } else {
                        App.showToast(result.error || '上传失败', 'error');
                    }

                    btn.disabled = false;
                    btn.textContent = '📤 上传到U盘';
                }
            );
        });

        // 从U盘下载数据
        document.getElementById('downloadDataBtn')?.addEventListener('click', async () => {
            App.showConfirm(
                '下载将覆盖本地数据，确定继续吗？',
                async () => {
                    const btn = document.getElementById('downloadDataBtn');
                    btn.disabled = true;
                    btn.textContent = '下载中...';

                    const result = await Backend.downloadData();
                    
                    if (result.success) {
                        if (result.noData) {
                            App.showToast('U盘上暂无数据', 'warning');
                        } else {
                            App.showToast('数据已从U盘下载', 'success');
                            App.updateClassInfo();
                            this.render();
                        }
                    } else {
                        App.showToast(result.error || '下载失败', 'error');
                    }

                    btn.disabled = false;
                    btn.textContent = '📥 从U盘下载';
                }
            );
        });
    }
};
