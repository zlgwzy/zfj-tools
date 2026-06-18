<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const content = ref('')
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    loading.value = true
    const resp = await fetch('/docs/图片处理功能使用说明.md')
    content.value = await resp.text()
  } catch {
    error.value = true
    ElMessage.error('加载操作指南失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="usage-guide-container">
    <el-card class="guide-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <h2><el-icon><Reading /></el-icon> 操作指南</h2>
        </div>
      </template>
      <div v-if="!loading && !error" class="guide-content markdown-body">
        <div v-for="(section, idx) in content.split('---').filter(s => s.trim())" :key="idx" class="guide-section">
          <div class="section-text" v-html="renderSection(section)"></div>
        </div>
      </div>
      <div v-if="error" class="error-container">
        <el-empty description="加载失败" />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts">
// 简单 markdown 渲染（标题、列表、加粗、换行）
function renderSection(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  return `<p>${html}</p>`
}
</script>

<style scoped>
.usage-guide-container {
  max-width: 950px;
  margin: 0 auto;
  padding: 20px;
}

.guide-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header h2 {
  margin: 0;
  font-size: 22px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-primary);
}

.guide-content {
  padding: 8px 0;
}

.guide-section {
  margin-bottom: 24px;
}

.section-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--el-text-color-primary);
}

.section-text h2 {
  font-size: 1.6em;
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(var(--el-color-primary-rgb), 0.1);
  color: var(--el-color-primary);
}

.section-text h3 {
  font-size: 1.2em;
  margin: 20px 0 12px;
  color: var(--el-text-color-primary);
}

.section-text p {
  margin: 8px 0;
  text-indent: 2em;
}

.section-text li {
  margin: 4px 0;
  list-style: none;
}

.section-text blockquote {
  margin: 12px 0;
  padding: 12px 16px;
  background: rgba(var(--el-color-primary-rgb), 0.05);
  border-left: 3px solid var(--el-color-primary);
  border-radius: 4px;
}

.section-text blockquote p {
  text-indent: 0;
  margin: 0;
}

.section-text strong {
  color: var(--el-color-primary);
}

.error-container {
  padding: 40px 0;
}
</style>
