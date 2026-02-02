/**
 * Shop Page Module
 */

const ShopPage = {
    currentTab: 'products',

    render() {
        const container = App.getPageContainer();
        if (!container) return;

        container.innerHTML = `
            <div class="shop-page animate-fade-in">
                <!-- Section Header -->
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="section-title-icon">🛒</span>
                        积分商城
                    </h2>
                    <button class="btn btn-primary" id="addProductBtn">
                        ➕ 添加商品
                    </button>
                </div>

                <!-- Tabs -->
                <div class="tabs" id="shopTabs">
                    <button class="tab ${this.currentTab === 'products' ? 'active' : ''}" data-tab="products">🎁 商品列表</button>
                    <button class="tab ${this.currentTab === 'exchange' ? 'active' : ''}" data-tab="exchange">💰 兑换</button>
                    <button class="tab ${this.currentTab === 'history' ? 'active' : ''}" data-tab="history">📋 兑换记录</button>
                </div>

                <!-- Content -->
                <div id="shopContent">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;

        this.bindEvents();
    },

    renderTabContent() {
        switch (this.currentTab) {
            case 'products':
                return this.renderProducts();
            case 'exchange':
                return this.renderExchange();
            case 'history':
                return this.renderHistory();
            default:
                return this.renderProducts();
        }
    },

    renderProducts() {
        const products = Store.getProducts();

        if (products.length === 0) {
            return App.renderEmpty(
                '🎁',
                '还没有商品',
                '添加商品让学生用积分兑换奖品',
                '<button class="btn btn-primary" onclick="ShopPage.showAddProductModal()">添加商品</button>'
            );
        }

        return `
            <div class="product-grid">
                ${products.map(product => `
                    <div class="product-card" data-id="${product.id}">
                        <div class="product-icon">${product.icon}</div>
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">${product.price} 积分</div>
                        <div class="product-stock ${product.stock <= 0 ? 'text-danger' : ''}">
                            库存: ${product.stock}
                        </div>
                        <div style="display: flex; gap: 4px; margin-top: 12px;">
                            <button class="btn btn-sm btn-secondary edit-product-btn" data-id="${product.id}">编辑</button>
                            <button class="btn btn-sm btn-danger delete-product-btn" data-id="${product.id}">删除</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderExchange() {
        const students = Store.getStudents().sort((a, b) => b.totalScore - a.totalScore);
        const products = Store.getProducts().filter(p => p.stock > 0);

        if (students.length === 0) {
            return App.renderEmpty('👤', '暂无学生', '请先添加学生');
        }

        if (products.length === 0) {
            return App.renderEmpty('🎁', '暂无可兑换商品', '请先添加商品');
        }

        return `
            <div class="card">
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">选择学生</label>
                        <select class="form-select" id="exchangeStudent">
                            <option value="">请选择学生</option>
                            ${students.map(s => `
                                <option value="${s.id}" data-score="${s.totalScore}">
                                    ${s.name} (${s.totalScore}积分)
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div id="studentScoreDisplay" style="margin-bottom: 16px; display: none;">
                        <div style="padding: 16px; background: var(--primary-gradient); color: white; border-radius: 12px; text-align: center;">
                            <div style="font-size: 14px;">当前积分</div>
                            <div style="font-size: 32px; font-weight: 700;" id="currentScore">0</div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">选择商品</label>
                        <div class="product-grid" id="exchangeProducts">
                            ${products.map(p => `
                                <div class="product-card exchange-product" data-id="${p.id}" data-price="${p.price}" style="cursor: pointer;">
                                    <div class="product-icon">${p.icon}</div>
                                    <div class="product-name">${p.name}</div>
                                    <div class="product-price">${p.price} 积分</div>
                                    <div class="product-stock">库存: ${p.stock}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <button class="btn btn-primary btn-lg w-full" id="confirmExchangeBtn" disabled>
                        确认兑换
                    </button>
                </div>
            </div>
        `;
    },

    renderHistory() {
        const exchanges = Store.getExchanges().sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        const students = Store.getStudents();

        if (exchanges.length === 0) {
            return App.renderEmpty('📋', '暂无兑换记录', '学生兑换商品后会显示在这里');
        }

        return `
            <div class="card">
                <div class="card-body">
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${exchanges.map(e => {
                            const student = students.find(s => s.id === e.studentId);
                            return `
                                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--gray-50); border-radius: 8px;">
                                    ${student ? `
                                        <div class="student-avatar ${App.getAvatarClass(student.avatar)}" style="width: 40px; height: 40px; font-size: 16px;">
                                            ${student.name.charAt(0)}
                                        </div>
                                    ` : '<div style="width: 40px; height: 40px; border-radius: 50%; background: var(--gray-300);"></div>'}
                                    <div style="flex: 1;">
                                        <div style="font-weight: 500;">${student ? student.name : '未知'}</div>
                                        <div style="font-size: 13px; color: var(--text-muted);">
                                            兑换了 ${e.productName}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="color: var(--red); font-weight: 600;">-${e.price}积分</div>
                                        <div style="font-size: 12px; color: var(--text-muted);">
                                            ${App.formatRelativeTime(e.createdAt)}
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
        // Add product button
        document.getElementById('addProductBtn')?.addEventListener('click', () => this.showAddProductModal());

        // Tabs
        document.getElementById('shopTabs')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab')) {
                document.querySelectorAll('#shopTabs .tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTab = e.target.dataset.tab;
                document.getElementById('shopContent').innerHTML = this.renderTabContent();
                this.bindExchangeEvents();
                this.bindProductEvents();
            }
        });

        this.bindProductEvents();
        this.bindExchangeEvents();
    },

    bindProductEvents() {
        // Edit product
        document.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditProductModal(btn.dataset.id);
            });
        });

        // Delete product
        document.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteProduct(btn.dataset.id);
            });
        });
    },

    bindExchangeEvents() {
        const studentSelect = document.getElementById('exchangeStudent');
        const exchangeProducts = document.getElementById('exchangeProducts');
        const confirmBtn = document.getElementById('confirmExchangeBtn');
        const scoreDisplay = document.getElementById('studentScoreDisplay');
        const currentScoreEl = document.getElementById('currentScore');

        let selectedStudentId = null;
        let selectedProductId = null;

        if (studentSelect) {
            studentSelect.addEventListener('change', () => {
                selectedStudentId = studentSelect.value;
                const option = studentSelect.selectedOptions[0];
                
                if (option && option.dataset.score) {
                    scoreDisplay.style.display = 'block';
                    currentScoreEl.textContent = option.dataset.score;
                } else {
                    scoreDisplay.style.display = 'none';
                }
                
                updateConfirmBtn();
            });
        }

        if (exchangeProducts) {
            exchangeProducts.addEventListener('click', (e) => {
                const card = e.target.closest('.exchange-product');
                if (card) {
                    document.querySelectorAll('.exchange-product').forEach(c => {
                        c.style.border = '2px solid transparent';
                    });
                    card.style.border = '2px solid var(--primary)';
                    selectedProductId = card.dataset.id;
                    updateConfirmBtn();
                }
            });
        }

        function updateConfirmBtn() {
            if (confirmBtn) {
                confirmBtn.disabled = !selectedStudentId || !selectedProductId;
            }
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (!selectedStudentId || !selectedProductId) return;

                const student = Store.getStudentById(selectedStudentId);
                const product = Store.getProducts().find(p => p.id === selectedProductId);

                if (!student || !product) return;

                if (student.totalScore < product.price) {
                    App.showToast('积分不足，无法兑换', 'error');
                    return;
                }

                if (product.stock <= 0) {
                    App.showToast('商品库存不足', 'error');
                    return;
                }

                App.showConfirm(
                    `确定要为 ${student.name} 兑换 ${product.name}（${product.price}积分）吗？`,
                    () => {
                        Store.addExchange({
                            studentId: student.id,
                            productId: product.id,
                            productName: product.name,
                            price: product.price
                        });
                        App.showToast('兑换成功！', 'success');
                        ShopPage.render();
                    }
                );
            });
        }
    },

    showAddProductModal() {
        const icons = ['📓', '🖍️', '✏️', '🎫', '🎁', '🧸', '🏀', '📚', '🎨', '🎮', '🍭', '🌟', '💎', '🎪', '🎯'];

        const content = `
            <form id="addProductForm">
                <div class="form-group">
                    <label class="form-label">商品名称 *</label>
                    <input type="text" class="form-input" id="productName" placeholder="例如：笔记本" required>
                </div>
                <div class="form-group">
                    <label class="form-label">所需积分 *</label>
                    <input type="number" class="form-input" id="productPrice" placeholder="请输入积分" min="1" required>
                </div>
                <div class="form-group">
                    <label class="form-label">库存数量</label>
                    <input type="number" class="form-input" id="productStock" value="10" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">商品图标</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="productIconSelector">
                        ${icons.map((icon, i) => `
                            <button type="button" class="btn btn-secondary icon-btn ${i === 0 ? 'active' : ''}" 
                                data-icon="${icon}" style="font-size: 24px; padding: 8px;">
                                ${icon}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="productIcon" value="${icons[0]}">
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" id="saveProductBtn">保存</button>
        `;

        App.showModal('添加商品', content, footer);

        // Icon selector
        document.getElementById('productIconSelector')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('icon-btn')) {
                document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('productIcon').value = e.target.dataset.icon;
            }
        });

        // Save button
        document.getElementById('saveProductBtn')?.addEventListener('click', () => {
            const name = document.getElementById('productName').value.trim();
            const price = parseInt(document.getElementById('productPrice').value);
            const stock = parseInt(document.getElementById('productStock').value) || 10;
            const icon = document.getElementById('productIcon').value;

            if (!name) {
                App.showToast('请输入商品名称', 'error');
                return;
            }
            if (!price || price < 1) {
                App.showToast('请输入有效积分', 'error');
                return;
            }

            Store.addProduct({ name, price, stock, icon });
            App.closeModal();
            App.showToast('添加成功', 'success');
            this.render();
        });
    },

    showEditProductModal(productId) {
        const product = Store.getProducts().find(p => p.id === productId);
        if (!product) return;

        const icons = ['📓', '🖍️', '✏️', '🎫', '🎁', '🧸', '🏀', '📚', '🎨', '🎮', '🍭', '🌟', '💎', '🎪', '🎯'];

        const content = `
            <form id="editProductForm">
                <div class="form-group">
                    <label class="form-label">商品名称</label>
                    <input type="text" class="form-input" id="editProductName" value="${product.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">所需积分</label>
                    <input type="number" class="form-input" id="editProductPrice" value="${product.price}" min="1" required>
                </div>
                <div class="form-group">
                    <label class="form-label">库存数量</label>
                    <input type="number" class="form-input" id="editProductStock" value="${product.stock}" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">商品图标</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="editProductIconSelector">
                        ${icons.map(icon => `
                            <button type="button" class="btn btn-secondary icon-btn ${product.icon === icon ? 'active' : ''}" 
                                data-icon="${icon}" style="font-size: 24px; padding: 8px;">
                                ${icon}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="editProductIcon" value="${product.icon}">
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" id="updateProductBtn">保存</button>
        `;

        App.showModal('编辑商品', content, footer);

        // Icon selector
        document.getElementById('editProductIconSelector')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('icon-btn')) {
                document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('editProductIcon').value = e.target.dataset.icon;
            }
        });

        // Update button
        document.getElementById('updateProductBtn')?.addEventListener('click', () => {
            const name = document.getElementById('editProductName').value.trim();
            const price = parseInt(document.getElementById('editProductPrice').value);
            const stock = parseInt(document.getElementById('editProductStock').value);
            const icon = document.getElementById('editProductIcon').value;

            if (!name || !price) {
                App.showToast('请填写完整信息', 'error');
                return;
            }

            Store.updateProduct(productId, { name, price, stock, icon });
            App.closeModal();
            App.showToast('保存成功', 'success');
            this.render();
        });
    },

    deleteProduct(productId) {
        const product = Store.getProducts().find(p => p.id === productId);
        if (!product) return;

        App.showConfirm(
            `确定要删除商品"${product.name}"吗？`,
            () => {
                Store.deleteProduct(productId);
                App.showToast('删除成功', 'success');
                this.render();
            }
        );
    }
};
