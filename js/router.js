/**
 * Router - Simple Hash-based Routing
 */

const Router = {
    routes: {},
    currentPage: null,

    // Register a route
    register(path, handler) {
        this.routes[path] = handler;
    },

    // Navigate to a page
    navigate(path) {
        window.location.hash = path;
    },

    // Handle route change
    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const handler = this.routes[hash];
        
        if (handler) {
            this.currentPage = hash;
            this.updateNavigation(hash);
            this.updatePageTitle(hash);
            handler();
        } else {
            // Default to home if route not found
            this.navigate('home');
        }
    },

    // Update navigation active state
    updateNavigation(activePage) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            }
        });
    },

    // Update page title
    updatePageTitle(page) {
        const titles = {
            home: '首页',
            groups: '小组管理',
            ranking: '排行榜',
            timeline: '积分时间线',
            analysis: '数据分析',
            shop: '积分商城',
            rules: '积分规则',
            tools: '工具箱',
            settings: '系统设置'
        };
        
        const titleElement = document.getElementById('pageTitle');
        if (titleElement) {
            titleElement.textContent = titles[page] || '首页';
        }
    },

    // Initialize router
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Handle initial route
        this.handleRoute();
    }
};
