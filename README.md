# 考研交流问卷系统

一个面向计算机类考研学生的答题交流平台，支持题目展示、用户答题、图片上传、广告投放和数据管理等功能。

## 功能特性

### 🎯 核心功能
- **题目管理**: 创建、编辑、删除题目，支持上传题目图片
- **答题系统**: 用户可以对题目进行文字回答和图片上传（最多2张）
- **用户追踪**: 自动生成用户标识符，记录答题历史
- **微信号收集**: 可选填写微信号，便于建立交流群

### 📢 广告功能
- **广告展示**: 用户访问时先看5秒广告，自动跳转
- **广告管理**: 创建、编辑、删除广告，设置启用状态（互斥）
- **数据统计**: 记录用户与广告的交互行为（查看、点击、跳过）
- **数据导出**: 支持CSV格式导出详细统计信息

### 👥 用户界面
- **题目列表**: 响应式设计，支持移动端
- **答题页面**: 支持文字输入和图片上传
- **个人中心**: 查看个人答题记录和统计数据
- **管理后台**: 题目管理和广告管理界面

### 🔐 开发者功能
- **数据导出**: 导出所有用户答题数据
- **广告管理**: 广告投放和统计分析
- **身份验证**: 开发者登录（24小时会话有效期）

## 技术栈

- **前端**: Next.js 16 + React 19 + Tailwind CSS 4
- **后端**: Supabase (PostgreSQL + Storage)
- **部署**: EdgeOne Pages (腾讯云)
- **开发工具**: TypeScript 5 + ESLint 9

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- Supabase 账号

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd survey-app
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   复制环境变量模板并填写实际值：
   ```bash
   cp .env.example .env.local
   ```
   
   在 `.env.local` 中配置：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **初始化数据库**
   - 登录 Supabase 控制台
   - 在 SQL Editor 中执行 `fix_ad_tables.sql` 脚本
   - 确认存储桶 `survey-images` 存在并设置为公开访问

5. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   访问 http://localhost:3000 查看网站

## 项目结构

```
survey-app/
├── app/                      # Next.js 应用核心目录
│   ├── admin/                # 管理员功能
│   │   ├── ads/             # 广告管理
│   │   ├── data/            # 数据导出
│   │   └── page.js          # 题目管理
│   ├── questions/           # 题目答题模块
│   │   ├── page.js          # 题目列表
│   │   └── [id]/            # 动态题目详情
│   ├── ads/                 # 广告展示页面
│   ├── login/               # 开发者登录
│   ├── my-data/             # 个人数据
│   ├── lib/                 # 核心工具库
│   │   └── supabase.js      # Supabase客户端配置
│   ├── middleware.js        # 访问时间限制
│   ├── page.tsx             # 首页（跳转广告）
│   └── layout.tsx           # 全局布局
├── public/                   # 静态资源
├── fix_ad_tables.sql        # 数据库数据库初始化脚本
├── .env.example             # 环境变量模板
├── .edgeone-pages.yml       # EdgeOne部署配置
└── package.json             # 项目依赖
```

## 路由说明

| 路由 | 功能 | 权限 |
|------|------|------|
| `/` | 首页（跳转广告） | 公开 |
| `/ads` | 广告展示页面 | 公开 |
| `/questions` | 题目列表 | 公开 |
| `/questions/[id]` | 具体题目答题 | 公开 |
| `/my-data` | 个人答题记录 | 公开 |
| `/admin` | 题目管理 | 公开 |
| `/admin/ads` | 广告管理 | 公开 |
| `/admin/data` | 数据导出 | 需登录 |
| `/login` | 开发者登录 | 公开 |

## 部署

### 部署到 EdgeOne Pages

1. **连接 GitHub 仓库**
   - 登录腾讯云控制台
   - 进入 EdgeOne Pages
   - 连接您的 GitHub 仓库

2. **配置环境变量**
   - 在项目设置中添加：
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **自动部署**
   - 推送代码到 `main` 分支后自动触发部署
   - 部署完成后获得访问地址

### 本地构建测试
```bash
npm run build
npm start
```

## 开发者账号

- **邮箱**: `15853964861@163.com`
- **密码**: `jiangkexin1001`
- **会话有效期**: 24小时

## 数据库表结构

### 主要数据表
- `questions` - 题目信息
- `answers` - 用户回答
- `answer_images` - 回答图片
- `ads` - 广告信息
- `ad_analytics` - 广告统计数据

## 常见问题

### 图片上传失败
- 确认 Supabase 存储桶 `survey-images` 已创建
- 检查存储桶权限设置为公开访问
- 验证环境变量配置正确

### 广告不显示
- 确认数据库中至少有一个启用的广告
- 检查广告的 `is_active` 字段为 `true`
- 验证广告管理功能正常工作

### 数据导出失败
- 确保已使用开发者账号登录
- 检查登录会话是否过期（24小时有效期）

## 许可证

MIT License

## 技术支持

如有问题，请联系项目维护者。
