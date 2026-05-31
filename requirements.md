# 健康日志可视化编辑器 - 需求规格说明书

> 文档版本：v1.1  
> 创建日期：2026-05-31  
> 项目代号：BioHacker-Editor

---

## 1. 项目概述与核心痛点

### 1.1 背景与痛点分析

当前，用户通过 GitHub 仓库维护个人健康日志文件（如 `health.txt`），但面临以下显著问题：

| 痛点维度 | 具体表现 |
|---------|---------|
| **编辑体验差** | GitHub 默认编辑器字体过小，无移动端优化，长时间编辑易疲劳 |
| **格式维护难** | 需手动控制缩进、换行、分隔符等格式，容易出错且效率低下 |
| **可视化缺失** | 纯文本形式无法直观呈现日期、分类（饮食/锻炼/生理事件）等结构化信息 |
| **移动端不友好** | 手机端操作 GitHub Web 界面极其不便，无法随时随地记录健康数据 |
| **添加新记录繁琐** | 没有便捷的新建卡片功能，需要手动维护文本格式 |

### 1.2 项目目标

构建一个**单文件 H5 应用**，实现：

1. **大字号、现代优雅的可视化界面** —— 提升阅读与编辑舒适度
2. **自动化解析与渲染** —— 将 TXT 文件智能解析为结构化卡片视图
3. **便捷的双向同步** —— 通过 GitHub REST API 实现读取与写入的无缝闭环
4. **零部署依赖** —— 单个 HTML 文件即可运行，可托管于 GitHub Pages 或本地打开
5. **便捷的新增卡片功能** —— 通过侧边栏快速创建新日志卡片

---

## 2. 功能需求规格（Functional Requirements）

### 2.1 配置模块（Configuration Module）

**功能描述**：提供用户配置界面，支持输入并持久化存储 GitHub 相关凭证与路径信息，以及邮编信息用于天气查询。

**详细需求**：

| 配置项 | 存储方式 | 用途说明 |
|-------|---------|---------|
| GitHub Token | LocalStorage | 用于 API 鉴权，需 `repo` 权限 |
| 用户名（Username） | LocalStorage | GitHub 用户名 |
| 仓库名（Repository） | LocalStorage | 存放健康日志的仓库名称 |
| 文件路径（File Path） | LocalStorage | 日志文件在仓库中的路径，如 `data/health.txt` |
| 邮政编码（Postal Code） | LocalStorage | 用于天气 API 查询所在地区天气 |

**交互要求**：
- 首次使用时显示配置表单
- 支持修改配置（提供设置入口）
- Token 输入框需遮罩显示（type="password"）
- 邮编输入框验证中国邮政编码格式（6位数字）

---

### 2.2 侧边栏与新增卡片模块（Sidebar & Add Entry Module）

**功能描述**：通过左上角三根杠菜单按钮打开侧边栏，提供便捷的新卡片创建界面。

**2.2.1 侧边栏设计**

| 要素 | 设计规格 |
|-----|---------|
| **触发按钮** | 左上角三根杠（汉堡菜单）按钮，点击滑出侧边栏 |
| **侧边栏样式** | 从左侧滑入，占屏幕宽度约 80%（手机端）或固定宽度（桌面端） |
| **背景遮罩** | 侧边栏展开时显示半透明遮罩，点击遮罩关闭侧边栏 |
| **关闭方式** | 点击左上角叉号或背景遮罩关闭 |

**2.2.2 新增卡片表单**

表单布局从上到下依次为：

```
┌─────────────────────────────────────────┐
│  📅 日期: [yyyy.m.d 可编辑输入框]      │
├─────────────────────────────────────────┤
│                                         │
│  1. Weather: ( )，( )~( )               │
│     [📡 查询网络天气 按钮]              │
│                                         │
│  2. Sleep: ( ):( ) 睡着，( ):( )        │
│     [⚡ 苏醒] [⏰ 闹钟]                  │
│     括号: ( )                           │
│                                         │
│  3. Diet:                               │
│     午饭：( )、晚饭：( )                 │
│                                         │
│  4. Exercise: ( )                       │
│                                         │
│  5. Note: ( )                           │
│                                         │
│  💡 特殊标识: ( )                       │
│     [x] [+] 添加（按钮，换行显示）       │
│     [x] [?] 添加（按钮，换行显示）       │
│     [x] [!] 添加（按钮，换行显示）       │
│                                         │
├─────────────────────────────────────────┤
│  [✅ 提交按钮]                          │
└─────────────────────────────────────────┘
```

**2.2.3 字段详细说明**

| 字段 | 组件类型 | 说明 |
|-----|---------|------|
| **日期** | 文本输入框 | 默认填充当前本地日期（yyyy.m.d 格式），用户可自行修改 |
| **Weather** | 3个文本框 + 查询按钮 | 格式：Weather: (描述)，(最低温)~(最高温)；查询按钮调用天气 API 自动填充 |
| **Sleep** | 4个时间框（HH/MM分开）+ 苏醒/闹钟按钮 + 备注输入框 | 格式：(HH):(MM) 睡着，(HH):(MM) 苏醒/闹钟（备注在括号内） |
| **Diet** | 2个文本输入框 | 格式：午饭：( )、晚饭：( ) |
| **Exercise** | 文本输入框 | 自由文本描述锻炼内容 |
| **Note** | 多行文本框 | 一般备注内容 |
| **特殊标注** | 文本输入框 + 3个独立按钮（各自换行） | 文本框用于输入标注内容，3个按钮分别对应 [+]/[?]/[!] 三种标注类型，点击按钮添加对应类型的标注 |

**2.2.4 日期验证机制**

- 提交前检查输入的日期是否已存在于现有卡片中
- 如日期已存在，显示错误提示 Toast，中止提交
- 错误提示：「该日期的记录已存在，请修改日期或编辑现有记录」

**2.2.5 天气查询功能**

- 查询按钮调用免费天气 API（如 OpenWeatherMap）
- 需配置文件中的邮编确定查询地区
- 查询成功后自动填充天气描述和温度信息
- 查询失败显示错误提示，用户可手动输入

**2.2.6 提交与渲染流程**

```
用户点击提交按钮
   ↓
 验证日期格式和唯一性
   ↓
 将表单数据序列化为 JSON
   ↓
 添加到现有卡片数组中
   ↓
 重新渲染卡片列表（最新日期卡片排最前或按日期排序）
   ↓
 自动将数据保存到 GitHub（本地版本：提示保存到文件）
   ↓
 侧边栏收起，显示成功 Toast
```

---

### 2.3 读取与解析模块（Read & Parse Module）

**功能描述**：通过 GitHub REST API 读取指定文件内容，并解析为结构化 JSON 数据。

**API 调用规格**：

```
GET https://api.github.com/repos/{owner}/{repo}/contents/{path}
Headers:
  Authorization: Bearer {token}
  Accept: application/vnd.github+json
```

**响应数据结构**：

```json
{
  "name": "health.txt",
  "sha": "abc123...",
  "content": "Base64编码的文件内容",
  "encoding": "base64"
}
```

---

#### 文本格式规范（基于实际日志结构）

**日期块格式**：`yyyy.m.d` 或 `yyyy.mm.dd`（使用**点号**分隔，年份固定四位数）

```
20xx.x.x
Weather: ，-℃
Sleep: : 睡着，: 苏醒/闹钟
Diet: 午饭：、晚饭：
Exercise:
Note:

2026.5.29
Weather: 晴转雨，24-35℃ （上午晴，下午阵雨，晚上凉爽）
Sleep: 0:00 睡着，7:58 闹钟
Diet: 午饭：常规、晚饭：常规（青菜，鸡排，咖喱土豆）
Exercise: 常规的90%
Note:
[+] 14：00-16：13 睡了很舒服的午觉，状态满满
```

**五字段结构**：

| 字段名 | 前缀标识 | 内容特征 | 多行支持 |
|-------|---------|---------|---------|
| `Weather` | `Weather:` | 温度描述 + 温度范围 + 括号备注 | ❌ 单行 |
| `Sleep` | `Sleep:` | 入睡时间 + 睡着 + 苏醒时间 + 苏醒类型 | ❌ 单行 |
| `Diet` | `Diet:` | 午饭：xxx、晚饭：xxx（顿号分隔） | ❌ 单行 |
| `Exercise` | `Exercise:` | 自由文本（可含百分比） | ❌ 单行 |
| `Note` | `Note:` | 自由文本 + 特殊标注 `[!]/[?]/[+]` | ✅ 多行 |

**特殊标注系统**：

| 标注 | 语义 | 示例 |
|-----|------|------|
| `[+]` | 有益事件/值得鼓励 | `[+] 14：00-16：13 睡了很舒服的午觉，状态满满` |
| `[?]` | 观察/恢复状态 | `[?] 10：40 今天周六，上午悠闲...` |
| `[!]` | 异常/转折/需注意 | `[!] 20:30 左手中指关节疼痛...` |

---

#### 解析算法（基于逐行遍历）

```
原始文本
  ↓ 按换行符分割为行数组
[行1, 行2, 行3, ..., 行N]
  ↓ 遍历每一行
遇到日期行（yyyy.m.d） → 创建新记录对象
遇到字段行（Weather:/Sleep: 等） → 解析对应字段
遇到标注行（[!]/[?]/[+]） → 添加到 specialNotes 数组
  ↓
标准 JSON 数组
```

**核心代码**：

```javascript
function parse(text) {
  const entries = [];
  const datePattern = /^(\d{4}\.\d{1,2}\.\d{1,2})$/;
  const lines = text.split('\n');
  let currentEntry = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (datePattern.test(trimmed)) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = {
        date: trimmed,
        weather: parseWeather(''),
        sleep: parseSleep(''),
        diet: parseDiet(''),
        exercise: '',
        note: '',
        specialNotes: []
      };
    } else if (currentEntry) {
      if (trimmed.startsWith('Weather:')) {
        currentEntry.weather = parseWeather(trimmed.replace('Weather:', '').trim());
      } else if (trimmed.startsWith('Sleep:')) {
        currentEntry.sleep = parseSleep(trimmed.replace('Sleep:', '').trim());
      } else if (trimmed.startsWith('Diet:')) {
        currentEntry.diet = parseDiet(trimmed.replace('Diet:', '').trim());
      } else if (trimmed.startsWith('Exercise:')) {
        currentEntry.exercise = trimmed.replace('Exercise:', '').trim();
      } else if (trimmed.startsWith('Note:')) {
        currentEntry.note = trimmed.replace('Note:', '').trim();
      } else if (trimmed.startsWith('[!]')) {
        currentEntry.specialNotes.push({ type: '!', text: trimmed.substring(4).trim() });
      } else if (trimmed.startsWith('[?]')) {
        currentEntry.specialNotes.push({ type: '?', text: trimmed.substring(4).trim() });
      } else if (trimmed.startsWith('[+]')) {
        currentEntry.specialNotes.push({ type: '+', text: trimmed.substring(4).trim() });
      }
    }
  }

  if (currentEntry) entries.push(currentEntry);
  return entries;
}
```

**关键设计决策**：
- 使用 `text.split('\n')` 简单分割，不依赖复杂正则
- 使用 `startsWith()` 识别字段前缀，简洁高效
- 跳过空行 `if (!trimmed) continue`
- 特殊标注 `[!]/[?]/[+]` 作为独立字段处理，不隶属于 Note

---

#### 输出 JSON 数据结构

```json
[
  {
    "date": "2026.5.29",
    "weather": {
      "description": "晴转雨",
      "tempLow": 24,
      "tempHigh": 35,
      "note": "上午晴，下午阵雨，晚上凉爽"
    },
    "sleep": {
      "sleepTime": "0:00",
      "wakeTime": "7:58",
      "wakeType": "闹钟",
      "note": ""
    },
    "diet": {
      "lunch": "常规",
      "dinner": "常规（青菜，鸡排，咖喱土豆）"
    },
    "exercise": "常规的90%",
    "note": "",
    "specialNotes": [
      { "type": "+", "text": "14：00-16：13 睡了很舒服的午觉，状态满满" }
    ]
  }
]
```

---

#### 字段解析正则速查

| 字段 | 正则表达式 | 说明 |
|-----|-----------|------|
| 日期块 | `/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/` | 匹配 yyyy.m.d 格式 |
| Weather | `/^(.+?)，(\d+)-(\d+)℃(?:\s*（(.+?)）)?$/` | 解析温度和备注 |
| Sleep | `/^(\d{1,2}):(\d{2})\s*睡着，(\d{1,2}):(\d{2})\s*(苏醒\|闹钟\|自然醒)(?:\s*（(.+?)）)?$/` | 解析睡眠数据 |
| Diet | `/^午饭：(.+?)、晚饭：(.*)$/` | 解析午饭和晚饭 |
| 特殊标注 | `/(\[[!\?\+]\]\s*[^\n]*)/g` | 提取 [+]/[?]/[!] 标注 |

---

#### 容错机制（Fallback Rules）

| 异常场景 | Fallback 行为 |
|---------|--------------|
| 字段完全缺失 | 返回空字符串 `""` |
| 字段值为空 | 返回空字符串 `""` |
| 日期格式不规范 | 跳过该记录，输出警告日志 |
| 温度值为 `,-℃` | 返回 `{description: "", tempLow: null, tempHigh: null, note: ""}` |
| Sleep 时间冒号为中文 `：` | 自动转换为英文 `:` 后再解析 |
| Note 中无特殊标注 | `specialNotes` 返回空数组 `[]` |

---

### 2.4 UI 渲染模块（UI Rendering Module）

**功能描述**：使用 Tailwind CSS 将解析后的数据渲染为可视化卡片列表。

---

#### 视觉规格（基于实际记录习惯优化）

| 设计要素 | 规格要求 |
|---------|---------|
| **日期标题** | 20px，bold，醒目但不抢占视觉焦点 |
| **字段标签** | 14px，medium，使用 Emoji 图标前缀 |
| **正文内容** | 16px，regular，确保阅读舒适 |
| **特殊标注** | 14px，渲染为彩色标签（非原始文本） |
| **卡片圆角** | 12px，现代柔和感 |
| **卡片内边距** | 20px，保证内容不贴边 |
| **字段间距** | 16px，分组清晰 |
| **卡片间距** | 24px，多卡片时不拥挤 |

---

#### 字号与内容长度适配

| 字段 | 平均字数 | 最长字数 | 编辑态组件 |
|-----|---------|---------|-----------|
| Weather | 15-25 | ~35（含括号备注） | `input` 单行 |
| Sleep | 20-40 | ~60（含睡眠质量备注） | `input` 单行 |
| Diet | 20-50 | ~80（含食物详细描述） | **`textarea`** 多行 |
| Exercise | 5-15 | ~30 | `input` 单行 |
| Note | 50-150 | ~200（含多条特殊标注） | **`textarea`** 多行 |

**决策理由**：`Diet` 和 `Note` 使用 `textarea` 是因为这两个字段最可能出现长文本，换行展示更清晰。

---

#### 卡片结构设计

```
┌─────────────────────────────────────────────┐
│  📅 2026.5.30                    [编辑] [保存]│
├─────────────────────────────────────────────┤
│                                             │
│  🌤️ Weather                                 │
│  ┌─────────────────────────────────────┐    │
│  │ 多云，24-32℃                        │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  😴 Sleep                                   │
│  ┌─────────────────────────────────────┐    │
│  │ 1:10 睡着 → 7:26 苏醒（睡眠质量高）    │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  🍽️ Diet                                    │
│  ┌─────────────────────────────────────┐    │
│  │ 午饭：常规                           │    │
│  │ 晚饭：菠萝鸡肉火腿炒饭+一颗鸡蛋        │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  🏃 Exercise                                │
│  ┌─────────────────────────────────────┐    │
│  │ 常规的95%                            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  📝 Note                                    │
│  ┌─────────────────────────────────────┐    │
│  │ 生理焦虑太频发了...                  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  💡 特殊标注:                               │
│  [+] 午觉舒服    [?] 喝咖啡    [!] 关节痛  │
└─────────────────────────────────────────────┘
```

---

#### 特殊标注标签样式

**展示态**：将 `[+]`、`[?]`、`[!]` 渲染为彩色标签

| 标注 | 展示样式 | 使用场景 |
|-----|---------|---------|
| `[+]` | 绿色背景 `bg-green-100 text-green-800` | 有益事件/值得鼓励 |
| `[?]` | 蓝色背景 `bg-blue-100 text-blue-800` | 观察/恢复状态 |
| `[!]` | 红色背景 `bg-red-100 text-red-800` | 异常/警告 |

**编辑态**：`Note` 的 `textarea` 保持原始文本格式，用户自行添加 `[+]/[?]/[!]` 标注。

---

#### 响应式断点

| 设备 | 屏幕宽度 | 布局 |
|-----|---------|------|
| 手机 | < 640px | 单列，卡片宽度 100% |
| 平板 | 640px - 1024px | 双列网格 |
| 桌面 | > 1024px | 三列网格或单列居中（最大宽度 800px） |

---

#### 交互反馈设计

| 交互 | 视觉反馈 |
|-----|---------|
| 点击编辑 | 按钮变为「保存」「取消」，输入框启用 |
| 保存成功 | Toast 提示「已保存到 GitHub」 |
| 保存失败 | 红色 Toast，显示错误原因 |
| 加载中 | 骨架屏或中央加载动画 |
| 网络断开 | 顶部横幅提示「网络已断开」 |
| 日期重复 | 红色 Toast 提示「该日期的记录已存在」 |
| 天气查询中 | 加载动画，按钮禁用 |

---

### 2.5 编辑与写入模块（Edit & Write Module）

**功能描述**：支持点击卡片进入编辑模式，保存时序列化为 TXT 格式并推送到 GitHub。

**编辑交互**：
- 点击卡片上的「编辑」按钮进入编辑模式
- Weather/Sleep/Exercise → `input` 单行输入框
- Diet/Note → `textarea` 多行文本框
- 提供「保存」与「取消」按钮

**序列化逻辑（基于 parser_rules.md）**：

将 JSON 数据重新转换为原始 TXT 格式，保证格式绝对一致：

```javascript
// 单日期块序列化
function stringifyDateEntry(entry) {
  const weather = stringifyWeather(entry.weather);
  const sleep = stringifySleep(entry.sleep);
  const diet = stringifyDiet(entry.diet);
  const exercise = `Exercise: ${entry.exercise || ''}`;
  const note = `Note: ${entry.note || ''}`;
  
  const lines = [entry.date, weather, sleep, diet, exercise, note];
  
  // 添加特殊标注行
  entry.specialNotes.forEach(sn => {
    lines.push(`[${sn.type}] ${sn.text}`);
  });
  
  return lines.join('\n');
}

// 完整文件序列化（日期块之间空行分隔）
function stringifyAll(entries) {
  return entries.map(stringifyDateEntry).join('\n\n');
}
```

**序列化格式保证**：
- ✅ 无多余空格
- ✅ 无多余换行
- ✅ 日期块之间恰好一个空行
- ✅ 字段之间恰好一个换行
- ✅ 标点符号使用中文（`：``、``（`）`）`
- ✅ 特殊标注作为独立行在 Note 之后

**API 写入规格**：

```
PUT https://api.github.com/repos/{owner}/{repo}/contents/{path}
Headers:
  Authorization: Bearer {token}
  Accept: application/vnd.github+json
Body:
{
  "message": "更新健康日志 - {日期}",
  "content": "Base64编码的新内容（使用 btoa() 编码）",
  "sha": "原文件SHA值（用于冲突检测）"
}
```

**SHA 锁机制**：
- 读取文件时保存返回的 `sha` 值
- 写入时必须携带该 `sha`，确保不会覆盖他人修改
- 若 SHA 不匹配，提示用户刷新后重试

---

## 3. 技术栈约束（Technical Stack）

### 3.1 核心技术选型

| 技术层 | 选型方案 | 理由 |
|-------|---------|------|
| **文件结构** | 单文件 H5（`index.html`） | 零构建依赖，即开即用 |
| **样式框架** | Tailwind CSS（CDN 引入） | 快速构建现代 UI，无需编写 CSS |
| **脚本语言** | 原生 JavaScript（ES6+） | 无框架依赖，降低复杂度 |
| **数据存储** | LocalStorage API | 浏览器原生支持，持久化配置 |
| **API 交互** | Fetch API | 现代浏览器原生支持 |
| **天气 API** | OpenWeatherMap 或同类免费天气服务 | 提供免费天气查询接口 |

### 3.2 外部依赖

```html
<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
```

**约束**：不引入任何 NPM 包、不使用构建工具（Webpack/Vite 等）。

---

## 4. 架构透视与教学准备

> **重要声明**：本章节标注了项目涉及的四个核心技术点，供后续教学解构使用。

### 4.1 核心技术点清单

| 序号 | 技术点 | 涉及模块 | 难度等级 |
|-----|-------|---------|---------|
| 1 | **GitHub API 鉴权** | 配置模块、读取模块、写入模块 | ⭐⭐⭐ |
| 2 | **Base64 编解码** | 读取模块、写入模块 | ⭐⭐ |
| 3 | **文本解析正则表达式** | 解析模块 | ⭐⭐⭐⭐ |
| 4 | **数据双向绑定** | UI 渲染模块、编辑模块 | ⭐⭐⭐ |
| 5 | **侧边栏动画与遮罩** | 新增卡片模块 | ⭐⭐ |
| 6 | **第三方天气 API 调用** | 配置模块、新增卡片模块 | ⭐⭐ |

### 4.2 技术点详解

#### 4.2.1 GitHub API 鉴权

**核心概念**：
- Personal Access Token（PAT）的创建与权限配置
- HTTP Header 中的 `Authorization: Bearer {token}` 设置
- API 请求频率限制与错误处理（401/403/404）

**教学重点**：
- 如何安全存储 Token（LocalStorage 的安全边界）
- API 响应状态码的含义与处理策略

#### 4.2.2 Base64 编解码

**核心概念**：
- GitHub API 返回的文件内容为 Base64 编码
- 写入时需将新内容编码为 Base64
- 浏览器原生 API：`btoa()` 与 `atob()`

**教学重点**：
- 字符编码问题（UTF-8 与 Base64 的转换）
- 中文内容的正确编解码处理

#### 4.2.3 文本解析正则表达式

**核心概念**：
- 使用正则表达式匹配日期块与字段
- 捕获组（Capturing Groups）提取数据
- 边界情况处理（缺失字段、格式异常）

**教学重点**：
- 正则表达式的设计思路与调试技巧
- 容错机制：如何优雅处理格式不规范的数据

#### 4.2.4 数据双向绑定

**核心概念**：
- JSON 数据模型 ↔ UI 卡片视图的同步
- 编辑状态管理与数据回填
- 无框架环境下实现响应式更新

**教学重点**：
- 数据驱动视图的设计模式
- 状态管理最佳实践

#### 4.2.5 侧边栏动画与遮罩

**核心概念**：
- CSS 过渡动画实现滑入滑出效果
- 半透明遮罩层实现模态交互
- 点击事件穿透与阻止冒泡

**教学重点**：
- 移动端友好的交互设计
- 无障碍访问与用户体验

#### 4.2.6 第三方天气 API 调用

**核心概念**：
- REST API 调用与响应解析
- 错误处理与降级方案（API 不可用时允许手动输入）
- 异步状态管理

**教学重点**：
- 异步编程与 Promise
- 加载状态与错误状态的 UI 反馈

---

## 5. 交付守则（CRITICAL RULE）

### 5.1 开发阶段边界

```
阶段一：需求确认（当前阶段）
   ↓
阶段二：功能实现（AI 执行）
   ↓
阶段三：功能完成 ✅ —— AI 停止代码编写
   ↓
阶段四：等待用户指令
   ↓
阶段五：解构教学（用户下达"解构教学"指令后执行）
```

### 5.2 强制性停止规则

**当以下条件全部满足时，AI 必须停止一切代码编写**：

1. ✅ 配置模块功能完整可用
2. ✅ 读取与解析模块功能完整可用
3. ✅ UI 渲染模块功能完整可用
4. ✅ 编辑与写入模块功能完整可用
5. ✅ 侧边栏与新增卡片功能完整可用
6. ✅ 所有核心功能经过基本验证

**停止后行为**：
- 输出完成报告
- 明确提示用户：「功能开发已完成，等待您的『解构教学』指令」
- **严禁**主动进行代码优化、重构或添加额外功能

---

## 6. 验收标准

### 6.1 功能验收

| 验收项 | 验收标准 |
|-------|---------|
| 配置存储 | 配置信息可保存至 LocalStorage，刷新页面后仍可读取 |
| 文件读取 | 可成功调用 GitHub API 并获取文件内容 |
| 内容解析 | TXT 内容可正确解析为 JSON 数据结构 |
| 卡片渲染 | 数据可正确渲染为可视化卡片，样式符合规格 |
| 编辑功能 | 点击编辑后可修改内容，取消后恢复原数据 |
| 文件写入 | 保存后可成功更新 GitHub 文件，SHA 校验正常 |
| 响应式设计 | 在手机（375px）和桌面（1440px）均有良好展示 |
| 侧边栏开关 | 点击菜单按钮打开侧边栏，点击遮罩或叉号关闭 |
| 新增卡片 | 侧边栏表单可正常填写并提交，添加新卡片到列表 |
| 日期验证 | 重复日期提交时显示错误提示，不重复创建 |
| 天气查询 | 配置邮编后可查询天气并自动填充表单 |
| 特殊标注添加 | 可通过按钮添加多个特殊标注 |

### 6.2 非功能验收

| 验收项 | 验收标准 |
|-------|---------|
| 文件数量 | 仅包含一个 `index.html` 文件 |
| 外部依赖 | 仅引入 Tailwind CSS CDN |
| 浏览器兼容 | 支持 Chrome/Firefox/Safari 最新版本 |
| 加载性能 | 首屏加载时间 < 2 秒（正常网络环境） |
| 动画流畅度 | 侧边栏滑入滑出动画无卡顿 |

---

## 7. 附录

### 7.1 参考文档

- [GitHub REST API - Repository Contents](https://docs.github.com/en/rest/repos/contents)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MDN - Base64 Encoding and Decoding](https://developer.mozilla.org/en-US/docs/Glossary/Base64)
- [OpenWeatherMap API](https://openweathermap.org/api)

### 7.2 术语表

| 术语 | 定义 |
|-----|------|
| H5 | HTML5 移动端网页应用 |
| SHA | Secure Hash Algorithm，此处指 Git 文件版本标识 |
| PAT | Personal Access Token，GitHub 个人访问令牌 |
| LocalStorage | 浏览器本地存储 API |
| 侧边栏/Sidebar | 从屏幕边缘滑出的抽屉式面板 |
| 遮罩/Overlay | 半透明背景层，用于模态交互 |

---

**文档结束**

> 本需求文档已锁定核心功能与技术边界。任何需求变更需经用户明确确认后方可执行。
