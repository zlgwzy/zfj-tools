---
name: git-workflow
description: 项目 Git 提交和推送工作流规则
metadata: 
  node_type: memory
  type: feedback
  originSessionId: cbd260f8-cfe0-4a92-bd0b-f7e68e79d79b
---

每次改动单独提交到本地，不推送远端。由用户决定何时合并提交、何时推送。

- 提交：每次改动独立 `git commit`，不做 amend 或自动合并
- 推送：不执行 `git push`，由用户手动发起
- 合并：用户说「合并」时再 squash 整理
- 标签：不打 tag，除非用户明确要求
