# 金快查 - LOF 基金折溢价监控

<div align="center">

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20MiniProgram-green.svg)

**多端监控 LOF 基金溢价率，发现套利机会**

[在线演示](https://lof-fund-monitor.pages.dev)

</div>

---

## 项目简介

LOF 基金折溢价监控系统，支持 PC 端和移动端双端 Web 服务，实时展示 LOF 基金溢价/折价率，帮助用户发现套利机会。

| 端 | 说明 |
|---|------|
| **PC Web** | 完整功能版，含详情弹窗、图表、收益计算 |
| **移动端** | 响应式自适应，卡片布局 |
| **小程序** | 微信小程序版本（独立项目） |

---

## 目录结构

```
lof-premium-tracker/
├── index.html              # Web 前端入口
├── css/
│   └── style.css          # 全局样式（含深色模式、响应式）
├── js/
│   ├── config.js          # 环境配置
│   ├── api.js             # API 服务层
│   └── app.js             # 主应用逻辑
├── assets/
│   └── icon.jpg           # 品牌图标
├── agreement.html         # 用户协议
├── privacy.html           # 隐私政策
├── functions/             # Cloudflare Pages Functions
│   ├── _lib.js            # 共享模块
│   ├── api/
│   │   └── [path].js      # API 代理
│   └── health.js          # 健康检查代理
├── backend/               # Flask 后端
│   ├── app.py             # API 服务入口
│   ├── config.py          # 配置
│   ├── data_fetcher.py    # 数据抓取
│   ├── fee_fetcher.py     # 费率抓取
│   ├── history_db.py      # 历史数据库
│   ├── history_fetcher.py # 历史数据抓取
│   ├── history_seed.json  # 种子数据
│   ├── sz_lof_codes.json  # 深交所LOF代码缓存
│   └── requirements.txt   # Python 依赖
├── miniprogram/           # 微信小程序
└── wrangler.toml          # CF Pages 配置
```

---

## 部署架构

```
浏览器 → Cloudflare Pages（静态 + Functions 代理）→ Railway（Flask 后端）
```

- **前端**: Cloudflare Pages
- **后端**: Railway（数据源：东方财富 + 天天基金网）
- **代理**: CF Pages Functions 同源转发 `/api/*` 到 Railway

---

## 快速开始

### 在线访问
https://lof-fund-monitor.pages.dev

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/woredasdnmv/lof-premium-tracker.git
cd lof-premium-tracker

# 启动前端
py -m http.server 8080

# 启动后端（可选，需先安装依赖）
cd backend
pip install -r requirements.txt
flask run --port 5000
```

---

## 部署

### 前端（Cloudflare Pages）

```bash
npx wrangler pages deploy . --project-name lof-fund-monitor --branch main --commit-dirty=true
```

### 后端（Railway）

Railway 自动从 GitHub 仓库 `backend/` 目录读取并部署。

---

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | HTML5 + CSS3 + Vanilla JS + Chart.js |
| 后端 | Python Flask + Gunicorn |
| 数据 | 东方财富 API + 天天基金网 API |
| 部署 | Cloudflare Pages + Railway |

---

## License

MIT © 2026
