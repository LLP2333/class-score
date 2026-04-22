# 班级管理系统后端

Go + SQLite 后端，提供完整的 RESTful API，所有业务数据持久化在数据库中。

## 设计理念

- **数据库驱动**：所有业务数据（学生、小组、积分记录、商品等）存储在 SQLite 数据库
- **角色鉴权**：支持 teacher（老师）和 student（学生）两种角色，JWT 认证
- **多班级支持**：一个老师可管理多个班级，学生只读访问所属班级
- **历史数据迁移**：支持将旧版 JSON 文件数据自动导入到新数据库

## 使用流程

1. 老师注册账号并登录
2. 创建班级，添加学生（系统自动为学生创建登录账号）
3. 设置积分规则，管理小组，进行日常加减分操作
4. 学生使用姓名 + 密码登录，只读查看班级数据

## 技术实现

- Go + Gin 框架
- SQLite 数据库（14 张业务表 + schema 版本迁移）
- JWT 认证 + 角色中间件
- 后端配置从 config.yaml 读取

## 数据库表

| 表名 | 说明 |
|------|------|
| users | 用户（含 role 字段） |
| classes | 班级 |
| students | 学生（关联 user 账号） |
| groups | 小组 |
| rules | 积分规则 |
| score_records | 积分记录 |
| products | 积分商品 |
| exchanges | 兑换记录 |
| roll_call_records | 点名记录 |
| class_settings | 班级设置 |
| pet_species | 宠物种类 |
| pet_stages | 宠物进化阶段 |
| student_pets | 学生宠物 |
| pet_config | 宠物配置 |
| schema_version | 数据库迁移版本 |

## 目录结构

```
backend/
├── main.go              # 入口文件 + 路由注册
├── config.yaml          # 配置文件
├── go.mod               # Go 模块
├── internal/
│   ├── config/          # 配置加载
│   ├── handler/         # HTTP 处理器
│   │   ├── handler.go   # 基础 handler + 中间件
│   │   ├── auth.go      # 认证（注册/登录）
│   │   ├── class.go     # 班级 CRUD
│   │   ├── student.go   # 学生 CRUD
│   │   ├── group.go     # 小组 CRUD
│   │   ├── rule.go      # 规则 CRUD
│   │   ├── record.go    # 积分记录 CRUD
│   │   ├── product.go   # 商品 + 兑换
│   │   ├── pet.go       # 宠物系统
│   │   ├── settings.go  # 设置 + 点名
│   │   └── migrate.go   # 数据迁移
│   ├── model/           # 数据模型
│   └── store/           # 数据库操作层
│       ├── sqlite.go    # 数据库连接 + Schema 迁移
│       ├── *_store.go   # 各业务表 CRUD
│       └── migrate_store.go # 历史数据迁移
├── data/                # 运行时数据目录（自动创建）
│   └── users.db         # SQLite 数据库
└── readmd.md
```

## 使用方法

### 编译

```bash
cd backend
go build -o classScore-backend .
```

### 运行

```bash
./classScore-backend
```

服务将在 http://127.0.0.1:8000 启动

### 配置

编辑 `config.yaml` 可修改端口、JWT 密钥等配置。
