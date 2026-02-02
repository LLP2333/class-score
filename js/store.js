/**
 * Store - Data Management Layer
 * Manages all data persistence with localStorage
 */

const Store = {
    // Storage keys
    KEYS: {
        CLASS_INFO: 'classScore_classInfo',
        STUDENTS: 'classScore_students',
        GROUPS: 'classScore_groups',
        RULES: 'classScore_rules',
        PRODUCTS: 'classScore_products',
        SCORE_RECORDS: 'classScore_scoreRecords',
        EXCHANGES: 'classScore_exchanges',
        ROLL_CALL_HISTORY: 'classScore_rollCallHistory',
        LOTTERY_HISTORY: 'classScore_lotteryHistory',
        SETTINGS: 'classScore_settings'
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    // ===== Generic CRUD Operations =====
    
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },

    // ===== Class Info =====
    
    getClassInfo() {
        return this.get(this.KEYS.CLASS_INFO) || {
            name: '我的班级',
            teacher: '班主任',
            createdAt: new Date().toISOString()
        };
    },

    setClassInfo(info) {
        return this.set(this.KEYS.CLASS_INFO, info);
    },

    // ===== Students =====
    
    getStudents() {
        return this.get(this.KEYS.STUDENTS) || [];
    },

    getStudentById(id) {
        const students = this.getStudents();
        return students.find(s => s.id === id);
    },

    addStudent(student) {
        const students = this.getStudents();
        const newStudent = {
            id: this.generateId(),
            name: student.name,
            avatar: student.avatar || Math.floor(Math.random() * 8) + 1,
            groupId: student.groupId || null,
            totalScore: student.totalScore || 0,
            createdAt: new Date().toISOString()
        };
        students.push(newStudent);
        this.set(this.KEYS.STUDENTS, students);
        return newStudent;
    },

    updateStudent(id, updates) {
        const students = this.getStudents();
        const index = students.findIndex(s => s.id === id);
        if (index !== -1) {
            students[index] = { ...students[index], ...updates };
            this.set(this.KEYS.STUDENTS, students);
            return students[index];
        }
        return null;
    },

    deleteStudent(id) {
        const students = this.getStudents();
        const filtered = students.filter(s => s.id !== id);
        this.set(this.KEYS.STUDENTS, filtered);
        // Also delete related score records
        const records = this.getScoreRecords().filter(r => r.studentId !== id);
        this.set(this.KEYS.SCORE_RECORDS, records);
        return true;
    },

    // ===== Groups =====
    
    getGroups() {
        return this.get(this.KEYS.GROUPS) || [];
    },

    getGroupById(id) {
        const groups = this.getGroups();
        return groups.find(g => g.id === id);
    },

    addGroup(group) {
        const groups = this.getGroups();
        const existingColors = groups.map(g => g.color);
        let color = group.color || 1;
        while (existingColors.includes(color) && color <= 8) {
            color++;
        }
        const newGroup = {
            id: this.generateId(),
            name: group.name,
            color: color,
            leaderId: group.leaderId || null,
            createdAt: new Date().toISOString()
        };
        groups.push(newGroup);
        this.set(this.KEYS.GROUPS, groups);
        return newGroup;
    },

    // Set group leader (must be a member of the group)
    setGroupLeader(groupId, studentId) {
        const group = this.getGroupById(groupId);
        if (!group) {
            return { success: false, error: '小组不存在' };
        }
        
        // Validate: leader must be a member of this group
        if (studentId) {
            const student = this.getStudentById(studentId);
            if (!student) {
                return { success: false, error: '学生不存在' };
            }
            if (student.groupId !== groupId) {
                return { success: false, error: '组长必须是当前小组的成员' };
            }
        }
        
        this.updateGroup(groupId, { leaderId: studentId });
        return { success: true };
    },

    // Check if student is already in another group
    isStudentInOtherGroup(studentId, excludeGroupId = null) {
        const student = this.getStudentById(studentId);
        if (!student || !student.groupId) return false;
        if (excludeGroupId && student.groupId === excludeGroupId) return false;
        return true;
    },

    // Get student's current group
    getStudentGroup(studentId) {
        const student = this.getStudentById(studentId);
        if (student && student.groupId) {
            return this.getGroupById(student.groupId);
        }
        return null;
    },

    // Get group leader
    getGroupLeader(groupId) {
        const group = this.getGroupById(groupId);
        if (group && group.leaderId) {
            return this.getStudentById(group.leaderId);
        }
        // Default: first member (by join order, approximated by createdAt)
        const members = this.getGroupMembers(groupId);
        if (members.length > 0) {
            members.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            return members[0];
        }
        return null;
    },

    // Check if student is group leader
    isGroupLeader(groupId, studentId) {
        const leader = this.getGroupLeader(groupId);
        return leader && leader.id === studentId;
    },

    updateGroup(id, updates) {
        const groups = this.getGroups();
        const index = groups.findIndex(g => g.id === id);
        if (index !== -1) {
            // Validate leaderId if being updated
            if (updates.leaderId !== undefined && updates.leaderId !== null) {
                const student = this.getStudentById(updates.leaderId);
                if (!student || student.groupId !== id) {
                    // Invalid leader, clear it
                    updates.leaderId = null;
                }
            }
            groups[index] = { ...groups[index], ...updates };
            this.set(this.KEYS.GROUPS, groups);
            return groups[index];
        }
        return null;
    },

    deleteGroup(id) {
        const groups = this.getGroups();
        const filtered = groups.filter(g => g.id !== id);
        this.set(this.KEYS.GROUPS, filtered);
        // Remove group from students
        const students = this.getStudents();
        students.forEach(s => {
            if (s.groupId === id) {
                s.groupId = null;
            }
        });
        this.set(this.KEYS.STUDENTS, students);
        return true;
    },

    getGroupMembers(groupId) {
        const students = this.getStudents();
        return students.filter(s => s.groupId === groupId);
    },

    getGroupTotalScore(groupId) {
        const members = this.getGroupMembers(groupId);
        return members.reduce((sum, s) => sum + s.totalScore, 0);
    },

    // ===== Rules =====
    
    getRules() {
        const rules = this.get(this.KEYS.RULES);
        if (rules) return rules;
        
        // Default rules
        const defaultRules = [
            { id: this.generateId(), name: '课堂回答问题', score: 5, type: 'add', category: '学习', icon: '✋' },
            { id: this.generateId(), name: '作业优秀', score: 3, type: 'add', category: '学习', icon: '📝' },
            { id: this.generateId(), name: '帮助同学', score: 2, type: 'add', category: '品德', icon: '🤝' },
            { id: this.generateId(), name: '课堂表现好', score: 2, type: 'add', category: '学习', icon: '⭐' },
            { id: this.generateId(), name: '值日认真', score: 2, type: 'add', category: '劳动', icon: '🧹' },
            { id: this.generateId(), name: '迟到早退', score: 3, type: 'minus', category: '纪律', icon: '⏰' },
            { id: this.generateId(), name: '作业未交', score: 5, type: 'minus', category: '学习', icon: '❌' },
            { id: this.generateId(), name: '上课说话', score: 2, type: 'minus', category: '纪律', icon: '🗣️' }
        ];
        this.set(this.KEYS.RULES, defaultRules);
        return defaultRules;
    },

    addRule(rule) {
        const rules = this.getRules();
        const newRule = {
            id: this.generateId(),
            name: rule.name,
            score: Math.abs(rule.score),
            type: rule.type,
            category: rule.category || '其他',
            icon: rule.icon || '📌'
        };
        rules.push(newRule);
        this.set(this.KEYS.RULES, rules);
        return newRule;
    },

    updateRule(id, updates) {
        const rules = this.getRules();
        const index = rules.findIndex(r => r.id === id);
        if (index !== -1) {
            rules[index] = { ...rules[index], ...updates };
            this.set(this.KEYS.RULES, rules);
            return rules[index];
        }
        return null;
    },

    deleteRule(id) {
        const rules = this.getRules();
        const filtered = rules.filter(r => r.id !== id);
        this.set(this.KEYS.RULES, filtered);
        return true;
    },

    // ===== Score Records =====
    
    getScoreRecords() {
        return (this.get(this.KEYS.SCORE_RECORDS) || []).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    },

    addScoreRecord(record) {
        const records = this.getScoreRecords();
        const student = this.getStudentById(record.studentId);
        
        const newRecord = {
            id: this.generateId(),
            studentId: record.studentId,
            groupId: student ? student.groupId : null, // 保存记录时的小组ID
            ruleId: record.ruleId,
            score: record.score,
            reason: record.reason || '',
            createdAt: new Date().toISOString()
        };
        records.push(newRecord);
        this.set(this.KEYS.SCORE_RECORDS, records);

        // Update student total score
        if (student) {
            this.updateStudent(record.studentId, {
                totalScore: student.totalScore + record.score
            });
        }
        
        return newRecord;
    },

    getStudentRecords(studentId) {
        const records = this.getScoreRecords();
        return records.filter(r => r.studentId === studentId).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    },

    // ===== Products =====
    
    getProducts() {
        const products = this.get(this.KEYS.PRODUCTS);
        if (products) return products;
        
        // Default products
        const defaultProducts = [
            { id: this.generateId(), name: '笔记本', price: 30, stock: 10, icon: '📓', exchangeCount: 0 },
            { id: this.generateId(), name: '彩色笔', price: 40, stock: 8, icon: '🖍️', exchangeCount: 0 },
            { id: this.generateId(), name: '文具套装', price: 50, stock: 5, icon: '✏️', exchangeCount: 0 },
            { id: this.generateId(), name: '免作业卡', price: 100, stock: 3, icon: '🎫', exchangeCount: 0 }
        ];
        this.set(this.KEYS.PRODUCTS, defaultProducts);
        return defaultProducts;
    },

    addProduct(product) {
        const products = this.getProducts();
        const newProduct = {
            id: this.generateId(),
            name: product.name,
            price: product.price,
            stock: product.stock || 10,
            icon: product.icon || '🎁',
            exchangeCount: 0
        };
        products.push(newProduct);
        this.set(this.KEYS.PRODUCTS, products);
        return newProduct;
    },

    updateProduct(id, updates) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updates };
            this.set(this.KEYS.PRODUCTS, products);
            return products[index];
        }
        return null;
    },

    deleteProduct(id) {
        const products = this.getProducts();
        const filtered = products.filter(p => p.id !== id);
        this.set(this.KEYS.PRODUCTS, filtered);
        return true;
    },

    // ===== Exchanges =====
    
    getExchanges() {
        return this.get(this.KEYS.EXCHANGES) || [];
    },

    addExchange(exchange) {
        const exchanges = this.getExchanges();
        const newExchange = {
            id: this.generateId(),
            studentId: exchange.studentId,
            productId: exchange.productId,
            productName: exchange.productName,
            price: exchange.price,
            createdAt: new Date().toISOString()
        };
        exchanges.push(newExchange);
        this.set(this.KEYS.EXCHANGES, exchanges);

        // Update product stock
        const product = this.getProducts().find(p => p.id === exchange.productId);
        if (product) {
            this.updateProduct(exchange.productId, {
                stock: product.stock - 1,
                exchangeCount: product.exchangeCount + 1
            });
        }

        // Deduct student score
        const student = this.getStudentById(exchange.studentId);
        if (student) {
            this.updateStudent(exchange.studentId, {
                totalScore: student.totalScore - exchange.price
            });
        }

        return newExchange;
    },

    // ===== Roll Call History =====
    
    getRollCallHistory() {
        return this.get(this.KEYS.ROLL_CALL_HISTORY) || [];
    },

    addRollCallRecord(students) {
        const history = this.getRollCallHistory();
        const record = {
            id: this.generateId(),
            students: students,
            createdAt: new Date().toISOString()
        };
        history.unshift(record);
        // Keep only last 50 records
        if (history.length > 50) history.pop();
        this.set(this.KEYS.ROLL_CALL_HISTORY, history);
        return record;
    },

    // ===== Lottery History =====
    
    getLotteryHistory() {
        return this.get(this.KEYS.LOTTERY_HISTORY) || [];
    },

    addLotteryRecord(prize, studentId) {
        const history = this.getLotteryHistory();
        const record = {
            id: this.generateId(),
            prize: prize,
            studentId: studentId,
            createdAt: new Date().toISOString()
        };
        history.unshift(record);
        if (history.length > 50) history.pop();
        this.set(this.KEYS.LOTTERY_HISTORY, history);
        return record;
    },

    // ===== Settings =====
    
    getSettings() {
        return this.get(this.KEYS.SETTINGS) || {
            theme: 'light',
            animationSpeed: 'normal',
            soundEnabled: true
        };
    },

    setSettings(settings) {
        return this.set(this.KEYS.SETTINGS, settings);
    },

    // ===== Statistics =====
    
    getStatistics() {
        const students = this.getStudents();
        const groups = this.getGroups();
        const records = this.getScoreRecords();
        
        const totalScore = students.reduce((sum, s) => sum + s.totalScore, 0);
        const maxScore = students.length > 0 ? Math.max(...students.map(s => s.totalScore)) : 0;
        const avgScore = students.length > 0 ? Math.round(totalScore / students.length) : 0;
        
        return {
            studentCount: students.length,
            groupCount: groups.length,
            maxScore: maxScore,
            avgScore: avgScore,
            totalRecords: records.length
        };
    },

    getWeeklyScoreTrend() {
        const records = this.getScoreRecords();
        const now = new Date();
        const weeks = [];
        
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            const weekRecords = records.filter(r => {
                const date = new Date(r.createdAt);
                return date >= weekStart && date <= weekEnd;
            });
            
            const total = weekRecords.reduce((sum, r) => sum + r.score, 0);
            weeks.push({
                label: `第${4-i}周`,
                value: total
            });
        }
        
        return weeks;
    },

    getCategoryDistribution() {
        const records = this.getScoreRecords();
        const rules = this.getRules();
        const distribution = {};
        
        records.forEach(record => {
            const rule = rules.find(r => r.id === record.ruleId);
            if (rule) {
                const category = rule.category;
                if (!distribution[category]) {
                    distribution[category] = 0;
                }
                distribution[category] += Math.abs(record.score);
            }
        });
        
        return Object.entries(distribution).map(([name, value]) => ({ name, value }));
    },

    // ===== Backup & Restore =====
    
    exportAllData() {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            classInfo: this.getClassInfo(),
            students: this.getStudents(),
            groups: this.getGroups(),
            rules: this.getRules(),
            products: this.getProducts(),
            scoreRecords: this.getScoreRecords(),
            exchanges: this.getExchanges(),
            rollCallHistory: this.getRollCallHistory(),
            lotteryHistory: this.getLotteryHistory(),
            settings: this.getSettings()
        };
        return JSON.stringify(data, null, 2);
    },

    importAllData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.version) {
                throw new Error('Invalid backup file');
            }
            
            if (data.classInfo) this.setClassInfo(data.classInfo);
            if (data.students) this.set(this.KEYS.STUDENTS, data.students);
            if (data.groups) this.set(this.KEYS.GROUPS, data.groups);
            if (data.rules) this.set(this.KEYS.RULES, data.rules);
            if (data.products) this.set(this.KEYS.PRODUCTS, data.products);
            if (data.scoreRecords) this.set(this.KEYS.SCORE_RECORDS, data.scoreRecords);
            if (data.exchanges) this.set(this.KEYS.EXCHANGES, data.exchanges);
            if (data.rollCallHistory) this.set(this.KEYS.ROLL_CALL_HISTORY, data.rollCallHistory);
            if (data.lotteryHistory) this.set(this.KEYS.LOTTERY_HISTORY, data.lotteryHistory);
            if (data.settings) this.setSettings(data.settings);
            
            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    },

    clearAllData() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        return true;
    },

    // ===== Demo Data =====
    
    initDemoData() {
        // Only init if no students exist
        if (this.getStudents().length > 0) return;

        // Create groups
        const group1 = this.addGroup({ name: '第一组' });
        const group2 = this.addGroup({ name: '第二组' });
        const group3 = this.addGroup({ name: '第三组' });
        const group4 = this.addGroup({ name: '第四组' });

        // Create students
        const names = [
            '王小明', '李小红', '张小刚', '刘小芳', '陈小华',
            '赵小丽', '周小伟', '吴小燕', '孙小强', '郑小雪',
            '王五', '李四', '张三', '刘六', '陈七',
            '赵八', '周九', '吴十', '孙十一', '郑十二'
        ];

        const groups = [group1, group2, group3, group4];
        
        names.forEach((name, index) => {
            const student = this.addStudent({
                name: name,
                avatar: (index % 8) + 1,
                groupId: groups[index % 4].id,
                totalScore: Math.floor(Math.random() * 100) + 50
            });
        });

        // Add some score records
        const students = this.getStudents();
        const rules = this.getRules();
        
        students.slice(0, 10).forEach(student => {
            const randomRule = rules[Math.floor(Math.random() * rules.length)];
            const score = randomRule.type === 'add' ? randomRule.score : -randomRule.score;
            
            // Add record without updating score (already set random score)
            const records = this.getScoreRecords();
            records.push({
                id: this.generateId(),
                studentId: student.id,
                ruleId: randomRule.id,
                score: score,
                reason: randomRule.name,
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            });
            this.set(this.KEYS.SCORE_RECORDS, records);
        });
    }
};

// Note: Demo data is NOT auto-initialized anymore.
// Users can manually generate demo data from Settings page.
