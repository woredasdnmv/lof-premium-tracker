# LOF基金数据服务 API 接口文档

> 适用版本：v1.0 | 更新日期：2026-04-24
> 基础地址：`http://localhost:5000`（部署后替换为服务器IP/域名）

---

## 一、接口总览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 + 服务状态 |
| GET | `/api/funds` | 全量LOF基金列表（支持分页） |
| GET | `/api/funds/<code>` | 单只基金详情 |
| GET | `/api/rankings` | 溢价率排行榜 |
| POST | `/refresh` | 强制触发数据刷新（慎用） |

**返回格式**：所有接口统一 JSON，含 `code`(0=成功)、`data`、`message` 三个根字段。

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

---

## 二、接口详情

### 2.1 健康检查
```
GET /health
```
返回服务当前状态和缓存数据量。

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "status": "running",
    "cache_count": 553,
    "last_fetch": "2026-04-24T00:28:59",
    "refresh_interval_sec": 300,
    "error": null
  }
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | string | `running` = 正常运行中 |
| `cache_count` | int | 当前缓存的基金总数（553只） |
| `last_fetch` | string | 上次数据采集时间（ISO格式） |
| `refresh_interval_sec` | int | 自动刷新间隔（秒），当前300即5分钟 |

---

### 2.2 全量基金列表
```
GET /api/funds?page=1&page_size=20
```

**请求参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | int | 1 | 页码（从1开始） |
| `page_size` | int | 20 | 每页数量（最大100） |

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "code": "501018",
      "name": "南方原油LOF",
      "price": 2.008,
      "prev_nav": 1.888,
      "nav": 1.95,
      "nav_date": "2026-04-23 15:00",
      "change_pct": 6.53,
      "change_amount": 0.12,
      "volume": 15267823,
      "volume_w": 1526.78,
      "amount": 1503603862,
      "amount_w": 150360.39,
      "premium_rate": 2.97,
      "premium_status": "溢价",
      "is_formal_nav": true
    },
    { ... }
  ],
  "meta": {
    "total": 553,
    "page": 1,
    "page_size": 20,
    "total_pages": 28
  }
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | string | 基金代码（6位，沪市以501/502开头，深市以16xxxxx开头） |
| `name` | string | 基金名称（全称，含LOF后缀） |
| `price` | float | 当前实时交易价格（元） |
| `prev_nav` | float | 昨日收盘价（元），注意≠昨日净值 |
| `nav` | float | 估算净值/正式净值（元），交易日盘中为估算，收盘后为正式净值 |
| `nav_date` | string | 净值数据时间（如"2026-04-23 15:00"） |
| `change_pct` | float | 今日价格涨跌幅（%，正数=涨，负数=跌） |
| `change_amount` | float | 今日价格涨跌额（元） |
| `volume` | int | 成交量（股） |
| `volume_w` | float | 成交量（万股） |
| `amount` | float | 成交额（元） |
| `amount_w` | float | 成交额（万元） |
| `premium_rate` | float | 溢价率（%），正数=溢价，负数=折价，null=无净值数据 |
| `premium_status` | string | `溢价` / `折价` / `平价` / null |
| `is_formal_nav` | bool | true=盘后正式净值，false=盘中估算净值 |

**状态说明：**
- `premium_rate` 为 `null`：可能原因——QDII基金净值晚间公布、基金停牌、NAV接口超时
- `price` 和 `nav` 均有值：溢价率可信
- 仅 `price` 有值：`change_pct` 来自价格涨跌，不代表净值涨跌

---

### 2.3 单只基金详情
```
GET /api/funds/501018
```
（代码可以是6位纯数字，如 `501018`）

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "code": "501018",
    "name": "南方原油LOF",
    "price": 2.008,
    "prev_nav": 1.888,
    "nav": 1.95,
    "nav_date": "2026-04-23 15:00",
    "change_pct": 6.53,
    "change_amount": 0.12,
    "volume": 15267823,
    "volume_w": 1526.78,
    "amount": 1503603862,
    "amount_w": 150360.39,
    "premium_rate": 2.97,
    "premium_status": "溢价",
    "is_formal_nav": true
  }
}
```

**404 响应（基金代码不存在时）：**
```json
{
  "code": 404,
  "message": "基金代码不存在",
  "data": null
}
```

---

### 2.4 溢价率排行榜
```
GET /api/rankings?type=premium&limit=20
```

**请求参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | string | `premium` | `premium`=溢价排行，`discount`=折价排行 |
| `limit` | int | 20 | 返回数量（最大50） |

**溢价排行响应示例（type=premium）：**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "code": "501205",
      "name": "鹏华创新未来LOF",
      "price": 0.981,
      "nav": 0.9004,
      "premium_rate": 8.952,
      "premium_status": "溢价",
      "change_pct": 7.21,
      "is_formal_nav": true,
      "amount": 103538860
    },
    {
      "code": "501015",
      "name": "财通升级混合LOF",
      "price": 3.012,
      "nav": 2.917,
      "premium_rate": 3.257,
      "premium_status": "溢价",
      "change_pct": 3.01,
      "is_formal_nav": true,
      "amount": 40740011
    }
  ],
  "meta": {
    "type": "premium",
    "total": 306,
    "limit": 20
  }
}
```

**折价排行响应示例（type=discount）：**
```
GET /api/rankings?type=discount&limit=20
```
返回溢价率最低（负数最大绝对值）的基金，即折价最严重的基金。

---

### 2.5 强制刷新
```
POST /refresh
```
手动触发后端重新采集全量数据。首次加载约需30-40秒，请耐心等待返回结果。

**建议：不要在前端页面里频繁调用此接口**，后端已每5分钟自动刷新。

---

## 三、数据说明

### 3.1 基金代码规则
| 前缀 | 市场 | 示例 |
|------|------|------|
| `501xxx` / `502xxx` | 沪市（上海证券交易所） | 501018 南方原油LOF |
| `160xxx` ~ `169xxx` | 深市（深圳证券交易所） | 161725 招商添利LOF |
| `184xxx` | 深市（创新型LOF） | 184701 融通核心LOF |

### 3.2 溢价率含义

```
溢价率 = (现价 - 净值) / 净值 × 100%
```

| 溢价率 | 含义 | 操作建议 |
|--------|------|---------|
| 正数（大）| 现价 > 净值较多，溢价偏高 | 谨慎买入，溢价有收缩风险 |
| 接近 0 | 价格基本等于净值 | 正常 |
| 负数（大）| 现价 < 净值较多，折价偏低 | 谨慎卖出，折价有修复机会 |

> ⚠️ **注意**：部分基金停牌时现价固定显示为1.0元，其溢价率数据失真，请过滤 `premium_rate > 50` 或 `premium_rate < -30` 的异常值。

### 3.3 数据更新频率
- **交易时段（9:30-15:00）**：价格实时变化，净值15:00前为估算值，15:00后更新为正式净值
- **非交易时段**：价格为收盘价，净值为上一个交易日数据
- **自动刷新**：后端每5分钟重新采集一次，前端无需主动刷新

---

## 四、前端开发建议

### 4.1 推荐数据加载顺序
```javascript
// 1. 先检查服务状态
fetch('/health')
// 2. 加载排行榜（数据量小，最快展示）
fetch('/api/rankings?type=premium&limit=20')
// 3. 加载全量列表（553只，可分页）
fetch('/api/funds?page=1&page_size=50')
```

### 4.2 溢价率展示建议
```javascript
// 安全过滤停牌基金异常溢价率
const PREMIUM_THRESHOLD = 50;
const DISCOUNT_THRESHOLD = -30;

const safeFund = fund => {
  const rate = fund.premium_rate;
  return rate !== null 
    && rate < PREMIUM_THRESHOLD 
    && rate > DISCOUNT_THRESHOLD;
};
```

### 4.3 数字格式化示例
```javascript
// 溢价率：保留2位小数
premium_rate.toFixed(2) + '%'

// 成交额：万/亿单位
amount_w > 10000 ? (amount_w / 10000).toFixed(2) + '亿' 
                  : amount_w.toFixed(2) + '万'

// 成交量：万股
(volume / 10000).toFixed(2) + '万'
```

### 4.4 刷新策略建议
```
页面加载 → 调 /health 确认状态
页面展示 → 调 /api/rankings（20条） + /api/funds（前50条）
用户翻页 → 按需加载对应页
手动刷新按钮 → 调 POST /refresh（提示用户约等待30秒）
```

---

## 五、常见问题

**Q: 为什么有些基金没有溢价率？**
A: QDII基金（投资海外资产）的净值通常在收盘后才公布，盘中无净值数据。部分新上市基金也可能暂无数值。

**Q: 溢价率超过50%正常吗？**
A: 不正常。通常是基金停牌（价格固定1.0）或净值数据过期。建议前端过滤掉 `|premium_rate| > 50` 的数据。

**Q: 数据延迟多久？**
A: 价格数据基本实时（东方财富/腾讯行情推送）。净值数据：估算净值盘中更新，正式净值15:00后更新。后端每5分钟自动刷新一次。

**Q: 前端轮询建议频率？**
A: 建议1-2分钟轮询一次 `/api/rankings`（20条数据量小）。`/api/funds` 全量数据量大，非必要不频繁请求。

---

## 六、部署说明

**当前运行地址：** `http://localhost:5000`

**更换服务器部署：**
1. 将 `lof-fund-service` 文件夹上传至服务器
2. 安装依赖：`pip install flask requests apscheduler flask-cors`
3. 启动：`python app.py`
4. 服务地址改为服务器IP：`http://<服务器IP>:5000`
5. 记得开放服务器防火墙的 5000 端口

**生产环境建议：** 用 `gunicorn` 或 `nginx + gunicorn` 替代直接运行 Flask 调试服务器。
