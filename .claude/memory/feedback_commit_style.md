---
name: commit-style-chinese
description: 代码修改时自动按规范提交 git，提交信息使用中文
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 2a591802-292a-44a7-9206-725f2503784b
---

对当前项目（zfj-tools）进行代码功能修改时，应自动按 Conventional Commits 规范提交 git，且提交信息使用中文。

提交信息格式：
- `feat: 添加XX功能`
- `fix: 修复XX问题`
- `refactor: 重构XX模块`
- `style: 调整XX样式`
- `chore: 更新依赖`

**Why:** 用户使用中文环境，希望提交历史清晰可读，且遵循规范的提交格式便于追溯。

**How to apply:** 每次修改代码功能后，自动执行 `git add` + `git commit`，无需等待用户指令。提交信息用中文描述改动内容。
