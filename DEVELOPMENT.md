# 金快查 LOF基金折溢价监控系统 - 项目开发日志

<div align="center">

**版本**: 2.1.0 | **更新日期**: 2026-05-06

![部署状态](https://img.shields.io/badge/前端-CF%20Pages%20Online-green)
![部署状态](https://img.shields.io/badge/后端-Railway%20Online-green)

</div>

---

## 📌 快速参考

| 项目 | 地址 |
|------|------|
| **前端（生产）** | https://lof-fund-monitor.pages.dev |
| **后端（生产）** | https://lof-premium-tracker-production.up.railway.app |
| **前端（预览）** | https://{subdomain}.lof-fund-monitor.pages.dev |
| **GitHub仓库** | https://github.com/woredasdnmv/lof-premium-tracker |
| **Railway项目** | empowering-wonder / 服务: lof-premium-tracker |

---

## 📂 目录结构

```
lof-premium-tracker/                    # GitHub仓库根目录（当前开发基于此目录）
├── index.html                   # PC端主页面
├── css/
│   └── style.css              # 所有样式
├── js/
│   ├── config.js            # 环境配置
│   ├── api.js             # API服务层
│   └── app.js             # 主应用逻辑（LofFundMonitor类）
├── functions/               # Cloudflare Pages Functions
│   ├── api/[path].js      # API代理（转发/api/*到Railway）
│   └── health.js           # 健康检查代理
├── backend/                # 后端代码（Flask）
│   ├── app.py
│   ├── config.py
│   ├── data_fetcher.py
│   ├── history_db.py
│   └── ...
├── local/                  # 本地HTML版本（旧版备份）
├── miniprogram/            # 微信小程序（暂未修改）
└── .wrangler/            # CF Pages配置
```

---

## 🌐 部署架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                     用户浏览器                         │
│              https://lof-fund-monitor.pages.dev          │
└──────────────────────┬──────────────────────────────────┘
                       │ ① 同源请求（无跨域）
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Cloudflare Pages (静态文件 + Functions)                   │
│  ┌──────────────────┐    ┌───────────────────────────────────────┐  │
│  │  静态文件      │    │  Functions API代理                    │  │
│  │  index.html   │───▶│  /api/* → Railway /api/*              │  │
│  │  css/style  │    │  /health → Railway /health       │  │
│  └──────────────────┘    └───────────────────────────────────────┘  │
│                              │                              │
│                   ② CF节点转发  │                              │
│                              ▼                              │
│              https://lof-premium-tracker-production.up.railway.app  │
│                           (Railway美国节点)                        │
└──────────���──────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Railway (后端)                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Flask + Gunicorn                                        │    │
│  │  /health - 健康检查                                      │    │
│  │  /api/funds - 基金列表                                  │    │
│  │  /api/rankings - 排行数据                               │    │
│  │  数据源: 东方财富 + 天天基金网                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 关键设计决策
- **CF Pages代理**: 解决中国用户访问Railway美国节点被阻断的问题
- **缓存机制**: 后端启动时用历史数据初始化缓存，休市期间降级返回缓存数据

---

## 🚀 部署方法

### 前端部署（Cloudflare Pages）

#### 方法一：wrangler CLI（推荐，生产使用）
```bash
# 进入项目目录
cd lof-premium-tracker/

# 部署到生产环境
npx wrangler pages deploy . --project-name lof-fund-monitor --branch main --commit-dirty=true

# 部署后预览域名格式：https://{hash}.lof-fund-monitor.pages.dev
```

#### 方法二：GitHub 自动部署
```bash
# 推送代码到GitHub，CF Pages自动构建
git add .
git commit -m "feat: 更新内容描述"
git push origin main

# 注意：通过git push触发的CF构建可能不包含Functions，需用wrangler重新部署
```

#### 关键经验
- git push 触发的 CF Pages 构建**可能不生效 Functions**，必须用 wrangler 直接部署
- 部署时加上 `--commit-dirty=true` 包含未提交的本地修改

---

### 后端部署（Railway）

Railway 通过 GitHub 仓库自动部署：
- **仓库**: woredasdnmv/lof-premium-tracker
- **项目**: empowering-wonder
- **服务**: lof-premium-tracker
- **环境变量**: `FALLBACK_TO_CACHE_ON_START=true`

Railway 自动从 `backend/` 目录读取 `app.py` 启动。

#### 手动重启 Railway
```bash
# 通过 Railway CLI
railway up --service lof-premium-tracker

# 或在 Railway Dashboard 手动重启服务
```

#### 查看 Railway 日志
```bash
railway logs --service lof-premium-tracker
```

---

## 🛠️ 本地开发

### 环境要求
- Node.js 18+ (wrangler CLI)
- Python 3.11+ (后端本地开发)
- Windows PowerShell 5.x

### 开发工作流

#### 1. 克隆仓库
```bash
git clone https://github.com/woredasdnmv/lof-premium-tracker.git
cd lof-premium-tracker
```

#### 2. 前端开发
```bash
# 启动本地服务（Python http服务器）
py -m http.server 8080

# 访问 http://localhost:8080
# config.js 会自动检测并使用 localhost:5000 作为API
```

#### 3. 后端本地开发（可选）
```bash
# 安装依赖
pip install -r requirements.txt

# 启动后端
cd backend
flask run --port 5000
# 或
gunicorn app:app --bind 0.0.0.0:5000 --reload
```

---

## 📝 主要文件说明

### index.html
- 单页应用主结构
- 包含头部、侧边栏、主内容区、设置弹窗、基金详情弹窗
- 脚本加载顺序: `config.js` → `api.js` → `app.js`

### js/config.js
- 环境自动检测：`window.location.hostname`
- 本地开发: `localhost` → `http://localhost:5000`
- 生产环境: 使用 `window.location.origin`（CF Pages 同源代理）

### js/api.js
- `api.getHealth()` - 健康检查
- `api.getFunds(page, size)` - 基金列表
- `api.getRankings()` - 溢价/折价排行

### js/app.js - LofFundMonitor 类
```javascript
class LofFundMonitor {
    constructor() {
        // 从localStorage恢复设置
        this.threshold = parseFloat(localStorage.getItem('lof_threshold') || '0');
        this.avgThreshold = parseFloat(localStorage.getItem('lof_avgThreshold') || '0');
        this.minAmount = parseFloat(localStorage.getItem('lof_minAmount') || '0');
        this.commissionRate = parseFloat(localStorage.getItem('lof_commissionRate') || '1.5');
        this.commissionMin = parseFloat(localStorage.getItem('lof_commissionMin') || '5');
        this.maxCapital = parseFloat(localStorage.getItem('lof_maxCapital') || '1000');
        this.darkMode = localStorage.getItem('lof_darkMode') || 'light';
        this.displayMode = localStorage.getItem('lof_displayMode') || 'all';
        // ...
    }

    init() { /* 5次重试初始化 */ }
    loadFunds() { /* 获取并过滤基金 */ }
    calcEstimatedProfit(fund, overrideCapital) { /* 计算预期收益 */ }
    showFundDetail(code) { /* 基金详情弹窗 */ }
    // ...
}
```

### css/style.css
- CSS变量主题系统
- 响应式设计（移动端 < 769px）
- 深色模式支持

### functions/api/[path].js
- CF Pages Functions API代理
- 将 `/api/*` 转发到 Railway 后端

---

## 🔧 常用开发命令

### Git 操作
```bash
# 查看变更
git diff --stat

# 提交
git add .
git commit -m "feat: 更新描述"

# 推送
git push origin main
```

### CF Pages 操作
```bash
# 部署
npx wrangler pages deploy . --project-name lof-fund-monitor --branch main --commit-dirty=true

# 查看部署状态
npx wrangler pages project list

# 删除部署（谨慎）
npx wrangler pages deployment delete <deployment-id> --project-name lof-fund-monitor
```

### 本地测试
```bash
# 启动前端服务
py -m http.server 8080

# 启动后端
cd backend
gunicorn app:app --bind 0.0.0.0:5000 --reload
```

### API 测试
```bash
# 健康检查
curl https://lof-premium-tracker-production.up.railway.app/health

# 基金列表
curl "https://lof-premium-tracker-production.up.railway.app/api/funds?page=1&size=10"
```

---

## 📋 版本历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-06 | 2.1.0 | 推送最新代码到GitHub：基金详情弹窗、深色模式简化等12项UI改进 |
| 2026-05-05 | 2.0.0 | 新UI：元宝刷新按钮、顶栏居中放大、模式切换修复 |
| 2026-05-04 | 1.2.0 | 部署到CF Pages + Railway |

---

## 🔑 关键配置

### 后端API
- 健康检查: `/health` → `{data_ready, cache_count, last_update}`
- 基金列表: `/api/funds?page=1&size=600` → 基金数组
- 排行数据: `/api/rankings` → `{premium: [], discount: []}`

### 数据字段（基金）
```javascript
{
    code: "161039",      // 基金代码
    name: "易方达创业板ETF", // 名称
    price: 2.345,      // 场内价格
    nav: 2.298,       // 场外净值
    premium_rate: 2.05,  // 溢价率(%)
    avg_premium_3d: 1.89, // 三日均溢价
    volume: 45678900,   // 成交额(元)
    purchase_limit: 1000, // 申购限额
    is_suspended: false, // 是否停牌
    can_purchase: true, // 是否可申购
    nav_date: "2026-05-06" // 净值日期
}
```

### 用户设置（localStorage）
| 键名 | 默认值 | 说明 |
|------|-------|------|
| `lof_threshold` | 0 | 溢价率阈值(%) |
| `lof_avgThreshold` | 0 | 三日均溢阈值(%) |
| `lof_minAmount` | 0 | 最小成交额(元) |
| `lof_commissionRate` | 1.5 | 佣金(万) |
| `lof_commissionMin` | 5 | 最低佣金(元) |
| `lof_maxCapital` | 1000 | 最大投入(元) |
| `lof_darkMode` | light | 深色模式 |
| `lof_displayMode` | all | 显示模式 |

---

## ⚠️ 注意事项

1. **Windows环境**: 使用 `py` 命令而非 `python`
2. **PowerShell语法**: 用 `;` 而非 `&&` 连接命令
3. **文件编码**: UTF-8，无BOM
4. **换行符**: LF（Unix风格），GitHub会自动转换
5. **PyInstaller打包**: 必须用 `--onedir` 模式包含外部资源

---

## 📞 联系方式

- **问题反馈**: 1464629063@qq.com
- **用户协议**: https://lof-fund-monitor.pages.dev/agreement.html
- **隐私政策**: https://lof-fund-monitor.pages.dev/privacy.html

---

*本文档最后更新于 2026-05-06*