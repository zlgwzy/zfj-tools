# 执法局工具箱

一个基于 Vue 3 + TypeScript + Vite 开发的执法局工作工具箱，提供图片处理、文档处理等功能。

## 功能特性

- 工作照片拼接（四宫格/六宫格）
- 绵竹地图
- 更多功能开发中...

## 技术栈

- Vue 3.4
- TypeScript
- Vite
- Element Plus
- Pinia

## 开发环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 项目结构

```
src/
  ├── assets/        # 静态资源
  ├── components/    # 组件
  ├── stores/        # Pinia 状态管理
  ├── types/         # TypeScript 类型定义
  ├── workers/       # Web Workers
  ├── App.vue        # 根组件
  └── main.ts        # 入口文件
```

## 版本历史

- 2025-05-07: 移除授权管理功能，优化代码结构
- 2025-05-06: 初始版本发布
