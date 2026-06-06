# Sidebar 功能分析

## 一、作用概述

Sidebar（侧边栏）（已被废弃）是 BioHacker_Editor 应用中用于**添加新健康日志记录**的核心交互组件。当用户点击顶栏的"点击此处添加记录"按钮时，侧边栏会从左侧滑入，提供完整的表单界面供用户输入健康数据。

## 二、功能模块

### 2.1 显示与隐藏

- **触发方式**：点击顶栏的"点击此处添加记录"按钮
- **动画效果**：侧边栏从左侧滑入，带有淡入过渡动画
- **关闭方式**：点击关闭按钮、点击遮罩层、表单提交成功后自动关闭

### 2.2 表单字段

| 字段类别 | 输入项 | 说明 |
|---------|--------|------|
| **日期** | entryDate | 自动填充当前日期，格式为 yyyy.m.d |
| **天气** | weatherDesc, weatherTempLow, weatherTempHigh | 天气描述、最低温、最高温 |
| **睡眠** | sleepHour, sleepMin, wakeHour, wakeMin, sleepNote | 入睡时间、醒来时间、备注 |
| **饮食** | dietBreakfast, dietLunch, dietDinner | 早饭、午饭、晚饭 |
| **运动** | exercise | 运动记录 |
| **备注** | note | 自由备注内容 |
| **特殊标注** | specialNoteText | 可添加鼓励[+]、观察[?]、问题[!]三种类型 |

### 2.3 核心功能

#### 1. 天气查询
- 调用 Open-Meteo API 查询天气
- 需要先在设置中配置所在城市
- 自动填充天气描述和温度信息

#### 2. 睡眠类型选择
- 支持两种类型：苏醒（自然醒）、闹钟
- 通过按钮切换，带有视觉反馈

#### 3. 特殊标注管理
- 三种标注类型：
  - `[+]` 鼓励 - 用于记录积极事项
  - `[?]` 观察 - 用于记录需要关注的事项
  - `[!]` 问题 - 用于记录需要解决的问题
- 支持添加和删除标注

#### 4. 表单验证
- 日期格式验证（必须为 yyyy.m.d 格式）
- 日期唯一性检查（避免重复记录）
- 空日期检查

#### 5. 数据提交
- 将表单数据构造成标准日志条目
- 通过 GitHub API 保存到仓库
- 提交成功后刷新卡片列表

## 三、实现机制

### 3.1 UI 结构

```
sidebarWrapper（容器）
├── sidebar-lemon-bg（柠檬背景图）
└── sidebar（内容区）
    ├── sidebar-header（标题+关闭按钮）
    └── sidebar-form（表单区域）
```

### 3.2 核心类：SidebarManager

| 方法 | 功能说明 |
|------|----------|
| `open()` | 打开侧边栏，初始化表单 |
| `close()` | 关闭侧边栏 |
| `initForm()` | 重置表单字段，填充当前日期 |
| `updateWakeTypeButtons()` | 更新睡眠类型按钮状态 |
| `renderSpecialNotesList()` | 渲染特殊标注列表 |
| `addSpecialNote(type)` | 添加特殊标注 |
| `queryWeather()` | 查询天气并填充 |
| `validateDate(date)` | 检查日期是否已存在 |
| `handleSubmit()` | 处理表单提交 |

### 3.3 数据流转

1. 用户填写表单 → 点击提交
2. `handleSubmit()` 收集表单数据 → 构造成 entry 对象
3. 添加到 `state.entries` 数组
4. `Stringifier.stringifyAll()` 转换为文本格式
5. `Api.putFile()` 上传到 GitHub
6. 更新 SHA 值 → 刷新卡片显示

### 3.4 相关事件绑定

| 事件源 | 处理函数 | 功能 |
|--------|----------|------|
| addRecordBtn | sidebarManager.open() | 打开侧边栏 |
| closeSidebarBtn | sidebarManager.close() | 关闭侧边栏 |
| sidebarOverlay | sidebarManager.close() | 点击遮罩关闭 |
| wakeTypeAwake | 设置 wakeType = '苏醒' | 切换睡眠类型 |
| wakeTypeAlarm | 设置 wakeType = '闹钟' | 切换睡眠类型 |
| addSpecialPlus | addSpecialNote('+') | 添加鼓励标注 |
| addSpecialQuestion | addSpecialNote('?') | 添加观察标注 |
| addSpecialExclamation | addSpecialNote('!') | 添加问题标注 |
| addEntryForm | handleSubmit() | 提交表单 |
| queryWeatherBtn | queryWeather() | 查询天气 |

## 四、样式特性

- **定位**：固定定位，垂直居中，初始位于屏幕左侧外部
- **背景**：使用柠檬主题背景图，配合透明玻璃效果
- **动画**：CSS transition 实现平滑滑入/滑出
- **响应式**：支持移动端自适应布局

## 五、依赖关系

- **Renderer**：用于刷新卡片列表
- **Stringifier**：用于将条目转换为文本格式
- **WeatherService**：用于天气查询
- **Api**：用于与 GitHub API 交互
- **Storage**：用于保存文件 SHA 值

## 六、状态管理

Sidebar 相关的状态存储在全局 `state` 对象中：

```javascript
state = {
  wakeType: '苏醒',           // 当前选择的睡眠类型
  formSpecialNotes: [],        // 当前表单的特殊标注列表
  postalCode: '',             // 用于天气查询的城市信息
  // ... 其他状态
}
```
