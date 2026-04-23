# LOF基金数据服务 - 微信小程序对接文档

> 版本：v1.0 | 更新日期：2026-04-24
> 后端地址：`http://localhost:5000`（部署后替换为服务器地址）

---

## 一、小程序配置

### 1.1 服务器域名白名单

在小程序管理后台 → 开发管理 → 开发设置 → 服务器域名，添加以下域名：

| 域名 | 用途 |
|------|------|
| `http://<你的服务器IP>:5000` | 开发阶段使用 HTTP |
| `https://<你的域名.com>` | 正式环境必须用 HTTPS |

> ⚠️ **注意**：request 合法域名不支持 IP 地址，调试阶段可在详情中勾选「不校验合法域名」绕过。

### 1.2 小程序 app.json 配置

```json
{
  "pages": [
    "pages/index/index",
    "pages/rankings/rankings",
    "pages/detail/detail",
    "pages/search/search"
  ],
  "window": {
    "navigationBarTitleText": "LOF基金溢价监控"
  }
}
```

---

## 二、请求封装（必读）

### 2.1 基础请求模块

创建文件 `utils/request.js`：

```javascript
/**
 * LOF基金数据服务 - 请求封装
 * 基础路径，部署时替换为实际服务器地址
 */
const BASE_URL = 'http://localhost:5000';

/**
 * 统一请求方法
 * @param {string} path - 接口路径（如 /api/funds）
 * @param {object} params - query 参数对象
 * @param {string} method - GET | POST
 * @returns {Promise}
 */
function request(path, params = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + path;
    wx.showLoading({ title: '加载中...', mask: true });

    wx.request({
      url,
      method,
      data: params,
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      success(res) {
        wx.hideLoading();
        if (res.statusCode === 200) {
          const body = res.data;
          if (body.code === 0) {
            resolve(body.data);
          } else {
            wx.showToast({ title: body.message || '数据加载失败', icon: 'none' });
            reject(body);
          }
        } else {
          wx.showToast({ title: '网络异常', icon: 'none' });
          reject(res);
        }
      },
      fail(err) {
        wx.hideLoading();
        wx.showToast({ title: '请求失败，请检查网络', icon: 'none' });
        reject(err);
      }
    });
  });
}

// 导出各接口方法
module.exports = {
  BASE_URL,
  // 健康检查
  getHealth: () => request('/health'),
  // 基金列表
  getFunds: (page = 1, pageSize = 20) =>
    request('/api/funds', { page, page_size: pageSize }),
  // 单只基金详情
  getFundDetail: (code) => request(`/api/funds/${code}`),
  // 溢价率排行
  getRankings: (type = 'premium', limit = 20) =>
    request('/api/rankings', { type, limit }),
  // 折价率排行
  getDiscountRankings: (limit = 20) =>
    request('/api/rankings', { type: 'discount', limit }),
  // 强制刷新
  refresh: () => request('/refresh', {}, 'POST'),
};
```

---

## 三、接口调用示例

### 3.1 首页 - 加载溢价率排行

**页面文件：** `pages/index/index.js`

```javascript
const api = require('../../utils/request.js');

Page({
  data: {
    premiumList: [],    // 溢价排行
    discountList: [],  // 折价排行
    health: null,       // 服务状态
    refreshing: false,
  },

  onLoad() {
    this.init();
  },

  onShow() {
    // 每次进入页面刷新一次
    this.loadRankings();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadRankings().finally(() => wx.stopPullDownRefresh());
  },

  async init() {
    // 检查服务状态
    try {
      const health = await api.getHealth();
      this.setData({ health });
    } catch (e) {
      console.error('服务不可用', e);
    }
  },

  async loadRankings() {
    this.setData({ refreshing: true });
    try {
      const [premium, discount] = await Promise.all([
        api.getRankings('premium', 20),
        api.getDiscountRankings(20),
      ]);
      this.setData({ premiumList: premium, discountList: discount });
    } finally {
      this.setData({ refreshing: false });
    }
  },

  // 手动刷新
  async onRefresh() {
    wx.showLoading({ title: '正在刷新...' });
    try {
      await api.refresh();
      await this.loadRankings();
      wx.showToast({ title: '刷新成功', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: '刷新失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
});
```

**wxml 模板：** `pages/index/index.wxml`

```xml
<view class="container">
  <!-- 服务状态 -->
  <view class="status-bar" wx:if="{{health}}">
    <text>数据更新: {{health.last_fetch}}</text>
    <text class="tag">共{{health.cache_count}}只LOF</text>
  </view>

  <!-- 刷新按钮 -->
  <button class="refresh-btn" bindtap="onRefresh" loading="{{refreshing}}">
    刷新数据
  </button>

  <!-- 溢价榜 -->
  <view class="section">
    <view class="section-title">📈 溢价榜（价格 > 净值）</view>
    <view class="fund-item header">
      <text class="col-code">代码</text>
      <text class="col-name">名称</text>
      <text class="col-price">现价</text>
      <text class="col-nav">净值</text>
      <text class="col-premium">溢价率</text>
    </view>
    <view
      class="fund-item"
      wx:for="{{premiumList}}"
      wx:key="code"
      bindtap="goDetail"
      data-code="{{item.code}}"
    >
      <text class="col-code">{{item.code}}</text>
      <text class="col-name">{{item.name}}</text>
      <text class="col-price">{{item.price}}</text>
      <text class="col-nav">{{item.nav}}</text>
      <text class="col-premium high">{{item.premium_rate}}%</text>
    </view>
  </view>

  <!-- 折价榜 -->
  <view class="section">
    <view class="section-title">📉 折价榜（价格 < 净值）</view>
    <view
      class="fund-item"
      wx:for="{{discountList}}"
      wx:key="code"
      bindtap="goDetail"
      data-code="{{item.code}}"
    >
      <text class="col-code">{{item.code}}</text>
      <text class="col-name">{{item.name}}</text>
      <text class="col-price">{{item.price}}</text>
      <text class="col-nav">{{item.nav}}</text>
      <text class="col-premium low">{{item.premium_rate}}%</text>
    </view>
  </view>
</view>
```

**wxss 样式：** `pages/index/index.wxss`

```css
.container { padding: 20rpx; background: #f5f5f5; min-height: 100vh; }

.status-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16rpx 20rpx; background: #fff; border-radius: 12rpx;
  margin-bottom: 20rpx; font-size: 24rpx; color: #666;
}
.tag { background: #e6f7ff; color: #1890ff; padding: 4rpx 16rpx; border-radius: 20rpx; }

.refresh-btn {
  width: 200rpx; margin: 0 auto 20rpx;
  background: #1890ff; color: #fff; font-size: 28rpx;
  border-radius: 40rpx;
}

.section { margin-bottom: 30rpx; background: #fff; border-radius: 12rpx; overflow: hidden; }
.section-title { padding: 20rpx; font-size: 30rpx; font-weight: bold; border-bottom: 1rpx solid #eee; }

.fund-item {
  display: flex; align-items: center; padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0; font-size: 26rpx;
}
.fund-item:last-child { border-bottom: none; }
.fund-item.header { background: #fafafa; color: #999; font-size: 24rpx; }

.col-code  { width: 120rpx; color: #1890ff; }
.col-name  { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-price { width: 100rpx; text-align: right; }
.col-nav   { width: 100rpx; text-align: right; }
.col-premium { width: 130rpx; text-align: right; font-weight: bold; }
.col-premium.high { color: #f5222d; }
.col-premium.low  { color: #52c41a; }
```

---

### 3.2 基金详情页

**页面文件：** `pages/detail/detail.js`

```javascript
const api = require('../../utils/request.js');

Page({
  data: {
    code: '',
    fund: null,
    loading: true,
  },

  onLoad(query) {
    const code = query.code || '';
    this.setData({ code });
    this.loadDetail(code);
  },

  async loadDetail(code) {
    this.setData({ loading: true });
    try {
      const fund = await api.getFundDetail(code);
      this.setData({ fund, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 复制基金代码
  copyCode() {
    wx.setClipboardData({ data: this.data.code });
    wx.showToast({ title: '代码已复制', icon: 'success' });
  },

  // 格式化溢价率样式
  getPremiumClass(rate) {
    if (rate === null) return 'neutral';
    return rate > 0 ? 'high' : rate < 0 ? 'low' : 'neutral';
  },
});
```

**wxml：** `pages/detail/detail.wxml`

```xml
<view class="container" wx:if="{{!loading && fund}}">
  <!-- 基金头部 -->
  <view class="fund-header">
    <view class="fund-name">{{fund.name}}</view>
    <view class="fund-code" bindtap="copyCode">
      {{fund.code}}
      <text class="copy-hint">点击复制</text>
    </view>
  </view>

  <!-- 价格 -->
  <view class="card">
    <view class="card-title">实时行情</view>
    <view class="price-row">
      <text class="big-price">{{fund.price}}</text>
      <text class="change {{fund.change_pct >= 0 ? 'up' : 'down'}}">
        {{fund.change_pct >= 0 ? '+' : ''}}{{fund.change_pct}}%
      </text>
      <text class="change-amount">
        {{fund.change_amount >= 0 ? '+' : ''}}{{fund.change_amount}}元
      </text>
    </view>
    <view class="info-row">
      <view class="info-item"><text class="label">昨收</text><text>{{fund.prev_nav}}</text></view>
      <view class="info-item"><text class="label">成交量</text><text>{{fund.volume_w}}万</text></view>
      <view class="info-item"><text class="label">成交额</text><text>{{fund.amount_w}}万</text></view>
    </view>
  </view>

  <!-- 净值 & 溢价率 -->
  <view class="card">
    <view class="card-title">净值信息</view>
    <view class="nav-row">
      <view class="nav-block">
        <text class="label">估算净值</text>
        <text class="value">{{fund.nav || '--'}}</text>
        <text class="sub">{{fund.nav_date || '暂无'}}</text>
        <view class="tag {{fund.is_formal_nav ? 'formal' : 'est'}}">
          {{fund.is_formal_nav ? '正式净值' : '估算净值'}}
        </view>
      </view>
      <view class="premium-block">
        <text class="label">溢价率</text>
        <text class="premium {{getPremiumClass(fund.premium_rate)}}">
          {{fund.premium_rate !== null ? fund.premium_rate + '%' : '--'}}
        </text>
        <text class="premium-label">{{fund.premium_status || '暂无数据'}}</text>
      </view>
    </view>
  </view>

  <!-- 说明 -->
  <view class="tip">
    <text>溢价率 = (现价 - 净值) / 净值 × 100%\n</text>
    <text>正数 = 溢价（买入偏贵），负数 = 折价（买入偏便宜）</text>
  </view>
</view>

<view class="loading" wx:if="{{loading}}">
  <text>加载中...</text>
</view>
```

---

### 3.3 全量列表页

```javascript
// pages/funds/funds.js
const api = require('../../utils/request.js');

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 30,
    hasMore: true,
    loading: false,
  },

  onLoad() {
    this.loadFunds();
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore) return;
    this.setData({ page: this.data.page + 1 });
    this.loadFunds(true);
  },

  async loadFunds(append = false) {
    const { page, pageSize } = this.data;
    this.setData({ loading: true });
    try {
      const list = await api.getFunds(page, pageSize);
      this.setData({
        list: append ? this.data.list.concat(list) : list,
        hasMore: list.length === pageSize,
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  // 搜索过滤（前端本地过滤）
  searchFunds(e) {
    const keyword = e.detail.value.toLowerCase();
    const all = this.data.allList || [];
    const filtered = keyword
      ? all.filter(f => f.code.includes(keyword) || f.name.toLowerCase().includes(keyword))
      : all;
    this.setData({ list: filtered });
  },
});
```

---

## 四、数据模型

### 4.1 Fund 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | string | 基金代码，6位数字 |
| `name` | string | 基金全称 |
| `price` | float | 当前交易价格（元） |
| `prev_nav` | float | 昨日收盘价 |
| `nav` | float | 净值/估算净值，无数据时为 `null` |
| `nav_date` | string | 净值更新时间 |
| `change_pct` | float | 今日涨跌幅（%），正=涨 |
| `change_amount` | float | 今日涨跌额（元） |
| `volume` | int | 成交量（股） |
| `volume_w` | float | 成交量（万股） |
| `amount` | float | 成交额（元） |
| `amount_w` | float | 成交额（万元） |
| `premium_rate` | float | 溢价率（%），null=无数值 |
| `premium_status` | string | `溢价` / `折价` / `平价` / null |
| `is_formal_nav` | bool | true=正式净值，false=估算净值 |

### 4.2 Health 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | string | `running` |
| `cache_count` | int | 基金总数（553只） |
| `last_fetch` | string | 上次采集时间（ISO） |
| `refresh_interval_sec` | int | 刷新间隔（300秒） |
| `error` | string | null=无错误 |

---

## 五、关键注意事项

### 5.1 域名配置（最重要）

**开发阶段：**
打开微信开发者工具 → 详情 → 本地设置 → 勾选「不校验合法域名...」

**正式发布前：**
- 后端必须部署在 **HTTPS** 服务器上
- 在小程序管理后台添加 request 合法域名
- `wx.request` 不支持 IP 地址和 HTTP（生产环境）

### 5.2 溢价率异常值处理

部分基金停牌时价格为固定 1.0 元，导致溢价率极高（>50%），前端请过滤：

```javascript
// 安全过滤
const isValid = (fund) => {
  return fund.premium_rate !== null
    && fund.premium_rate < 50
    && fund.premium_rate > -50;
};
```

### 5.3 净值空值处理

约 30% 的基金（主要是 QDII 基金）盘中无净值，前端显示 `--` 即可：

```javascript
const showNav = (fund) => fund.nav !== null ? fund.nav : '--';
```

### 5.4 刷新频率建议

| 场景 | 建议频率 |
|------|---------|
| 页面打开时 | 自动加载一次 |
| 下拉刷新 | 用户主动触发 |
| 自动轮询 | 不推荐（浪费资源，后端已每5分钟刷新） |
| 手动刷新按钮 | 需提示用户约等待 30 秒 |

### 5.5 小程序分包加载

建议将 LOF 服务页面放入主包，将详情页等放入分包，减少主包体积。

---

## 六、后端部署（HTTPS 配置）

### 6.1 服务器要求

- Linux 服务器（推荐 CentOS 7+ / Ubuntu 20.04+）
- 域名已备案并指向服务器 IP
- 已申请 SSL 证书（或使用 Let's Encrypt 免费证书）

### 6.2 部署步骤

```bash
# 1. 安装 Python 环境
apt update && apt install python3 python3-pip -y

# 2. 上传代码
cd /home/www/lof-fund-service

# 3. 安装依赖
pip3 install flask requests apscheduler flask-cors gunicorn

# 4. 配置 HTTPS（nginx 反向代理）
# /etc/nginx/sites-available/lof
```

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# 5. 启动服务（使用 gunicorn）
gunicorn -w 4 -b 127.0.0.1:5000 app:app --daemon

# 6. 重启 nginx
nginx -t && nginx -s reload
```

### 6.3 小程序合法域名配置

```
https://your-domain.com
```

---

## 七、完整文件清单

```
lof-fund-service/          ← 后端代码（部署到服务器）
├── app.py
├── config.py
├── data_fetcher.py
├── sz_lof_codes.json
├── requirements.txt
└── README.md

微信小程序项目/
├── utils/
│   └── request.js         ← 请求封装（复制到小程序项目）
├── pages/
│   ├── index/
│   │   ├── index.js       ← 溢价/折价排行页
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── detail/
│   │   ├── detail.js      ← 单只基金详情页
│   │   ├── detail.wxml
│   │   └── detail.wxss
│   └── funds/
│       ├── funds.js       ← 全量列表页
│       ├── funds.wxml
│       └── funds.wxss
└── app.json
```

---

## 八、联系后端

如遇接口问题，请提供：
1. 请求的完整 URL
2. 响应的完整 JSON（截图或文本）
3. 小程序基础库版本
4. 手机系统版本（iOS / Android）
