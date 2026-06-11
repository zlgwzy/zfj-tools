<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { marked } from 'marked'
import { ElMessage } from 'element-plus'

const changelogContent = ref('')
const loading = ref(true)
const error = ref(false)

const refreshPage = () => {
  window.location.reload()
}

onMounted(async () => {
  try {
    loading.value = true
    error.value = false
    const response = await axios.get('/changelog/zfj-tools-changelog.md')
    const sections = response.data.split(/\n---\n/)
    // 最新版本默认展开，其余版本折叠
    const firstSection = marked(sections[0]) as string
    const restSections = sections.slice(1).map((section: string) => {
      const html = marked(section) as string
      const h2Match = html.match(/<h2[^>]*>.*?<\/h2>/)
      if (h2Match) {
        const summary = h2Match[0]
        const content = html.replace(h2Match[0], '')
        return `<details class="changelog-version"><summary>${summary}</summary>${content}</details>`
      }
      return `<details class="changelog-version"><summary>历史版本</summary>${html}</details>`
    }).join('')
    changelogContent.value = firstSection + restSections
  } catch (err) {
    error.value = true
    ElMessage.error('加载更新日志失败，请稍后重试')
    console.error('加载更新日志失败:', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="changelog-container">
    <el-card class="changelog-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <h2><el-icon><Document /> </el-icon> 更新日志</h2>
        </div>
      </template>
      
      <div v-if="!loading && !error" class="changelog-content markdown-body" v-html="changelogContent">
      </div>
      
      <div v-if="error" class="error-container">
        <el-empty 
          description="加载失败" 
          :image-size="200">
          <template #description>
            <p>更新日志加载失败，请刷新页面重试</p>
          </template>
          <el-button type="primary" @click="refreshPage">
            刷新页面
          </el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.changelog-container {
  max-width: 950px;
  margin: 0 auto;
  padding: 20px;
  animation: fade-in 0.3s ease-in-out;
  position: relative;
}

.changelog-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, 
    rgba(var(--el-color-primary-rgb), 0) 0%,
    rgba(var(--el-color-primary-rgb), 1) 50%,
    rgba(var(--el-color-primary-rgb), 0) 100%
  );
  animation: glow 2s infinite;
}

@keyframes glow {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.changelog-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  background: linear-gradient(145deg, var(--el-bg-color), var(--el-bg-color-overlay));
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.changelog-card:hover {
  box-shadow: 0 8px 24px rgba(var(--el-color-primary-rgb), 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(90deg, 
    rgba(var(--el-color-primary-rgb), 0.05),
    rgba(var(--el-color-primary-rgb), 0.02)
  );
  border-bottom: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
}

.card-header h2 {
  margin: 0;
  font-size: 22px;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.card-header h2 .el-icon {
  font-size: 1.2em;
  color: var(--el-color-primary);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.changelog-card :deep(.el-card__body) {
  padding: 28px;
  overflow-x: hidden;
}

.changelog-content {
  position: relative;
  overflow-x: hidden;
}

.changelog-version {
  margin-top: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.changelog-version:hover {
  border-color: rgba(var(--el-color-primary-rgb), 0.3);
}

.changelog-version summary {
  cursor: pointer;
  padding: 8px 16px;
  background: rgba(var(--el-color-primary-rgb), 0.03);
  font-weight: 600;
  font-size: 1.1em;
  user-select: none;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.changelog-version summary::-webkit-details-marker {
  display: none;
}

.changelog-version summary::before {
  content: '▶';
  font-size: 12px;
  transition: transform 0.2s ease;
  color: var(--el-color-primary);
}

.changelog-version[open] summary::before {
  transform: rotate(90deg);
}

.changelog-version summary:hover {
  background: rgba(var(--el-color-primary-rgb), 0.06);
}

.changelog-version[open] summary {
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.changelog-version > :not(summary) {
  padding: 8px 16px;
}

.error-container {
  padding: 40px 0;
}

:deep(.markdown-body) {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  text-align: left;
  width: 100%;
  position: relative;
}

:deep(.markdown-body h1) {
  font-size: 2em;
  margin: 0.67em 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 0.3em;
}

:deep(.markdown-body h2) {
  font-size: 1.8em;
  margin-top: 32px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  padding-bottom: 0.5em;
  border-bottom: 2px solid rgba(var(--el-color-primary-rgb), 0.1);
  background: linear-gradient(90deg, 
    var(--el-color-primary) 0%,
    var(--el-text-color-primary) 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: slide-in 0.5s ease-out;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

:deep(.markdown-body h3) {
  font-size: 1.25em;
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

:deep(.markdown-body p) {
  text-indent: 2em;
  line-height: 1.8;
}

:deep(.markdown-body ul) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

:deep(.markdown-body li) {
  margin: 0.25em 0;
}

:deep(.markdown-body a) {
  color: var(--el-color-primary);
  text-decoration: none;
}

:deep(.markdown-body a:hover) {
  text-decoration: underline;
}

:deep(.markdown-body code) {
  background: rgba(var(--el-color-primary-rgb), 0.1);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  transition: all 0.3s ease;
}

:deep(.markdown-body code:hover) {
  background: rgba(var(--el-color-primary-rgb), 0.15);
}

:deep(.markdown-body pre code) {
  background: var(--el-bg-color-overlay);
  padding: 20px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.45;
  overflow-x: auto;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

:deep(.markdown-body ol) {
  padding-left: 1.5em;
  margin-top: 0;
  margin-bottom: 16px;
  list-style-position: inside;
  counter-reset: item;
}

:deep(.markdown-body ol li) {
  display: list-item;
  padding-left: 0;
  margin: 0.5em 0;
  text-align: left;
  position: relative;
  animation: fade-slide-in 0.5s ease-out;
  animation-fill-mode: both;
}

:deep(.markdown-body ol li:nth-child(1)) { animation-delay: 0.1s; }
:deep(.markdown-body ol li:nth-child(2)) { animation-delay: 0.2s; }
:deep(.markdown-body ol li:nth-child(3)) { animation-delay: 0.3s; }
:deep(.markdown-body ol li:nth-child(4)) { animation-delay: 0.4s; }
:deep(.markdown-body ol li:nth-child(5)) { animation-delay: 0.5s; }

@keyframes fade-slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media screen and (max-width: 768px) {
  .changelog-container {
    padding: 10px;
  }

  .changelog-card :deep(.el-card__body) {
    padding: 16px;
  }
  
  :deep(.markdown-body) {
    font-size: 14px;
  }
}
</style> 