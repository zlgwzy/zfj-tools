---
name: release-workflow
description: 发布新版本的流程：更新日志→README→打标签推送
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 59b4906f-316d-409a-82e8-efc7dcf23a8e
---

用户说「发布新版本」时，执行以下操作：

1. **查看变更**：`git log 上个标签..HEAD --oneline` 列出所有提交
2. **更新更新日志**：编辑 `public/changelog/zfj-tools-changelog.md`，在顶部新增版本条目，按「新功能」「功能优化」「问题修复」分类
3. **更新 README**：编辑 `README.md`，更新功能特性描述和版本历史
4. **提交**：commit 信息 `chore: 发布 vX.Y.Z`
5. **打标签**：`git tag vX.Y.Z`
6. **推送**：`git push && git push origin vX.Y.Z`

**Why:** 统一发布流程，避免遗漏文件更新。

**How to apply:** 用户每次说「发布新版本」或「打新版」时，按此流程操作。
