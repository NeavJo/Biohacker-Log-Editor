# CSS 样式文件说明

本目录包含 BioHacker-Editor 项目的所有 CSS 样式文件，各文件功能如下：

| 文件名 | 功能说明 |
|--------|----------|
| [base.css](base.css) | 基础样式（字体、body、通用占位符样式） |
| [status-bar.css](status-bar.css) | 顶部状态栏样式 |
| [card.css](card.css) | 卡片及卡片内容样式 |
| [buttons.css](buttons.css) | 所有按钮样式 |
| [modals.css](modals.css) | 弹窗样式（设置面板、删除确认） |
| [notifications.css](notifications.css) | 通知栏样式 |
| [animations.css](animations.css) | 动画效果、翻页按钮、控制台、响应式媒体查询 |

## 文件加载顺序

在 `index.html` 中的加载顺序必须遵循以下顺序：

1. base.css - 基础样式
2. status-bar.css - 顶部栏样式
3. card.css - 卡片样式
4. buttons.css - 按钮样式
5. modals.css - 弹窗样式
6. notifications.css - 通知栏样式
7. animations.css - 动画及其他样式
