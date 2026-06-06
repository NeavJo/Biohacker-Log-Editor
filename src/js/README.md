# JavaScript 模块说明

本文件夹包含 BioHacker Editor 项目的所有 JavaScript 模块，各模块功能如下：

| 文件名 | 功能说明 |
|--------|----------|
| [constants.js](constants.js) | 存放项目常量定义（存储键、配置、正则表达式等） |
| [storage.js](storage.js) | 本地存储管理模块（加载、保存配置及数据） |
| [toast.js](toast.js) | 通知提示模块（显示成功、错误等消息） |
| [api.js](api.js) | GitHub API 交互模块（获取、保存文件） |
| [weather-service.js](weather-service.js) | 天气服务模块（查询天气数据） |
| [parser.js](parser.js) | 解析器模块（解析文本数据为条目对象） |
| [stringifier.js](stringifier.js) | 字符串化模块（将条目对象转换为文本） |
| [renderer.js](renderer.js) | 渲染器模块（渲染卡片、分页等 UI） |
| [progress.js](progress.js) | 进度条模块（更新和淡出进度条） |
| [main.js](main.js) | 主入口文件（核心业务逻辑、初始化事件） |
| [console.js](console.js) | 控制台模块（提供命令行功能） |
| [mouse-effects.js](mouse-effects.js) | 鼠标光效模块（目前暂未启用） |

## 模块加载顺序

在 [index.html](../../index.html) 中的加载顺序必须遵循依赖关系：

1. `constants.js` - 无依赖
2. `storage.js` - 依赖 state 和 constants
3. `toast.js` - 无依赖
4. `api.js` - 依赖 storage、state、constants
5. `weather-service.js` - 依赖 toast
6. `parser.js` - 依赖 constants
7. `stringifier.js` - 无依赖
8. `renderer.js` - 依赖 parser、stringifier、api、storage、toast、state
9. `progress.js` - 无依赖
10. `main.js` - 依赖所有上述模块
11. `console.js` - 依赖 main.js 中的 state、toast、renderer、api
