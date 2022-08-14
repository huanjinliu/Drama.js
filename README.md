# Drama.js

Drama.js 是一个用于开发算法可视化的工具库，其核心就是按照算法本身的代码实现逻辑构建可视化效果，强烈建议结合“fabricjs”canvas 库来进行可视元素的绘制。

### 开发使用说明

项目使用 pnpm 管理依赖，请勿使用 npm 或 yarn。

#### 1. 安装必要依赖`npm i pnpm -g`，使用`pnpm install`安装依赖

#### 2. 通过`npm start`，打开使用 Drama 开发的示例集合网页。

`npm start`实际上运行的是`npm run dev`，也就是`npm link && drama list`命令。`npm link` 是为了注册项目的命令行工具——drama，以便于后续开发。

这个命令行工具(v0.1.0)内有以下命令：

| 命令  | 参数   | 描述                              |
| ----- | ------ | --------------------------------- |
| list  | -      | 打开使用 Drama 开发的示例集合网页 |
| start | [name] | 开启特定示例服务                  |
| init | <name> | 初始新示例                  |

如：`drama start bubble-sort` —— 打开 example 文件夹下 bubble-sort 网站示例

#### 3. 直接进行 src 下的源码开发，或修改特定示例代码。由于使用了热更新，修改都会即时更新浏览器。
