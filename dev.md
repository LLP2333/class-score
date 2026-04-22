# 班级积分系统 - 项目文档

## 1. 系统概述

班级积分系统是一个面向学校的班级管理工具，支持学生积分记录、小组管理、排行榜、积分商城、宠物养成等功能。采用前后端分离架构，前端使用 Next.js，后端使用 Go + Gin + SQLite。

### 核心功能

| 功能模块 | 说明 |
|---------|------|
| 积分管理 | 根据规则对学生进行加分/扣分，支持自定义规则 |
| 小组管理 | 创建小组、分配成员、设置组长、小组 PK |
| 排行榜 | 学生积分排行 |
| 积分时间线 | 按时间查看积分变动记录 |
| 数据分析 | 积分统计图表、趋势分析、导出报表 |
| 积分商城 | 学生用积分兑换奖品 |
| 宠物乐园 | 学生养成宠物，积分越高宠物等级越高 |
| 工具箱 | 随机点名等辅助工具 |
| 多班级 | 教师可管理多个班级，支持切换 |
| 角色控制 | 教师可读写，学生只读 |

---

## 2. 系统架构

```
┌──────────────────────────────────────────────────────┐
│                    客户端（浏览器）                      │
└────────────────────────┬─────────────────────────────┘
                         │ HTTP
┌────────────────────────▼─────────────────────────────┐
│              Frontend (Next.js :3000)                 │
│  ┌─────────┐  ┌──────────┐  ┌───────────────────┐   │
│  │ Pages   │  │ Stores   │  │ Components        │   │
│  │ (App    │  │ (Zustand)│  │ (UI + Features)   │   │
│  │ Router) │  │          │  │                   │   │
│  └────┬────┘  └────┬─────┘  └───────────────────┘   │
│       └────────────┼─────── api.ts ──────────────┐   │
└────────────────────┼─────────────────────────────┘   │
                     │ RESTful API (JSON)               │
┌────────────────────▼─────────────────────────────┐   │
│              Backend (Go + Gin :8000)             │   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │ Handler  │  │   Store  │  │  Config  │       │   │
│  │ (路由处理)│  │ (数据层) │  │ (配置)   │       │   │
│  └────┬─────┘  └────┬─────┘  └──────────┘       │   │
│       └─────────────┼────────────────────────────┘   │
│                     │                                 │
│              ┌──────▼──────┐                         │
│              │   SQLite    │                         │
│              │  (users.db) │                         │
│              └─────────────┘                         │
└──────────────────────────────────────────────────────┘
```

### 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | Next.js 16 (App Router, Turbopack) |
| UI 组件 | shadcn/ui + Tailwind CSS |
| 状态管理 | Zustand |
| 图表 | Chart.js + react-chartjs-2 |
| Excel | xlsx (SheetJS) |
| 后端框架 | Go + Gin |
| 数据库 | SQLite (通过 database/sql + mattn/go-sqlite3) |
| 认证 | JWT (golang-jwt) |
| 部署 | Docker + Docker Compose |

### 认证流程

```
客户端                    后端
  │── POST /api/login ───▶│
  │                       │ 校验用户名密码
  │◀── { token, ... } ───│ 返回 JWT Token
  │                       │
  │── GET /api/xxx ──────▶│
  │   Header:             │ 解析 JWT，提取 user_id/role
  │   Authorization:      │ 教师路由检查 role=teacher
  │   Bearer <token>      │
  │◀── { data } ─────────│
```

- 教师自助注册，角色为 `teacher`
- 学生由教师创建，角色为 `student`，用姓名作为用户名，默认密码 `123456`
- JWT 有效期 24 小时（可配置）

---

## 3. 代码目录结构

```
classScore/
├── backend/                          # Go 后端
│   ├── main.go                       # 入口：路由注册、CORS、中间件
│   ├── config.yaml                   # 运行配置（端口、CORS、JWT、数据目录）
│   ├── Dockerfile                    # 后端 Docker 镜像
│   ├── .dockerignore
│   ├── go.mod / go.sum               # Go 依赖
│   ├── data/                         # 运行时数据（.gitignore 排除）
│   │   ├── users.db                  #   SQLite 数据库文件
│   │   └── userdata/                 #   旧版 JSON 数据（用于迁移）
│   └── internal/
│       ├── config/
│       │   └── config.go             # 配置结构体，读取 YAML
│       ├── handler/                  # HTTP 处理层（控制器）
│       │   ├── handler.go            #   Handler 结构体 + 中间件
│       │   ├── auth.go               #   注册、登录、改密码
│       │   ├── class.go              #   班级 CRUD
│       │   ├── student.go            #   学生 CRUD + 重置密码
│       │   ├── group.go              #   小组 CRUD
│       │   ├── rule.go               #   积分规则 CRUD
│       │   ├── record.go             #   积分记录 CRUD
│       │   ├── product.go            #   商品 CRUD
│       │   ├── pet.go                #   宠物物种/分配/配置
│       │   ├── settings.go           #   班级设置
│       │   └── migrate.go            #   数据迁移（旧版 JSON → DB）
│       ├── model/                    # 数据模型（请求/响应结构体）
│       │   ├── user.go
│       │   ├── class.go
│       │   ├── student.go
│       │   ├── group.go
│       │   ├── rule.go
│       │   ├── record.go
│       │   ├── product.go
│       │   ├── pet.go
│       │   ├── settings.go
│       │   └── migrate.go
│       └── store/                    # 数据访问层（DAO）
│           ├── sqlite.go             #   数据库初始化 + Schema 迁移
│           ├── user_store.go         #   用户表操作
│           ├── class_store.go        #   班级表操作
│           ├── student_store.go      #   学生表操作
│           ├── group_store.go        #   小组表操作
│           ├── rule_store.go         #   规则表操作
│           ├── record_store.go       #   积分记录操作
│           ├── product_store.go      #   商品 + 兑换操作
│           ├── pet_store.go          #   宠物操作
│           ├── settings_store.go     #   设置 + 点名记录操作
│           └── migrate_store.go      #   JSON 数据迁移逻辑
│
├── frontend/                         # Next.js 前端
│   ├── src/
│   │   ├── app/                      # 页面（App Router）
│   │   │   ├── layout.tsx            #   根布局
│   │   │   ├── page.tsx              #   首页（学生卡片 + 加减分）
│   │   │   ├── globals.css           #   全局样式
│   │   │   ├── groups/page.tsx       #   小组管理 + PK
│   │   │   ├── ranking/page.tsx      #   排行榜
│   │   │   ├── timeline/page.tsx     #   积分时间线
│   │   │   ├── analysis/page.tsx     #   数据分析 + 图表
│   │   │   ├── shop/page.tsx         #   积分商城
│   │   │   ├── rules/page.tsx        #   积分规则管理
│   │   │   ├── pets/page.tsx         #   宠物乐园
│   │   │   ├── tools/page.tsx        #   工具箱（随机点名等）
│   │   │   └── settings/page.tsx     #   系统设置
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui 基础组件
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   └── sonner.tsx        #   Toast 通知
│   │   │   ├── features/             # 业务组件
│   │   │   │   ├── LoginPage.tsx     #   登录/注册页
│   │   │   │   ├── CreateClassGuide.tsx # 新教师创建班级引导
│   │   │   │   ├── DataLoader.tsx    #   数据加载器
│   │   │   │   ├── StudentCard.tsx   #   学生卡片
│   │   │   │   ├── StudentDetailModal.tsx # 学生详情弹窗
│   │   │   │   ├── ScoreModal.tsx    #   加减分弹窗
│   │   │   │   ├── EditRecordModal.tsx  # 编辑记录弹窗
│   │   │   │   ├── AddStudentModal.tsx  # 添加学生弹窗
│   │   │   │   ├── GroupCard.tsx     #   小组卡片
│   │   │   │   ├── StatsCard.tsx     #   统计卡片
│   │   │   │   ├── PetDisplay.tsx    #   宠物展示
│   │   │   │   └── index.ts         #   统一导出
│   │   │   └── layout/              # 布局组件
│   │   │       ├── AppLayout.tsx     #   应用布局（登录判断、班级引导）
│   │   │       ├── Header.tsx        #   顶部导航栏
│   │   │       ├── Sidebar.tsx       #   侧边栏（导航 + 班级切换）
│   │   │       └── index.ts
│   │   ├── lib/
│   │   │   ├── api.ts               # API 客户端（所有后端接口封装）
│   │   │   └── utils.ts             # 工具函数（cn、头像颜色等）
│   │   ├── store/                    # Zustand 状态管理
│   │   │   ├── index.ts             #   统一导出
│   │   │   ├── useAuthStore.ts      #   认证、班级列表、当前班级
│   │   │   ├── useStudentStore.ts   #   学生数据
│   │   │   ├── useGroupStore.ts     #   小组数据
│   │   │   ├── useRuleStore.ts      #   规则数据
│   │   │   ├── useRecordStore.ts    #   积分记录数据
│   │   │   ├── useProductStore.ts   #   商品 + 兑换数据
│   │   │   ├── useSettingsStore.ts  #   设置 + 点名记录
│   │   │   └── usePetStore.ts       #   宠物数据
│   │   └── types/
│   │       └── index.ts             # TypeScript 类型定义
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml                # 开发环境 Docker Compose
├── docker-compose.prod.yml           # 生产环境 Docker Compose
├── .gitignore
└── readme.md
```

---

## 4. API 路由

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/register` | 教师注册 |
| POST | `/api/login` | 登录（教师/学生） |

### 需要登录（教师 + 学生均可访问）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/change-password` | 修改密码 |
| GET | `/api/classes/:id` | 获取班级详情 |
| GET | `/api/classes/:id/students` | 学生列表 |
| GET | `/api/classes/:id/groups` | 小组列表 |
| GET | `/api/classes/:id/rules` | 规则列表 |
| GET | `/api/classes/:id/records` | 积分记录列表 |
| GET | `/api/classes/:id/products` | 商品列表 |
| GET | `/api/classes/:id/exchanges` | 兑换记录 |
| GET | `/api/classes/:id/pet-species` | 宠物物种列表 |
| GET | `/api/classes/:id/student-pets` | 学生宠物列表 |
| GET | `/api/classes/:id/pet-config` | 宠物配置 |
| GET | `/api/classes/:id/settings` | 班级设置 |
| GET | `/api/classes/:id/roll-calls` | 点名记录 |
| GET | `/api/student/profile` | 学生个人信息 |

### 仅教师可访问

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/classes` | 我的班级列表 |
| POST | `/api/classes` | 创建班级 |
| PUT | `/api/classes/:id` | 编辑班级 |
| DELETE | `/api/classes/:id` | 删除班级（级联删除所有关联数据） |
| POST | `/api/classes/:id/students` | 添加学生 |
| PUT | `/api/students/:id` | 编辑学生 |
| DELETE | `/api/students/:id` | 删除学生 |
| POST | `/api/students/:id/reset-password` | 重置学生密码 |
| POST | `/api/classes/:id/groups` | 创建小组 |
| PUT | `/api/groups/:id` | 编辑小组 |
| DELETE | `/api/groups/:id` | 删除小组 |
| POST | `/api/classes/:id/rules` | 创建规则 |
| PUT | `/api/rules/:id` | 编辑规则 |
| DELETE | `/api/rules/:id` | 删除规则 |
| POST | `/api/classes/:id/records` | 创建积分记录 |
| PUT | `/api/records/:id` | 编辑积分记录 |
| DELETE | `/api/records/:id` | 删除积分记录 |
| POST | `/api/classes/:id/products` | 创建商品 |
| PUT | `/api/products/:id` | 编辑商品 |
| DELETE | `/api/products/:id` | 删除商品 |
| POST | `/api/classes/:id/exchanges` | 创建兑换 |
| POST | `/api/classes/:id/pet-species` | 创建宠物物种 |
| PUT | `/api/pet-species/:id` | 编辑宠物物种 |
| DELETE | `/api/pet-species/:id` | 删除宠物物种 |
| POST | `/api/classes/:id/student-pets` | 分配宠物 |
| DELETE | `/api/student-pets/:studentId` | 移除学生宠物 |
| PUT | `/api/classes/:id/pet-config` | 更新宠物配置 |
| PUT | `/api/classes/:id/settings` | 更新班级设置 |
| POST | `/api/classes/:id/roll-calls` | 创建点名记录 |
| GET | `/api/migrate/check` | 检查是否有旧版数据 |
| POST | `/api/migrate/legacy` | 迁移服务器上的旧版数据 |
| POST | `/api/migrate/import` | 从上传的 JSON 文件迁移 |

---

## 5. 数据库设计

SQLite 数据库文件：`backend/data/users.db`

### 5.1 ER 关系图

```
users ─────────────┐
  │                │
  │ teacher_id     │ user_id
  ▼                ▼
classes          students
  │                │  │
  │ class_id       │  │ student_id
  ├───▶ groups     │  ├───▶ score_records
  ├───▶ rules      │  ├───▶ exchanges
  ├───▶ products   │  └───▶ student_pets
  ├───▶ pet_species ──▶ pet_stages
  ├───▶ pet_config
  ├───▶ class_settings
  └───▶ roll_call_records
```

### 5.2 表结构详细说明

#### `users` — 用户表

存储所有用户（教师和学生）的登录凭证。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 用户 ID |
| username | TEXT | UNIQUE, NOT NULL | 用户名（教师自定义，学生为姓名） |
| password_hash | TEXT | NOT NULL | bcrypt 加密的密码哈希 |
| role | TEXT | NOT NULL, DEFAULT 'teacher' | 角色：`teacher` / `student` |
| created_at | DATETIME | DEFAULT NOW | 创建时间 |
| updated_at | DATETIME | DEFAULT NOW | 更新时间 |

索引：`idx_users_username` (username)

---

#### `classes` — 班级表

每个班级由一个教师拥有，是所有业务数据的顶级容器。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 班级 ID |
| name | TEXT | NOT NULL | 班级名称 |
| teacher_name | TEXT | NOT NULL, DEFAULT '' | 班主任姓名（展示用） |
| teacher_id | INTEGER | FK → users(id), NOT NULL | 所属教师 |
| created_at | DATETIME | DEFAULT NOW | 创建时间 |

索引：`idx_classes_teacher` (teacher_id)

---

#### `students` — 学生表

班级中的学生，可关联用户账号（用于学生登录）。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 学生 ID |
| name | TEXT | NOT NULL | 姓名 |
| avatar | INTEGER | DEFAULT 1 | 头像编号 (1-8) |
| class_id | INTEGER | FK → classes(id) ON DELETE CASCADE | 所属班级 |
| group_id | INTEGER | FK → groups(id) ON DELETE SET NULL | 所属小组（可空） |
| user_id | INTEGER | FK → users(id) | 关联用户账号（可空） |
| total_score | INTEGER | DEFAULT 0 | 当前总积分 |
| created_at | DATETIME | DEFAULT NOW | 创建时间 |

索引：`idx_students_class` (class_id), `idx_students_user` (user_id)

**级联行为**：删除班级时自动删除该班级所有学生。删除小组时学生的 group_id 置空。

---

#### `groups` — 小组表

班级内的学生小组，用于分组管理和 PK。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 小组 ID |
| name | TEXT | NOT NULL | 小组名称 |
| color | INTEGER | DEFAULT 1 | 颜色编号 (1-8) |
| leader_id | INTEGER | | 组长的学生 ID |
| class_id | INTEGER | FK → classes(id) ON DELETE CASCADE | 所属班级 |
| created_at | DATETIME | DEFAULT NOW | 创建时间 |

索引：`idx_groups_class` (class_id)

---

#### `rules` — 积分规则表

预定义的加分/扣分规则，教师可自定义。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 规则 ID |
| name | TEXT | NOT NULL | 规则名称（如"作业完成"） |
| score | INTEGER | NOT NULL | 分值（正数） |
| type | TEXT | NOT NULL | 类型：`add`（加分）/ `minus`（扣分） |
| category | TEXT | DEFAULT '其他' | 分类 |
| icon | TEXT | DEFAULT '📌' | 图标 emoji |
| class_id | INTEGER | FK → classes(id) ON DELETE CASCADE | 所属班级 |

索引：`idx_rules_class` (class_id)

---

#### `score_records` — 积分记录表

每条记录是一次加分或扣分操作。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 记录 ID |
| student_id | INTEGER | FK → students(id) ON DELETE CASCADE | 关联学生 |
| group_id | INTEGER | FK → groups(id) ON DELETE SET NULL | 关联小组（可空） |
| rule_id | INTEGER | FK → rules(id) ON DELETE SET NULL | 关联规则（可空） |
| score | INTEGER | NOT NULL | 实际分值（正数加分，负数扣分） |
| reason | TEXT | DEFAULT '' | 备注 |
| created_at | DATETIME | DEFAULT NOW | 操作时间 |

索引：`idx_records_student` (student_id), `idx_records_created` (created_at)

**说明**：`score` 字段存储有符号值，加分为正、扣分为负。`student.total_score` 在每次增删记录时同步更新。

---

#### `products` — 商品表

积分商城中可兑换的商品。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 商品 ID |
| name | TEXT | NOT NULL | 商品名称 |
| price | INTEGER | NOT NULL | 兑换所需积分 |
| stock | INTEGER | DEFAULT 10 | 库存数量 |
| icon | TEXT | DEFAULT '🎁' | 图标 emoji |
| exchange_count | INTEGER | DEFAULT 0 | 已兑换次数 |
| class_id | INTEGER | FK → classes(id) ON DELETE CASCADE | 所属班级 |

索引：`idx_products_class` (class_id)

---

#### `exchanges` — 兑换记录表

学生兑换商品的历史记录。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 记录 ID |
| student_id | INTEGER | FK → students(id) ON DELETE CASCADE | 兑换学生 |
| product_id | INTEGER | FK → products(id) ON DELETE CASCADE | 兑换商品 |
| product_name | TEXT | NOT NULL | 商品名称（冗余，防止商品删除后丢失） |
| price | INTEGER | NOT NULL | 兑换时的价格 |
| created_at | DATETIME | DEFAULT NOW | 兑换时间 |

索引：`idx_exchanges_student` (student_id)

---

#### `pet_species` — 宠物物种表

班级中可选的宠物种类。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 物种 ID |
| name | TEXT | NOT NULL | 物种名称（如"火龙"） |
| element | TEXT | NOT NULL | 元素属性（如 fire, water, earth） |
| color | TEXT | | 主题色 |
| class_id | INTEGER | FK → classes(id) ON DELETE CASCADE | 所属班级 |

索引：`idx_pet_species_class` (class_id)

---

#### `pet_stages` — 宠物进化阶段表

定义宠物在不同积分阈值下的进化形态。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 阶段 ID |
| species_id | INTEGER | FK → pet_species(id) ON DELETE CASCADE | 所属物种 |
| level | INTEGER | NOT NULL | 等级编号 |
| name | TEXT | NOT NULL | 阶段名称（如"幼龙"） |
| emoji | TEXT | NOT NULL | 展示 emoji |
| image | TEXT | | 自定义图片 URL |
| min_score | INTEGER | NOT NULL | 进化所需最低积分 |
| description | TEXT | DEFAULT '' | 描述 |

索引：`idx_pet_stages_species` (species_id)

---

#### `student_pets` — 学生宠物关联表

每个学生最多拥有一只宠物。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 关联 ID |
| student_id | INTEGER | UNIQUE, FK → students(id) ON DELETE CASCADE | 学生（一对一） |
| species_id | INTEGER | FK → pet_species(id) ON DELETE CASCADE | 宠物物种 |
| nickname | TEXT | DEFAULT '我的宠物' | 宠物昵称 |
| assigned_at | DATETIME | DEFAULT NOW | 分配时间 |

---

#### `pet_config` — 宠物功能配置表

班级级别的宠物功能开关。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 配置 ID |
| class_id | INTEGER | UNIQUE, FK → classes(id) ON DELETE CASCADE | 所属班级（一对一） |
| enabled | INTEGER | DEFAULT 1 | 是否启用宠物功能 |
| show_on_student_card | INTEGER | DEFAULT 1 | 是否在学生卡片上显示宠物 |

---

#### `class_settings` — 班级设置表

班级的个性化配置。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 设置 ID |
| class_id | INTEGER | UNIQUE, FK → classes(id) ON DELETE CASCADE | 所属班级（一对一） |
| theme | TEXT | DEFAULT 'light' | 主题 |
| animation_speed | TEXT | DEFAULT 'normal' | 动画速度 |
| sound_enabled | INTEGER | DEFAULT 1 | 是否启用音效 |

---

#### `roll_call_records` — 点名记录表

工具箱中随机点名的历史记录。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 记录 ID |
| class_id | INTEGER | FK → classes(id) ON DELETE CASCADE | 所属班级 |
| student_names | TEXT | NOT NULL | 被点到的学生姓名（JSON 数组） |
| created_at | DATETIME | DEFAULT NOW | 点名时间 |

---

#### `schema_version` — 数据库版本表

追踪数据库迁移版本，用于增量升级。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| version | INTEGER | PK | 版本号 |
| applied_at | DATETIME | DEFAULT NOW | 应用时间 |

---

## 6. 级联删除关系

删除班级时，以下数据会自动级联删除：

```
删除 class
  ├── CASCADE → students → score_records, exchanges, student_pets
  ├── CASCADE → groups
  ├── CASCADE → rules
  ├── CASCADE → products
  ├── CASCADE → pet_species → pet_stages
  ├── CASCADE → pet_config
  ├── CASCADE → class_settings
  └── CASCADE → roll_call_records

  + 代码逻辑额外清理：
    └── 关联的学生 users 账号（仅 role='student' 且无其他班级引用）
```

---

## 7. 开发与部署

### 本地开发

```bash
# 后端
cd backend
go build -o classScore-backend .
./classScore-backend
# 监听 :8000

# 前端
cd frontend
npm install
npm run dev
# 监听 :3000
```

### Docker 部署

```bash
# 开发环境
docker-compose up -d

# 生产环境
docker-compose -f docker-compose.prod.yml up -d
```

### 配置说明 (`backend/config.yaml`)

```yaml
server:
  port: 8000                    # 后端端口
  allowed_origins:              # CORS 允许的前端地址
    - "http://localhost:3000"

storage:
  data_dir: "./data"            # 数据目录
  db_file: "users.db"           # SQLite 文件名
  userdata_dir: "userdata"      # 旧版数据目录（迁移用）

jwt:
  secret: "your-secret-key"     # JWT 密钥（生产环境请修改）
  expire_hours: 24              # Token 有效期
```

### 数据迁移

系统支持从旧版 JSON 格式迁移数据：

- **服务器迁移**：后端自动检测 `data/userdata/` 目录下的 JSON 文件，教师首次登录时提示迁移
- **文件导入**：教师可上传 JSON 备份文件导入，每次导入会创建一个新班级
- **Excel 导入**：从 Excel 文件批量导入学生名单到已有班级（仅创建学生，不含积分数据）
