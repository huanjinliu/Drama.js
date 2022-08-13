# Drama.js

  Drama.js是一个用于开发算法可视化的工具库，其核心就是按照算法本身的代码实现逻辑构建可视化效果，强烈建议结合“fabricjs”canvas库来进行可视元素的绘制。

### 开发使用说明

  项目使用pnpm管理依赖，请勿使用npm或yarn。

#### 1. 安装必要依赖`npm i pnpm -g`，使用`pnpm install`安装依赖

#### 2. 通过`npm start`，打开使用Drama开发的示例集合网页。

  `npm start`实际上运行的是`npm run dev`，也就是`npm link && drama list`命令。`npm link` 是为了注册项目的命令行工具——drama，以便于后续开发。

  这个命令行工具(v0.1.0)内只有两个命令：

  | 命令 | 参数  | 描述 |
  | ---- | ----  | ---- |
  | list | - | 打开使用Drama开发的示例集合网页 |
  | start | <name> | 开发特定示例网页 |

  如：`drama start bubble-sort` —— 打开example文件夹下bubble-sort网站示例

#### 3. 直接进行src下的源码开发，或修改特定示例代码。由于使用了热更新，修改都会即时更新浏览器。
  