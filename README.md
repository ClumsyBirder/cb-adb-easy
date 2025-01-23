# Android Device Manager

一个用于管理和监控 Android 设备的桌面应用程序。

## 功能特性

- 设备管理
  - 多设备连接和切换
  - 设备基本信息显示
  - 设备状态实时监控

- 文件管理
  - 文件系统浏览
  - 文件上传/下载
  - 文件操作（复制、移动、删除等）

- 应用管理
  - 应用列表显示
  - 系统/非系统应用过滤
  - 应用搜索功能
  - 应用详细信息查看

- 进程管理
  - 进程列表显示
  - 进程状态监控
  - 进程操作（结束等）

- 性能监控
  - 内存使用实时监控
    - Java Heap
    - Native Heap
    - Code
    - Stack
    - Graphics
    - Private Other
    - System
    - Total PSS
  - 可配置的数据采集间隔
  - 图表可视化展示

- 终端功能
  - 命令行交互
  - ADB 命令执行

- 备份功能
  - 应用数据备份
  - 系统设置备份

- 日志功能
  - 系统日志查看
  - 应用日志查看

- 网页调试
  - WebView 调试
  - 网页检查器

## 技术栈

- Frontend:
  - React
  - TypeScript
  - Zustand (状态管理)
  - Recharts (图表库)
  - Tailwind CSS (样式)
  - Shadcn/ui (UI组件)

- Backend:
  - Python
  - PyWebView
  - ADB

## 开发指南

### 环境要求

- Node.js >= 16
- Python >= 3.8
- ADB 工具

### 安装步骤

1. 克隆仓库

```bash
  git clone [repository-url]
  cd android-device-manager
```
2. 安装前端依赖
```bash
npm install
或
yarn install
```
3. 安装后端依赖

```bash
pip install -r requirements.txt
```
### 开发命令

```bash
启动开发服务器
npm run dev
构建生产版本
npm run build
运行测试
npm run test

```
## 项目结构
```
src/
├── components/ # React 组件
│ ├── apps-tab.tsx # 应用管理标签页
│ ├── performance-tab.tsx # 性能监控标签页
│ └── ...
├── store/ # 状态管理
│ ├── apps-store.ts # 应用状态管理
│ ├── performance-store.ts # 性能监控状态管理
│ └── ...
└── ...

```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 许可证

[许可证类型] - 查看 [LICENSE](LICENSE) 文件了解更多详情

## 联系方式

[项目维护者联系信息]