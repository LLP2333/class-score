# 班级积分管理系统

> 班级管理系统 · 让教学更轻松 | 智能化数据管理 · 可视化成长分析

## 技术架构

- **前端**：Next.js + React + TypeScript + Tailwind CSS + Zustand（API 驱动）
- **后端**：Go + Gin + SQLite（全部业务数据存储于数据库）
- **认证**：JWT + 角色鉴权（teacher / student）
- **多班级**：一个老师可管理多个班级，学生只读访问所属班级数据
- **学生登录**：老师创建学生账号，学生可登录查看数据（不可修改）
- **Android 打包**：Capacitor + Next.js 静态导出，可生成 Android APK

## 核心要求

- 数据可视化
- 智能点名
- 一键导出
- 支持打包为 Android APK，便于老师在手机或平板上安装使用

## 9大核心功能模块

### 1. 首页概览

快速查看班级整体情况，学生卡片展示、积分统计、快速加减分操作，核心数据一目了然

- 学生卡片（含宠物迷你展示）
- 快速操作
- 数据概览

### 2. 小组管理

创建和管理学习小组，设置小组积分规则，支持小组PK、团队协作评分，培养集体荣誉感

- 小组创建
- 团队评分
- 小组PK

### 3. 排行榜

多维度排名展示，支持个人总分、小组总分、单项排名，实时更新，激发学生学习动力

- 个人榜
- 小组榜
- 实时更新

### 4. 数据分析

可视化图表展示，积分趋势分析、班级统计数据，支持Excel导出，数据洞察一目了然

- 趋势分析
- 统计报表
- 数据导出

### 5. 积分商城

自定义商品和价格，学生用积分兑换奖品，支持兑换记录查询、库存管理，激励更有效

- 自定义商品
- 积分兑换
- 库存管理

### 6. 积分规则

设置加分扣分规则，支持自定义维度（学习、纪律、劳动等），灵活配置分值，规则透明

- 自定义规则
- 多维度评分
- 规则管理

### 7. 宠物乐园

积分驱动的宠物养成系统，学生积分越高宠物进化形态越强，增加趣味性和持续激励

- 6种预设宠物（炎龙、水灵、草精灵、雷兽、冰凰、远古龙），涵盖火/水/草/电/冰/龙六大属性
- 多阶段进化：每种宠物从蛋开始，随积分提升逐步进化（默认5阶，可自定义）
- 丰富动画：蛋摇晃、低阶弹跳、高阶悬浮 + 光环、满级粒子特效
- 自定义图鉴：支持新建/编辑/删除宠物种类，自定义阶段数量、名称、分数阈值、描述
- 自定义图片：每个阶段支持上传自定义图片替代默认 emoji
- 图鉴导入导出：导出为 JSON 文件，可跨班级分享和导入
- 一键恢复默认：快速恢复预设图鉴
- 学生卡片集成：首页学生卡片右下角展示宠物迷你图标
- 学生详情集成：详情弹窗展示宠物信息和进化进度条
- 数据持久化：宠物配置和学生宠物分配均存储在数据库中

### 8. 工具箱

随机点名、批量操作等实用工具，让课堂管理更有趣，学生参与度提升

- 随机点名：支持单人/多人点名、动画效果、历史记录、可设置点名概率权重
- 批量操作：批量加减分、一次选择多个学生

### 9. 系统设置

班级信息管理、学生账号管理、数据导入导出、多班级切换，支持Excel批量导入学生名单

- 数据导入导出
- 学生账号管理（查看、重置密码）
- 多班级切换与创建

## 四大使用场景

### 日常课堂管理

- **上课点名互动**：随机点名让每个学生都有机会参与，课堂氛围更活跃，学生注意力更集中
- **即时加减积分**：课堂表现好立即加分，违反纪律立即扣分，反馈及时，激励效果明显
- **小组PK竞赛**：小组间积分竞争，培养团队协作精神，集体荣誉感油然而生

### 家长会展示

- **数据可视化展示**：趋势图直观展示学生成长轨迹，家长一眼看懂孩子进步情况
- **个人学生卡片**：展示学生个人积分、排名、各维度表现，家长会上更专业
- **班级整体分析**：班级平均分、最高分、排名分布等数据，展现班级管理成果

### 激励兑换活动

- **积分商城兑换**：学生用积分兑换心仪奖品，让努力看得见摸得着，学习动力倍增
- **阶段性奖励**：达到积分目标发放奖励，持续激励学生保持良好表现
- **宠物进化激励**：积分达到阈值后宠物自动进化，学生为了看到新形态而主动努力

### 期末工作总结

- **一键导出报表**：Excel完整数据，包含所有学生积分、排名、加减分记录
- **学期数据分析**：查看整学期的数据趋势，总结班级管理的亮点和改进方向
- **个性化评语**：基于数据为每个学生写评语，有理有据，更加客观准确

## 积分规则示例

| 行为 | 分值 | 类型 |
|------|------|------|
| 课堂回答问题 | +5分 | 加分 |
| 作业优秀 | +3分 | 加分 |
| 帮助同学 | +2分 | 加分 |
| 迟到早退 | -3分 | 扣分 |
| 作业未交 | -5分 | 扣分 |

## 积分商城示例

| 商品 | 积分 |
|------|------|
| 笔记本 | 30积分 |
| 彩色笔 | 40积分 |
| 文具套装 | 50积分 |
| 免作业卡 | 100积分 |

## 数据分析看板

- **统计卡片**：班级人数、最高积分、平均积分、小组数量
- **趋势图表**：班级积分趋势折线图（按周展示）
- **排行榜**：实时积分排行榜
- **导出功能**：一键导出Excel报表


## 宠物系统

积分驱动的宠物养成系统，类似宝可梦/洛克王国风格。每个学生可以拥有一只宠物，宠物的进化形态与学生积分直接关联。

### 预设宠物种类

| 宠物 | 属性 | 进化链 |
|------|------|--------|
| 炎龙 | 🔥 火 | 🥚 → 🔥 → 🦎 → 🐉 → 🌋 |
| 水灵 | 💧 水 | 🥚 → 💧 → 🐬 → 🐋 → 🌊 |
| 草精灵 | 🌿 草 | 🥚 → 🌱 → 🌸 → 🌳 → 🌍 |
| 雷兽 | ⚡ 电 | 🥚 → ⚡ → 🐱 → 🐯 → 🌩️ |
| 冰凰 | ❄️ 冰 | 🥚 → ❄️ → 🐦 → 🦅 → ✨ |
| 远古龙 | 🐲 龙 | 🥚 → 🐣 → 🦕 → 🐲 → 🌟 |

### 默认进化阈值

| 阶段 | 所需积分 |
|------|----------|
| 蛋（初始） | 0分 |
| 第一形态 | 20分 |
| 第二形态 | 50分 |
| 第三形态 | 100分 |
| 最终形态 | 200分 |

> 阶段数量和每阶段的积分阈值均可在宠物编辑器中自定义，每个宠物种类可以独立设置。

### 自定义功能

- **新建宠物种类**：自定义名称、属性（火/水/草/电/冰/龙/自定义）、任意数量的进化阶段
- **自定义阶段**：每个阶段可设置名称、emoji、自定义图片（上传后以 base64 存储）、积分阈值、描述
- **导入导出图鉴**：将宠物种类配置导出为 JSON 文件，支持跨班级分享和导入
- **一键恢复默认**：快速恢复预设的 6 种宠物图鉴

### 动画效果

| 阶段 | 动画 |
|------|------|
| 蛋 | 左右摇晃，像是即将孵化 |
| 低阶形态 | 轻微弹跳 |
| 高阶形态 | 悬浮 + 光环效果 |
| 最终形态 | 悬浮 + 光环 + 粒子环绕 |

## 后端 API

系统采用数据库驱动架构，所有数据持久化在 SQLite 数据库中，前端通过 RESTful API 与后端交互。

### 认证

| 端点 | 方法 | 角色 | 说明 |
|------|------|------|------|
| `/api/health` | GET | 公开 | 健康检查 |
| `/api/register` | POST | 公开 | 老师注册 |
| `/api/login` | POST | 公开 | 统一登录（返回 role、班级列表） |
| `/api/change-password` | POST | 登录用户 | 修改自己密码 |

### 班级管理

| 端点 | 方法 | 角色 | 说明 |
|------|------|------|------|
| `/api/classes` | GET | teacher | 获取老师的所有班级 |
| `/api/classes` | POST | teacher | 创建班级 |
| `/api/classes/:id` | GET | 登录用户 | 获取班级详情 |
| `/api/classes/:id` | PUT | teacher | 更新班级 |
| `/api/classes/:id` | DELETE | teacher | 删除班级 |

### 业务数据（均按班级隔离）

以下资源挂在 `/api/classes/:id/` 下，GET 请求 teacher/student 均可访问，POST/PUT/DELETE 仅 teacher：

- **students** — 学生（创建时自动生成登录账号）
- **groups** — 小组
- **rules** — 积分规则
- **records** — 积分记录
- **products** — 积分商品
- **exchanges** — 兑换记录
- **pet-species** — 宠物种类
- **student-pets** — 学生宠物
- **pet-config** — 宠物配置
- **settings** — 班级设置
- **roll-calls** — 点名记录

### 学生专属

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/student/profile` | GET | 获取个人信息和所属班级 |
| `/api/students/:id/reset-password` | POST | 老师重置学生密码 |

### 数据迁移

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/migrate/check` | GET | 检测是否有历史 JSON 数据 |
| `/api/migrate/legacy` | POST | 自动导入历史数据到数据库 |
| `/api/migrate/import` | POST | 上传 JSON 文件导入 |

## 部署指南

### 本地开发（Docker Compose）

```bash
# 创建网络
docker network create qvqw

# 构建并启动
docker compose up -d
```

默认前端地址 `http://localhost:3000`，后端地址 `http://localhost:8000`。

### Android APK 打包

项目可以打包为 Android APK。当前实现采用 **Capacitor 容器 + Next.js 静态导出**：APK 内置前端页面资源，业务数据仍通过后端 API 读写。因此 Android 正式包需要配置一个手机可访问的后端地址，生产环境建议使用 HTTPS 域名。

#### 打包前置条件

- 安装 Node.js、npm
- 安装 Android Studio、Android SDK 和 JDK
- 后端服务已部署，并可被 Android 设备访问
- 不要在真机正式包中使用 `localhost` 作为 API 地址；真机上的 `localhost` 指向手机本身

#### 首次生成 Android 工程

> 将 `https://api-score.qvqw.date` 替换为实际后端 API 地址。

```bash
cd frontend
npm install

NEXT_PUBLIC_API_URL="https://api-score.qvqw.date" npm run android:add
```

首次执行后会生成 `frontend/android/` 原生工程。后续修改前端代码后，不需要重复 `android:add`，只需要同步资源：

```bash
cd frontend
NEXT_PUBLIC_API_URL="https://api-score.qvqw.date" npm run android:sync
```

#### 构建 APK

方式一：使用 Android Studio 打包

```bash
cd frontend
npm run android:open
```

在 Android Studio 中选择 `Build > Build Bundle(s) / APK(s) > Build APK(s)`。

方式二：命令行构建 Debug APK

```bash
cd frontend
NEXT_PUBLIC_API_URL="https://api-score.qvqw.date" npm run android:apk
```

构建产物通常位于 `frontend/android/app/build/outputs/apk/debug/app-debug.apk`。

#### Android 打包注意事项

- APK 只内置前端，不内置 Go 后端和 SQLite 数据库服务
- `NEXT_PUBLIC_API_URL` 会在构建时写入前端代码，必须填写 Android 设备可访问的后端地址
- 如果只在模拟器连接本机后端，可将 API 地址设置为 `http://10.0.2.2:8000`
- 后端 `allowed_origins` 需要允许 Capacitor WebView 来源；本项目 Android 包使用 `http://localhost`
- 正式发布前建议生成签名 Release APK，并确认 HTTPS 证书、CORS 和后端域名均可被手机访问

### 跨架构构建（M 芯片 Mac → x86 服务器）

适用于在 Apple Silicon Mac 上构建，部署到 x86_64 Linux 服务器的场景。

**1. 创建多平台 builder**

```bash
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap
```

**2. 登录 DockerHub**

```bash
docker login
```

**3. 构建并推送镜像**

> 将 `llp2333` 替换为你的 DockerHub 用户名，`https://api-score.qvqw.date` 替换为服务端实际地址。

```bash
# 构建并推送 backend
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t llp2333/classscore-backend:latest \
  --push \
  ./backend

# 构建并推送 frontend
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg NEXT_PUBLIC_API_URL="https://api-score.qvqw.date" \
  -t llp2333/classscore-frontend:latest \
  --push \
  ./frontend
```

> `NEXT_PUBLIC_API_URL` 会在构建时写入前端代码，必须填写服务器的实际访问地址。

**4. 在服务器上部署**

服务器上无需源码，只需 `docker-compose.prod.yml` 和 `config.yaml`：

```bash
# 创建网络
docker network create qvqw

# 拉取镜像并启动
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### 注意事项

- 跨架构构建通过 QEMU 模拟，速度会比原生构建慢
- 默认构建 `linux/amd64` 和 `linux/arm64` 双架构镜像，可在 x86 和 ARM 服务器上运行
- 后端数据通过 Docker Volume `backend-data` 持久化，升级镜像不会丢失数据

