/**
 * Backend - 后端通信模块
 * 处理后端检测、用户认证、数据同步
 */

const Backend = {
    // 后端配置
    config: {
        baseUrl: 'http://127.0.0.1:8000',
        timeout: 3000 // 检测超时时间
    },

    // 状态
    state: {
        available: false,  // 后端是否可用
        user: null,        // 当前登录用户
        token: null,       // JWT Token
        hasRemoteData: false // 后端是否有数据
    },

    // Storage keys
    KEYS: {
        TOKEN: 'classScore_backend_token',
        USER: 'classScore_backend_user'
    },

    // 初始化
    async init() {
        // 恢复保存的登录状态
        this.restoreSession();
        // 检测后端是否可用
        await this.checkBackend();
        return this.state.available;
    },

    // 恢复会话
    restoreSession() {
        try {
            const token = localStorage.getItem(this.KEYS.TOKEN);
            const user = localStorage.getItem(this.KEYS.USER);
            if (token && user) {
                this.state.token = token;
                this.state.user = JSON.parse(user);
            }
        } catch (e) {
            console.error('恢复会话失败:', e);
        }
    },

    // 保存会话
    saveSession() {
        try {
            if (this.state.token && this.state.user) {
                localStorage.setItem(this.KEYS.TOKEN, this.state.token);
                localStorage.setItem(this.KEYS.USER, JSON.stringify(this.state.user));
            }
        } catch (e) {
            console.error('保存会话失败:', e);
        }
    },

    // 清除会话
    clearSession() {
        this.state.token = null;
        this.state.user = null;
        this.state.hasRemoteData = false;
        localStorage.removeItem(this.KEYS.TOKEN);
        localStorage.removeItem(this.KEYS.USER);
    },

    // 检测后端是否可用
    async checkBackend() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(`${this.config.baseUrl}/api/health`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                this.state.available = data.success === true;
                console.log('后端检测成功:', data);
                return true;
            }
        } catch (e) {
            console.log('后端不可用:', e.message);
        }
        
        this.state.available = false;
        return false;
    },

    // 是否已登录
    isLoggedIn() {
        return this.state.available && this.state.token && this.state.user;
    },

    // 获取当前用户
    getUser() {
        return this.state.user;
    },

    // 注册
    async register(username, password) {
        if (!this.state.available) {
            return { success: false, error: '后端不可用' };
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.state.token = data.data.token;
                this.state.user = { username: data.data.username };
                this.state.hasRemoteData = false;
                this.saveSession();
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error || '注册失败' };
            }
        } catch (e) {
            console.error('注册错误:', e);
            return { success: false, error: '网络错误' };
        }
    },

    // 登录
    async login(username, password) {
        if (!this.state.available) {
            return { success: false, error: '后端不可用' };
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.state.token = data.data.token;
                this.state.user = { username: data.data.username };
                this.state.hasRemoteData = data.data.has_data || false;
                this.saveSession();
                return { 
                    success: true, 
                    message: data.message,
                    hasRemoteData: this.state.hasRemoteData 
                };
            } else {
                return { success: false, error: data.error || '登录失败' };
            }
        } catch (e) {
            console.error('登录错误:', e);
            return { success: false, error: '网络错误' };
        }
    },

    // 登出
    logout() {
        this.clearSession();
        return { success: true };
    },

    // 上传数据到后端
    async uploadData() {
        if (!this.isLoggedIn()) {
            return { success: false, error: '请先登录' };
        }

        try {
            // 获取本地数据
            const localData = JSON.parse(Store.exportAllData());

            const response = await fetch(`${this.config.baseUrl}/api/sync/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.token}`
                },
                body: JSON.stringify(localData)
            });

            const data = await response.json();

            if (data.success) {
                this.state.hasRemoteData = true;
                return { success: true, message: '数据上传成功', data: data.data };
            } else {
                // Token可能过期
                if (response.status === 401) {
                    this.clearSession();
                    return { success: false, error: 'Token已过期，请重新登录' };
                }
                return { success: false, error: data.error || '上传失败' };
            }
        } catch (e) {
            console.error('上传错误:', e);
            return { success: false, error: '网络错误' };
        }
    },

    // 从后端下载数据
    async downloadData() {
        if (!this.isLoggedIn()) {
            return { success: false, error: '请先登录' };
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/api/sync/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.state.token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                if (data.data) {
                    // 导入数据
                    const success = Store.importAllData(JSON.stringify(data.data));
                    if (success) {
                        return { success: true, message: '数据下载成功' };
                    } else {
                        return { success: false, error: '数据导入失败' };
                    }
                } else {
                    return { success: true, message: '后端暂无数据', noData: true };
                }
            } else {
                // Token可能过期
                if (response.status === 401) {
                    this.clearSession();
                    return { success: false, error: 'Token已过期，请重新登录' };
                }
                return { success: false, error: data.error || '下载失败' };
            }
        } catch (e) {
            console.error('下载错误:', e);
            return { success: false, error: '网络错误' };
        }
    },

    // 获取后端状态信息
    getStatusInfo() {
        return {
            available: this.state.available,
            loggedIn: this.isLoggedIn(),
            username: this.state.user?.username || null,
            hasRemoteData: this.state.hasRemoteData
        };
    }
};
