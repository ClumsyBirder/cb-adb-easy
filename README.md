<div align="center" >
  <img src="docs/adbv-icon.png" width="200">
  <h1>
    ADB Easy v0.1.3 <img src="docs/Waving Hand Medium-Light Skin Tone.png" width="45px">
  </h1>
</div>


<p align="center" >
  <a href="">
      <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" height="25">
  </a>
  <a href="https://github.com/r0x0r/pywebview">
      <img src="https://img.shields.io/badge/PyWebview-E92063?logo=pydantic&logoColor=fff&style=for-the-badge" alt="Pywebview" height="25">
  </a>

</p>

> 缓慢开发功能...

一个用于管理和监控 Android 设备的桌面应用程序。


### 🎉 技术栈

- ⚡️ **React**
- 📚 **Shadcn/ui**
- 🚀 **Zustand**
- 🦾 **PyWebView**
- 🔐 **ADB**
- 🚚 **Python**

### 🎃 功能特性

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

- 日志功能
  - 系统日志查看
  - 应用日志查看

### 📚 演示图
<div align="center">
    <img src="/docs/20250106100144.png" alt="图片1" width="45%" style="margin-right: 10px;">
    <img src="/docs/20250123175824.png" alt="图片2" width="45%" style="margin-right: 10px;">
</div>
<div align="center">
    <img src="/docs/20250123180100.png" alt="图片1" width="45%" style="margin-right: 10px;">
    <img src="/docs/20250123180200.png" alt="图片2" width="45%" style="margin-right: 10px;">
</div>
<div align="center">
    <img src="/docs/20250123175908.png" alt="图片1" width="45%" style="margin-right: 10px;">
    <img src="/docs/20250123180023.png" alt="图片2" width="45%" style="margin-right: 10px;">
</div>


### ☕ 开发指南

#### 环境要求

- Node.js >= 16
- Python >= 3.8
- ADB 工具

#### 安装步骤

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
#### 开发命令

```bash
启动开发服务器
npm run dev
构建生产版本
npm run build
运行测试
npm run test

```
### 项目结构
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

### 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 许可证

[许可证类型] - 查看 [LICENSE](LICENSE) 文件了解更多详情

#### <img src="docs/Robot.png" width="25"> 作者介绍

    大家好，我是 wieszheng，一个乐于分享，喜欢钻研技术的测试开发工程师。

    一个打游戏不拿首胜不睡觉的酒0后。


#### <img src="docs/Heart on Fire.png" width="25"> 喜欢我？

<p align="center">
<a href="https://star-history.com/#ClumsyBirder/cb-adb-easy">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=ClumsyBirder/cb-adb-easy&type=Date&title=50&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=ClumsyBirder/cb-adb-easy&type=Date&title=50" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=ClumsyBirder/cb-adb-easy&type=Date" />
  </picture>
</a>
</p>

