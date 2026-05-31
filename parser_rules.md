# 健康日志解析规则文档

> 文档版本：v1.0  
> 分析对象：GitHub 健康日志文本  
> 创建日期：2026-05-31  
> 文档性质：Parser 开发指导手册

---

## 1. 文本结构深度分析

### 1.1 日期块识别

**实际格式观察**：

| 记录类型 | 实际格式 | 示例 |
|---------|---------|------|
| 模板（空记录） | `20xx.x.x` | `20xx.x.x` |
| 真实记录 | `yyyy.m.d` 或 `yyyy.mm.dd` | `2026.5.29`、`2026.5.30` |

**格式特征**：
- 使用**点号（`.`）** 作为分隔符，而非斜杠（`/`）或连字符（`-`）
- 月/日可为**单数字**（如 `5.29`）或**双数字**（如 `05.29`）
- 年份固定为四位数

**正则表达式定义**：

```regex
/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/
```

---

### 1.2 字段分隔机制

**字段结构**：每个日期块下包含 5 个固定字段，使用**关键词 + 冒号（`：`）** 作为前缀标识。

| 字段名 | 前缀 | 内容特征 | 多行支持 |
|-------|-----|---------|---------|
| `Weather` | `Weather:` | 温度范围 + 可选括号备注 | ❌ 单行 |
| `Sleep` | `Sleep:` | 入睡时间 + 睡着 + 苏醒时间 + 苏醒/闹钟 | ❌ 单行 |
| `Diet` | `Diet:` | 午饭：xxx、晚饭：xxx | ❌ 单行 |
| `Exercise` | `Exercise:` | 自由文本描述 | ❌ 单行 |
| `Note` | `Note:` | 自由文本 | ❌ 单行 |
| `[!]`/`[?]`/`[+]` | `[!]`/`[?]`/`[+]` | 特殊标注 | ✅ 多行 |

**关键发现**：
- 各字段之间通过**换行符**分隔
- `Diet` 字段内部使用**顿号（`、`）** 分隔午饭和晚饭
- `[!]`、`[?]`、`[+]` 特殊标注是独立字段，在卡片底部展示
- 每个特殊标注单独一行，以 `[!]`/`[?]`/`[+]` 开头

---

### 1.3 特殊标注系统

**三类特殊标注**：

| 标注 | 语义 | 示例 |
|-----|------|------|
| `[+]` | 有益事件/值得鼓励 | `[+] 14：00-16：13 睡了很舒服的午觉，状态满满` |
| `[?]` | 观察/恢复状态 | `[?] 10：40 今天周六，上午悠闲...` |
| `[!]` | 异常/转折/需注意 | `[!] 20:30 左手中指关节疼痛...` |

**标注格式规则**：
- 标注位于行首，中括号与内容之间有空格
- 时间格式：可使用 `HH:MM` 或 `HH：MM`（英文/中文冒号均可）
- 一行可包含多个标注（通过空格分隔）

---

### 1.4 空白与容错样本

**模板格式**（所有字段为空）：

```
20xx.x.x
Weather: ，-℃
Sleep: : 睡着，: 苏醒/闹钟
Diet: 午饭：、晚饭：
Exercise:
Note:
```

**观察到的容错场景**：
- `Weather` 温度值为逗号：`,-℃`
- `Sleep` 时间为空：`: 睡着，: 苏醒/闹钟`
- `Diet` 内容为空：`午饭：、晚饭：`
- `Exercise` 完全缺失值

---

## 2. 解析规则（Parsing Rules）

### 2.1 解析算法

**整体策略**：逐行遍历 + 状态机模式

```
原始文本
  ↓ 按换行符分割为行数组
[行1, 行2, 行3, ..., 行N]
  ↓ 遍历每一行
遇到日期行 → 创建新记录
遇到字段行 → 解析对应字段
遇到标注行 → 添加到 specialNotes
  ↓
标准 JSON 数组
```

---

### 2.2 核心实现

**日期识别**：

```javascript
const datePattern = /^(\d{4}\.\d{1,2}\.\d{1,2})$/;
```

**逐行解析逻辑**：

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
      currentEntry = createEmptyEntry(trimmed);
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

**关键点**：
- 使用 `text.split('\n')` 按换行符分割
- 跳过空行 `if (!trimmed) continue`
- 使用 `startsWith()` 识别字段前缀
- 特殊标注 `[!]/[?]/[+]` 独立处理，不隶属于 Note

---

### 2.3 子字段解析

#### 2.4.1 Weather 字段

**格式**：`温度描述，温度范围（可选括号备注）`

**正则**：

```javascript
const WEATHER_PATTERN = /^(.+?)，(\d+)-(\d+)℃(?:\s*（(.+?)）)?$/;
```

**JSON 输出**：

```json
{
  "description": "晴转雨",
  "tempLow": 24,
  "tempHigh": 35,
  "note": "上午晴，下午阵雨，晚上凉爽"
}
```

---

#### 2.4.2 Sleep 字段

**格式**：`入睡时间 睡着，清醒时间 苏醒/闹钟（或苏醒/自然醒）`

**正则**：

```javascript
const SLEEP_PATTERN = /^(\d{1,2}):(\d{2})\s*睡着，(\d{1,2}):(\d{2})\s*(苏醒|闹钟|自然醒)(?:\s*（(.+?)）)?$/;
```

**JSON 输出**：

```json
{
  "sleepTime": "0:00",
  "wakeTime": "7:58",
  "wakeType": "闹钟",
  "note": "睡眠质量高"
}
```

---

#### 2.4.3 Diet 字段

**格式**：`午饭：xxx、晚饭：xxx`

**正则**：

```javascript
const DIET_PATTERN = /^午饭：(.+?)、晚饭：(.*)$/;
```

**JSON 输出**：

```json
{
  "lunch": "常规",
  "dinner": "常规（青菜，鸡排，咖喱土豆）"
}
```

---

#### 2.4.4 Exercise 字段

**格式**：自由文本（可包含百分比描述）

**处理策略**：直接取值，不做子解析

---

#### 2.4.5 Note 字段

**格式**：自由文本，可包含 `[!]`、`[?]`、`[+]` 标注

**标注提取正则**：

```javascript
const SPECIAL_NOTES_PATTERN = /(\[[!\?\+]\]\s*[^\n]*)/g;
```

**JSON 输出**：

```json
{
  "general": "生理焦虑太频发了，找原因和解决办法本身亦会加剧……",
  "specialNotes": [
    { "type": "+", "text": "14：00-16：13 睡了很舒服的午觉，状态满满" },
    { "type": "?", "text": "10：40 今天周六，上午悠闲，预计午觉不会想睡，遂决定冲泡亚发咖啡半条" },
    { "type": "!", "text": "20:30 左手中指关节疼痛其实一直没完全好..." }
  ]
}
```

---

### 2.5 容错机制（Fallback Rules）

| 异常场景 | Fallback 行为 |
|---------|--------------|
| 字段完全缺失 | 返回空字符串 `""` |
| 字段值为空 | 返回空字符串 `""` |
| 日期格式不规范 | 跳过该记录，输出警告日志 |
| 温度值为 `,-℃` | 返回 `{description: "", tempLow: null, tempHigh: null, note: ""}` |
| Sleep 时间冒号为中文 `：` | 自动转换为英文 `:` 后再解析 |
| Note 中无特殊标注 | `specialNotes` 返回空数组 `[]` |

---

## 3. 逆向序列化规则（Stringify Rules）

### 3.1 序列化总流程

```
标准 JSON 数组
  ↓ 阶段一：格式化各字段为字符串
{...}
  ↓ 阶段二：拼接为单行字段
"Weather: ..."
  ↓ 阶段三：拼接为完整日期块
"2026.5.30\nWeather: ..."
  ↓ 阶段四：合并所有日期块
完整文本
```

---

### 3.2 各字段序列化规则

#### 3.2.1 Weather 序列化

```javascript
function stringifyWeather(weather) {
  let result = weather.description;

  if (weather.tempLow !== null && weather.tempHigh !== null) {
    result += `，${weather.tempLow}-${weather.tempHigh}℃`;
  }

  if (weather.note) {
    result += ` （${weather.note}）`;
  }

  return `Weather: ${result}`;
}
```

**示例**：

```javascript
// 输入
{ description: "多云", tempLow: 24, tempHigh: 32, note: "" }
// 输出
"Weather: 多云，24-32℃"
```

---

#### 3.2.2 Sleep 序列化

```javascript
function stringifySleep(sleep) {
  let result = `${sleep.sleepTime} 睡着，${sleep.wakeTime} ${sleep.wakeType}`;

  if (sleep.note) {
    result += `（${sleep.note}）`;
  }

  return `Sleep: ${result}`;
}
```

**示例**：

```javascript
// 输入
{ sleepTime: "1:10", wakeTime: "7:26", wakeType: "苏醒", note: "睡眠质量高" }
// 输出
"Sleep: 1:10 睡着，7:26 苏醒（睡眠质量高）"
```

---

#### 3.2.3 Diet 序列化

```javascript
function stringifyDiet(diet) {
  return `Diet: 午饭：${diet.lunch}、晚饭：${diet.dinner}`;
}
```

**示例**：

```javascript
// 输入
{ lunch: "常规", dinner: "菠萝鸡肉火腿炒饭+一颗鸡蛋" }
// 输出
"Diet: 午饭：常规、晚饭：菠萝鸡肉火腿炒饭+一颗鸡蛋"
```

---

#### 3.2.4 Exercise 序列化

```javascript
function stringifyExercise(exercise) {
  return `Exercise: ${exercise || ''}`;
}
```

---

#### 3.2.5 Note 序列化

```javascript
function stringifyNote(note) {
  // 先拼接特殊标注
  let specialText = note.specialNotes
    .map(n => `[${n.type}] ${n.text}`)
    .join('\n');

  // 如果有一般备注且有特殊标注，用空行分隔
  if (note.general && specialText) {
    return `Note: ${note.general}\n${specialText}`;
  } else if (specialText) {
    return `Note: ${specialText}`;
  } else {
    return `Note: ${note.general || ''}`;
  }
}
```

**示例**：

```javascript
// 输入
{
  general: "生理焦虑太频发了，找原因和解决办法本身亦会加剧……",
  specialNotes: [
    { type: "?", text: "10：40 今天周六..." },
    { type: "!", text: "20:30 左手中指关节疼痛..." }
  ]
}
// 输出
"Note: 生理焦虑太频发了，找原因和解决办法本身亦会加剧……\n[?] 10：40 今天周六...\n[!] 20:30 左手中指关节疼痛..."
```

---

### 3.3 完整日期块序列化

```javascript
function stringifyDateEntry(entry) {
  const lines = [
    entry.date,
    stringifyWeather(entry.weather),
    stringifySleep(entry.sleep),
    stringifyDiet(entry.diet),
    stringifyExercise(entry.exercise),
    stringifyNote(entry.note)
  ];

  return lines.join('\n');
}
```

---

### 3.4 完整文件序列化

```javascript
function stringifyAll(entries) {
  return entries
    .map(entry => stringifyDateEntry(entry))
    .join('\n\n');  // 日期块之间以空行分隔
}
```

**格式保证**：
- ✅ 无多余空格
- ✅ 无多余换行
- ✅ 日期块之间恰好一个空行
- ✅ 字段之间恰好一个换行
- ✅ 标点符号使用中文（`：``、``（`）`）`

---

## 4. UI 设计优化建议

### 4.1 当前记录习惯分析

**字数统计**：

| 字段 | 平均字数 | 最长字数 | 记录特点 |
|-----|---------|---------|---------|
| Weather | 15-25 | ~35（含括号备注） | 简短，通常不超过一行 |
| Sleep | 20-40 | ~60（含睡眠质量备注） | 固定格式，字数稳定 |
| Diet | 20-50 | ~80（含食物详细描述） | 相对较长，有食物清单 |
| Exercise | 5-15 | ~30 | 通常很短 |
| Note | 50-150 | ~200（含多条特殊标注） | 自由文本，可能很长 |

---

### 4.2 卡片 UI 设计规范

#### 4.2.1 整体布局

```
┌─────────────────────────────────────────────┐
│  📅 日期：2026.5.30              [编辑] [保存]│
├─────────────────────────────────────────────┤
│                                             │
│  🌤️ Weather                                 │
│  ┌─────────────────────────────────────┐    │
│  │ 多云，24-32℃                        │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  😴 Sleep                                   │
│  ┌─────────────────────────────────────┐    │
│  │ 1:10 睡着 → 7:26 苏醒                │    │
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
│  │                                     │    │
│  │ [+] 14:00-16:13 睡了舒服的午觉       │    │
│  │ [?] 10:40 决定冲泡亚发咖啡半条        │    │
│  │ [!] 20:30 左手中指关节疼痛...         │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

#### 4.2.2 字号与间距规范

| 元素 | 字号 | 字重 | 说明 |
|-----|------|-----|------|
| 日期标题 | 20px | bold | 醒目但不抢占视觉焦点 |
| 字段标签 | 14px | medium | 固定标签样式 |
| 正文内容 | 16px | regular | 确保可读性 |
| 特殊标注 | 14px | regular | 与正文区分 |
| 编辑按钮 | 14px | medium | 次要操作 |

| 间距 | 值 | 说明 |
|-----|---|------|
| 卡片内边距 | 20px | 保证内容不贴边 |
| 字段间距 | 16px | 分组清晰 |
| 卡片间距 | 24px | 多卡片时不拥挤 |
| 圆角 | 12px | 现代柔和感 |

---

#### 4.2.3 输入组件选择

| 字段 | 编辑模式组件 | 理由 |
|-----|-------------|------|
| Weather | 单行输入框 `input` | 内容简短，无需换行 |
| Sleep | 单行输入框 `input` | 固定格式，解析/序列化简单 |
| Diet | **多行文本框 `textarea`** | 午饭/晚饭可能较长，换行展示更清晰 |
| Exercise | 单行输入框 `input` | 通常很短 |
| Note | **多行文本框 `textarea`** | 自由文本，可能很长，含特殊标注 |

**关键优化**：`Diet` 和 `Note` 使用 `textarea` 是因为这两个字段最可能出现长文本。

---

#### 4.2.4 特殊标注展示优化

**建议方案**：将 `[+]`、`[?]`、`[!]` 渲染为彩色标签

```html
<!-- 展示态 -->
<div class="note-content">
  <p>生理焦虑太频发了...</p>
  <span class="tag tag-positive">[+] 午觉舒服</span>
  <span class="tag tag-observation">[?] 喝了咖啡</span>
  <span class="tag tag-warning">[!] 关节疼痛</span>
</div>

<!-- 编辑态 -->
<!-- Note textarea 保持原始文本格式，用户自行添加标注 -->
```

**标签样式建议**：

| 标注 | 颜色 | 背景色 | 使用场景 |
|-----|------|-------|---------|
| `[+]` | 绿色 | `bg-green-100 text-green-800` | 有益事件 |
| `[?]` | 蓝色 | `bg-blue-100 text-blue-800` | 观察/恢复 |
| `[!]` | 红色 | `bg-red-100 text-red-800` | 异常/警告 |

---

#### 4.2.5 响应式断点

| 设备 | 屏幕宽度 | 布局 |
|-----|---------|------|
| 手机 | < 640px | 单列，卡片宽度 100% |
| 平板 | 640px - 1024px | 双列网格 |
| 桌面 | > 1024px | 三列网格或单列居中（最大宽度 800px） |

---

### 4.3 交互反馈设计

| 交互 | 视觉反馈 |
|-----|---------|
| 点击编辑 | 按钮变为「保存」「取消」，输入框启用 |
| 保存成功 | Toast 提示「已保存到 GitHub」 |
| 保存失败 | 红色 Toast，显示错误原因 |
| 加载中 | 骨架屏或中央加载动画 |
| 网络断开 | 顶部横幅提示「网络已断开」 |

---

## 5. 正则表达式速查表

| 用途 | 正则表达式 | 标志 |
|-----|-----------|------|
| 匹配日期块 | `/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/` | m |
| 匹配日期块内容 | `/^(\d{4}\.\d{1,2}\.\d{1,2})\n([\s\S]*?)(?=\n\d{4}\.\d{1,2}\.\d{1,2}\|$)/` | gm |
| Weather 解析 | `/^(.+?)，(\d+)-(\d+)℃(?:\s*（(.+?)）)?$/` | - |
| Sleep 解析 | `/^(\d{1,2}):(\d{2})\s*睡着，(\d{1,2}):(\d{2})\s*(苏醒\|闹钟\|自然醒)(?:\s*（(.+?)）)?$/` | - |
| Diet 解析 | `/^午饭：(.+?)、晚饭：(.*)$/` | - |
| 特殊标注 | `/(\[[!\?\+]\]\s*[^\n]*)/g` | g |

---

**文档结束**

> 本文档定义了健康日志解析器的完整规则，是 `parser.js` 开发的唯一参考依据。
