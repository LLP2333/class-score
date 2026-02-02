/**
 * Tools Page Module
 */

const ToolsPage = {
    render() {
        const container = App.getPageContainer();
        if (!container) return;

        container.innerHTML = `
            <div class="tools-page animate-fade-in">
                <!-- Section Header -->
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="section-title-icon">🧰</span>
                        工具箱
                    </h2>
                </div>

                <!-- Tools Grid -->
                <div class="tool-grid">
                    <div class="tool-card" id="randomPickerTool">
                        <div class="tool-icon">🎲</div>
                        <div class="tool-name">随机点名</div>
                        <div class="tool-description">随机抽取学生，支持单人/多人模式</div>
                    </div>

                    <div class="tool-card" id="lotteryTool">
                        <div class="tool-icon">🎰</div>
                        <div class="tool-name">九宫格抽奖</div>
                        <div class="tool-description">自定义奖品，趣味抽奖</div>
                    </div>

                    <div class="tool-card" id="batchScoreTool">
                        <div class="tool-icon">⚡</div>
                        <div class="tool-name">批量操作</div>
                        <div class="tool-description">批量选择学生加减分</div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('randomPickerTool')?.addEventListener('click', () => this.showRandomPicker());
        document.getElementById('lotteryTool')?.addEventListener('click', () => this.showLottery());
        document.getElementById('batchScoreTool')?.addEventListener('click', () => this.showBatchScore());
    },

    // ===== Random Picker =====
    showRandomPicker() {
        const students = Store.getStudents();
        
        if (students.length === 0) {
            App.showToast('没有学生可以点名', 'warning');
            return;
        }

        const content = `
            <div class="picker-container">
                <div class="picker-display" id="pickerDisplay">
                    <div class="picker-name" id="pickerName">?</div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label class="form-label">点名人数</label>
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        <button class="btn btn-secondary picker-count active" data-count="1">1人</button>
                        <button class="btn btn-secondary picker-count" data-count="2">2人</button>
                        <button class="btn btn-secondary picker-count" data-count="3">3人</button>
                        <button class="btn btn-secondary picker-count" data-count="5">5人</button>
                    </div>
                </div>
                
                <button class="btn btn-primary btn-lg" id="startPickerBtn" style="width: 200px;">
                    🎲 开始点名
                </button>
                
                <div class="picker-candidates" id="pickerCandidates" style="margin-top: 20px;">
                    ${students.map(s => `
                        <span class="picker-candidate" data-id="${s.id}">${s.name}</span>
                    `).join('')}
                </div>
                
                <div id="pickerResult" style="margin-top: 20px; display: none;">
                    <h4>点名结果</h4>
                    <div id="pickerResultList" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 12px;"></div>
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">关闭</button>
        `;

        App.showModal('随机点名', content, footer);

        let pickCount = 1;
        let isRunning = false;
        let intervalId = null;

        // Count selector
        document.querySelectorAll('.picker-count').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.picker-count').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                pickCount = parseInt(btn.dataset.count);
            });
        });

        // Start button
        document.getElementById('startPickerBtn')?.addEventListener('click', () => {
            if (isRunning) return;
            isRunning = true;

            const pickerName = document.getElementById('pickerName');
            const pickerDisplay = document.getElementById('pickerDisplay');
            const candidates = document.querySelectorAll('.picker-candidate');
            const resultDiv = document.getElementById('pickerResult');
            const resultList = document.getElementById('pickerResultList');

            resultDiv.style.display = 'none';
            
            // Animation
            let counter = 0;
            const maxIterations = 30;
            let speed = 50;

            intervalId = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * students.length);
                pickerName.textContent = students[randomIndex].name.charAt(0);
                
                candidates.forEach((c, i) => {
                    c.classList.toggle('active', i === randomIndex);
                });

                counter++;
                speed += 5;

                if (counter >= maxIterations) {
                    clearInterval(intervalId);
                    
                    // Final selection
                    const selected = [];
                    const available = [...students];
                    
                    for (let i = 0; i < Math.min(pickCount, available.length); i++) {
                        const randIndex = Math.floor(Math.random() * available.length);
                        selected.push(available.splice(randIndex, 1)[0]);
                    }

                    // Show result
                    if (selected.length === 1) {
                        pickerName.textContent = selected[0].name;
                        pickerDisplay.style.animation = 'bounce 0.5s';
                    } else {
                        pickerName.textContent = '✓';
                    }

                    resultDiv.style.display = 'block';
                    resultList.innerHTML = selected.map(s => `
                        <div style="padding: 8px 16px; background: var(--primary-gradient); color: white; border-radius: 20px; font-weight: 500;">
                            ${s.name}
                        </div>
                    `).join('');

                    // Highlight selected
                    candidates.forEach(c => {
                        c.classList.remove('active');
                        if (selected.find(s => s.id === c.dataset.id)) {
                            c.classList.add('active');
                        }
                    });

                    // Save to history
                    Store.addRollCallRecord(selected.map(s => ({ id: s.id, name: s.name })));

                    isRunning = false;
                }
            }, speed);
        });
    },

    // ===== Lottery =====
    showLottery() {
        const defaultPrizes = [
            { name: '笔记本', icon: '📓' },
            { name: '文具盒', icon: '✏️' },
            { name: '彩笔', icon: '🖍️' },
            { name: '谢谢参与', icon: '😊' },
            { name: '再来一次', icon: '🔄' },
            { name: '小红花', icon: '🌸' },
            { name: '糖果', icon: '🍬' },
            { name: '铅笔', icon: '✏️' }
        ];

        const content = `
            <div class="lottery-container">
                <div class="lottery-grid" id="lotteryGrid">
                    ${defaultPrizes.slice(0, 8).map((prize, i) => {
                        if (i === 4) {
                            return `
                                <div class="lottery-cell center" id="startLotteryBtn">
                                    <span class="cell-icon">🎯</span>
                                    <span class="cell-name">开始</span>
                                </div>
                            `;
                        }
                        const actualIndex = i > 4 ? i - 1 : i;
                        return `
                            <div class="lottery-cell" data-index="${i}" data-prize="${defaultPrizes[actualIndex].name}">
                                <span class="cell-icon">${defaultPrizes[actualIndex].icon}</span>
                                <span class="cell-name">${defaultPrizes[actualIndex].name}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div id="lotteryResult" style="text-align: center; margin-top: 24px; display: none;">
                    <div style="font-size: 24px; font-weight: 700; color: var(--primary);">
                        🎉 恭喜获得
                    </div>
                    <div id="lotteryPrize" style="font-size: 32px; margin-top: 8px;"></div>
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">关闭</button>
        `;

        App.showModal('九宫格抽奖', content, footer);

        let isRunning = false;

        document.getElementById('startLotteryBtn')?.addEventListener('click', () => {
            if (isRunning) return;
            isRunning = true;

            const cells = document.querySelectorAll('.lottery-cell:not(.center)');
            const resultDiv = document.getElementById('lotteryResult');
            const prizeDiv = document.getElementById('lotteryPrize');
            
            resultDiv.style.display = 'none';
            
            // Order: 0,1,2,5,8,7,6,3 (clockwise)
            const order = [0, 1, 2, 5, 7, 6, 5, 3];
            // Corrected order for 3x3 grid (excluding center at index 4)
            // Top row: 0, 1, 2
            // Middle: 3, [4-center], 5  -> but we skip center, so cells are indexed 0-7
            // Bottom: 6, 7, 8 -> but cell index 5,6,7 in our array
            
            // Simplified order (0-7 matching cell data-index)
            const cellOrder = [];
            cells.forEach((cell, i) => cellOrder.push(i));
            
            // Spin animation
            let currentIndex = 0;
            let rounds = 3;
            let totalSteps = cellOrder.length * rounds + Math.floor(Math.random() * cellOrder.length);
            let stepCount = 0;
            let speed = 100;

            const spin = () => {
                cells.forEach(c => c.classList.remove('active'));
                cells[currentIndex].classList.add('active');
                
                stepCount++;
                currentIndex = (currentIndex + 1) % cellOrder.length;

                if (stepCount < totalSteps) {
                    // Slow down near the end
                    if (stepCount > totalSteps - 10) {
                        speed += 30;
                    }
                    setTimeout(spin, speed);
                } else {
                    // Final prize
                    const winningCell = cells[(currentIndex - 1 + cellOrder.length) % cellOrder.length];
                    const prize = winningCell.dataset.prize;
                    
                    resultDiv.style.display = 'block';
                    prizeDiv.innerHTML = `${winningCell.querySelector('.cell-icon').textContent} ${prize}`;
                    
                    // Save to history
                    Store.addLotteryRecord(prize, null);
                    
                    isRunning = false;
                }
            };

            spin();
        });
    },

    // ===== Batch Score =====
    showBatchScore() {
        const students = Store.getStudents();
        const groups = Store.getGroups();

        if (students.length === 0) {
            App.showToast('没有学生', 'warning');
            return;
        }

        const content = `
            <div class="batch-score">
                <div class="form-group">
                    <label class="form-label">快速选择</label>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                        <button class="btn btn-sm btn-secondary" id="selectAllBtn">全选</button>
                        <button class="btn btn-sm btn-secondary" id="selectNoneBtn">取消全选</button>
                        ${groups.map(g => `
                            <button class="btn btn-sm btn-secondary select-group-btn" data-group="${g.id}">
                                ${g.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">选择学生 (<span id="selectedCount">0</span>/${students.length})</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; max-height: 250px; overflow-y: auto; padding: 8px; background: var(--gray-50); border-radius: 8px;">
                        ${students.map(s => `
                            <label style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 6px; cursor: pointer;">
                                <input type="checkbox" class="student-checkbox" data-id="${s.id}" data-group="${s.groupId || ''}">
                                <span style="font-size: 13px;">${s.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">操作类型</label>
                    <div style="display: flex; gap: 12px;">
                        <label style="flex: 1; padding: 12px; border: 2px solid var(--green); border-radius: 8px; cursor: pointer; text-align: center;">
                            <input type="radio" name="batchAction" value="add" checked style="display: none;">
                            <span style="color: var(--green); font-weight: 500;">➕ 加分</span>
                        </label>
                        <label style="flex: 1; padding: 12px; border: 2px solid var(--red); border-radius: 8px; cursor: pointer; text-align: center;">
                            <input type="radio" name="batchAction" value="minus" style="display: none;">
                            <span style="color: var(--red); font-weight: 500;">➖ 扣分</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">分值</label>
                    <input type="number" class="form-input" id="batchScore" placeholder="请输入分值" min="1" max="100">
                </div>
                
                <div class="form-group">
                    <label class="form-label">备注</label>
                    <input type="text" class="form-input" id="batchReason" placeholder="可选备注">
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" id="confirmBatchBtn">确认操作</button>
        `;

        App.showModal('批量操作', content, footer);

        const checkboxes = document.querySelectorAll('.student-checkbox');
        const selectedCountEl = document.getElementById('selectedCount');

        function updateSelectedCount() {
            const count = document.querySelectorAll('.student-checkbox:checked').length;
            selectedCountEl.textContent = count;
        }

        checkboxes.forEach(cb => {
            cb.addEventListener('change', updateSelectedCount);
        });

        // Select all
        document.getElementById('selectAllBtn')?.addEventListener('click', () => {
            checkboxes.forEach(cb => cb.checked = true);
            updateSelectedCount();
        });

        // Select none
        document.getElementById('selectNoneBtn')?.addEventListener('click', () => {
            checkboxes.forEach(cb => cb.checked = false);
            updateSelectedCount();
        });

        // Select by group
        document.querySelectorAll('.select-group-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const groupId = btn.dataset.group;
                checkboxes.forEach(cb => {
                    if (cb.dataset.group === groupId) {
                        cb.checked = true;
                    }
                });
                updateSelectedCount();
            });
        });

        // Radio buttons styling
        document.querySelectorAll('input[name="batchAction"]').forEach(radio => {
            radio.addEventListener('change', () => {
                document.querySelectorAll('input[name="batchAction"]').forEach(r => {
                    r.closest('label').style.opacity = r.checked ? '1' : '0.5';
                });
            });
        });

        // Confirm button
        document.getElementById('confirmBatchBtn')?.addEventListener('click', () => {
            const selectedIds = Array.from(document.querySelectorAll('.student-checkbox:checked'))
                .map(cb => cb.dataset.id);
            
            if (selectedIds.length === 0) {
                App.showToast('请选择学生', 'error');
                return;
            }

            const action = document.querySelector('input[name="batchAction"]:checked').value;
            const score = parseInt(document.getElementById('batchScore').value);
            const reason = document.getElementById('batchReason').value.trim() || `批量${action === 'add' ? '加' : '扣'}分`;

            if (!score || score < 1) {
                App.showToast('请输入有效分值', 'error');
                return;
            }

            const finalScore = action === 'add' ? score : -score;

            App.showConfirm(
                `确定要为 ${selectedIds.length} 名学生${action === 'add' ? '加' : '扣'} ${score} 分吗？`,
                () => {
                    selectedIds.forEach(id => {
                        Store.addScoreRecord({
                            studentId: id,
                            score: finalScore,
                            reason: reason
                        });
                    });

                    App.closeModal();
                    App.showToast(`已为 ${selectedIds.length} 名学生${action === 'add' ? '加' : '扣'}分`, 'success');
                }
            );
        });
    }
};
