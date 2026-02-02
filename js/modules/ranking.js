/**
 * Ranking Page Module
 */

const RankingPage = {
    currentTab: 'student',

    render() {
        const container = App.getPageContainer();
        if (!container) return;

        container.innerHTML = `
            <div class="ranking-page animate-fade-in">
                <!-- Section Header -->
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="section-title-icon">🏆</span>
                        排行榜
                    </h2>
                </div>

                <!-- Tabs -->
                <div class="tabs" id="rankingTabs">
                    <button class="tab ${this.currentTab === 'student' ? 'active' : ''}" data-tab="student">👤 个人榜</button>
                    <button class="tab ${this.currentTab === 'group' ? 'active' : ''}" data-tab="group">👥 小组榜</button>
                </div>

                <!-- Ranking Content -->
                <div id="rankingContent">
                    ${this.currentTab === 'student' ? this.renderStudentRanking() : this.renderGroupRanking()}
                </div>
            </div>
        `;

        this.bindEvents();
    },

    renderStudentRanking() {
        const students = Store.getStudents()
            .sort((a, b) => b.totalScore - a.totalScore);

        if (students.length === 0) {
            return App.renderEmpty(
                '🏆',
                '暂无排名数据',
                '添加学生并记录积分后即可查看排行榜'
            );
        }

        // Top 3
        const top3 = students.slice(0, 3);
        const rest = students.slice(3);

        return `
            <!-- Top 3 Podium -->
            <div class="top3-podium" style="display: flex; justify-content: center; align-items: flex-end; gap: 16px; margin-bottom: 32px; padding: 20px;">
                ${top3.length >= 2 ? `
                    <!-- 2nd Place -->
                    <div class="podium-item" style="text-align: center;">
                        <div class="student-avatar ${App.getAvatarClass(top3[1].avatar)}" style="width: 64px; height: 64px; margin: 0 auto 8px; font-size: 24px; border: 3px solid #C0C0C0;">
                            ${top3[1].name.charAt(0)}
                        </div>
                        <div style="font-weight: 600;">${top3[1].name}</div>
                        <div style="color: var(--primary); font-size: 20px; font-weight: 700;">${top3[1].totalScore}分</div>
                        <div style="background: linear-gradient(135deg, #C0C0C0, #A0A0A0); color: white; padding: 8px 24px; border-radius: 8px 8px 0 0; margin-top: 8px;">
                            🥈 第2名
                        </div>
                    </div>
                ` : ''}
                
                ${top3.length >= 1 ? `
                    <!-- 1st Place -->
                    <div class="podium-item" style="text-align: center;">
                        <div class="student-avatar ${App.getAvatarClass(top3[0].avatar)}" style="width: 80px; height: 80px; margin: 0 auto 8px; font-size: 32px; border: 3px solid #FFD700; box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);">
                            ${top3[0].name.charAt(0)}
                        </div>
                        <div style="font-weight: 600; font-size: 18px;">${top3[0].name}</div>
                        <div style="color: var(--primary); font-size: 24px; font-weight: 700;">${top3[0].totalScore}分</div>
                        <div style="background: linear-gradient(135deg, #FFD700, #FFA500); color: white; padding: 12px 32px; border-radius: 8px 8px 0 0; margin-top: 8px;">
                            🥇 第1名
                        </div>
                    </div>
                ` : ''}
                
                ${top3.length >= 3 ? `
                    <!-- 3rd Place -->
                    <div class="podium-item" style="text-align: center;">
                        <div class="student-avatar ${App.getAvatarClass(top3[2].avatar)}" style="width: 56px; height: 56px; margin: 0 auto 8px; font-size: 20px; border: 3px solid #CD7F32;">
                            ${top3[2].name.charAt(0)}
                        </div>
                        <div style="font-weight: 600;">${top3[2].name}</div>
                        <div style="color: var(--primary); font-size: 18px; font-weight: 700;">${top3[2].totalScore}分</div>
                        <div style="background: linear-gradient(135deg, #CD7F32, #B87333); color: white; padding: 6px 20px; border-radius: 8px 8px 0 0; margin-top: 8px;">
                            🥉 第3名
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Rest of ranking -->
            ${rest.length > 0 ? `
                <div class="card">
                    <div class="card-body">
                        <div class="ranking-list">
                            ${rest.map((student, index) => `
                                <div class="ranking-item">
                                    <div class="ranking-position">${index + 4}</div>
                                    <div class="ranking-info">
                                        <div class="ranking-avatar ${App.getAvatarClass(student.avatar)}">
                                            ${student.name.charAt(0)}
                                        </div>
                                        <div class="ranking-name">${student.name}</div>
                                    </div>
                                    <div class="ranking-score">${student.totalScore}分</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    },

    renderGroupRanking() {
        const groups = Store.getGroups()
            .map(g => ({
                ...g,
                totalScore: Store.getGroupTotalScore(g.id),
                memberCount: Store.getGroupMembers(g.id).length
            }))
            .sort((a, b) => b.totalScore - a.totalScore);

        if (groups.length === 0) {
            return App.renderEmpty(
                '👥',
                '暂无小组数据',
                '创建小组后即可查看小组排行榜'
            );
        }

        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

        return `
            <div class="card">
                <div class="card-body">
                    <div class="ranking-list">
                        ${groups.map((group, index) => {
                            const bgColor = colors[(group.color - 1) % colors.length];
                            return `
                                <div class="ranking-item" style="${index < 3 ? 'background: linear-gradient(90deg, ' + bgColor + '10, transparent);' : ''}">
                                    <div class="ranking-position" style="${
                                        index === 0 ? 'background: linear-gradient(135deg, #FFD700, #FFA500); color: white;' :
                                        index === 1 ? 'background: linear-gradient(135deg, #C0C0C0, #A0A0A0); color: white;' :
                                        index === 2 ? 'background: linear-gradient(135deg, #CD7F32, #B87333); color: white;' : ''
                                    }">
                                        ${index + 1}
                                    </div>
                                    <div class="ranking-info">
                                        <div style="width: 40px; height: 40px; border-radius: 8px; background: ${bgColor}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                                            ${group.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div class="ranking-name">${group.name}</div>
                                            <div style="font-size: 12px; color: var(--text-muted);">${group.memberCount} 名成员</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="ranking-score">${group.totalScore}分</div>
                                        <div style="font-size: 12px; color: var(--text-muted); text-align: right;">
                                            人均 ${group.memberCount > 0 ? Math.round(group.totalScore / group.memberCount) : 0} 分
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        // Tabs
        const tabs = document.getElementById('rankingTabs');
        if (tabs) {
            tabs.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab')) {
                    tabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    this.currentTab = e.target.dataset.tab;
                    
                    const content = document.getElementById('rankingContent');
                    if (content) {
                        content.innerHTML = this.currentTab === 'student' 
                            ? this.renderStudentRanking() 
                            : this.renderGroupRanking();
                    }
                }
            });
        }
    }
};
