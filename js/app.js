/**
 * App - Main Application Entry
 */

const App = {
    // Initialize the application
    init() {
        this.setupEventListeners();
        this.registerRoutes();
        this.updateClassInfo();
        Router.init();
    },

    // Setup global event listeners
    setupEventListeners() {
        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && 
                    !sidebar.contains(e.target) && 
                    !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            });
        }

        // Navigation links
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Close mobile sidebar when navigating
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                Router.handleRoute();
                this.showToast('已刷新', 'success');
            });
        }

        // Modal close
        const modalOverlay = document.getElementById('modalOverlay');
        const modalClose = document.getElementById('modalClose');
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    },

    // Register all routes
    registerRoutes() {
        Router.register('home', () => HomePage.render());
        Router.register('groups', () => GroupsPage.render());
        Router.register('ranking', () => RankingPage.render());
        Router.register('timeline', () => TimelinePage.render());
        Router.register('analysis', () => AnalysisPage.render());
        Router.register('shop', () => ShopPage.render());
        Router.register('rules', () => RulesPage.render());
        Router.register('tools', () => ToolsPage.render());
        Router.register('settings', () => SettingsPage.render());
    },

    // Update class info in sidebar
    updateClassInfo() {
        const classInfo = Store.getClassInfo();
        const classNameElement = document.querySelector('.class-name');
        if (classNameElement) {
            classNameElement.textContent = classInfo.name;
        }
    },

    // Show modal
    showModal(title, content, footer = '') {
        const overlay = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');

        if (overlay && modalTitle && modalBody && modalFooter) {
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
            modalFooter.innerHTML = footer;
            overlay.classList.add('active');
        }
    },

    // Close modal
    closeModal() {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeIn var(--transition-normal) reverse';
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    },

    // Show confirm dialog
    showConfirm(message, onConfirm, onCancel = null) {
        const content = `
            <div class="confirm-content">
                <div class="confirm-icon">⚠️</div>
                <p class="confirm-message">${message}</p>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" id="confirmCancel">取消</button>
            <button class="btn btn-danger" id="confirmOk">确定</button>
        `;

        this.showModal('确认操作', content, footer);

        document.getElementById('confirmCancel').addEventListener('click', () => {
            this.closeModal();
            if (onCancel) onCancel();
        });

        document.getElementById('confirmOk').addEventListener('click', () => {
            this.closeModal();
            onConfirm();
        });
    },

    // Get avatar class for student
    getAvatarClass(avatarNumber) {
        return `avatar-${avatarNumber || Math.floor(Math.random() * 8) + 1}`;
    },

    // Get group color class
    getGroupColorClass(colorNumber) {
        return `group-color-${colorNumber || 1}`;
    },

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format relative time
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        return this.formatDate(dateString);
    },

    // Get the page container element
    getPageContainer() {
        return document.getElementById('pageContainer');
    },

    // Render loading state
    renderLoading() {
        const container = this.getPageContainer();
        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                </div>
            `;
        }
    },

    // Render empty state
    renderEmpty(icon, title, description, action = '') {
        return `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <h3 class="empty-title">${title}</h3>
                <p class="empty-description">${description}</p>
                ${action}
            </div>
        `;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
