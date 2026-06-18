<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const meetingName = ref('')
const meetingDate = ref(new Date().toISOString().slice(0, 10))
const pageCount = ref(1)
const isExporting = ref(false)

const ROWS_PER_PAGE = 20

const pages = computed(() => {
  const pgs = []
  for (let p = 0; p < pageCount.value; p++) {
    const start = p * ROWS_PER_PAGE + 1
    const end = start + ROWS_PER_PAGE
    const rows = []
    for (let i = start; i < end; i++) rows.push(i)
    pgs.push(rows)
  }
  return pgs
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const exportPDF = async () => {
  if (!meetingName.value) {
    ElMessage.warning('请填写会议名称')
    return
  }
  isExporting.value = true
  await nextTick()
  try {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pw = pdf.internal.pageSize.getWidth()

    const papers = document.querySelectorAll('.a4-paper') as NodeListOf<HTMLElement>
    const html2canvas = (await import('html2canvas')).default

    for (let i = 0; i < papers.length; i++) {
      if (i > 0) pdf.addPage()

      // 临时调整（导出时不带边框和预览宽度）
      const origMaxW = papers[i].style.maxWidth
      const origBorder = papers[i].style.border
      papers[i].style.maxWidth = '794px'
      papers[i].style.width = '794px'
      papers[i].style.border = 'none'

      const canvas = await html2canvas(papers[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      // 恢复预览样式
      papers[i].style.maxWidth = origMaxW || ''
      papers[i].style.width = ''
      papers[i].style.border = origBorder || ''

      const imgW = pw
      const imgH = (canvas.height * imgW) / canvas.width
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgW, imgH)
    }

    pdf.save(`签到册_${meetingName.value}.pdf`)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error(e)
    ElMessage.error('导出失败')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="signin-wrapper">
    <el-card class="signin-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>签到册生成</span>
        </div>
      </template>

      <!-- 设置区域 -->
      <div class="toolbar">
        <div class="toolbar-row">
          <span class="toolbar-label">会议名称</span>
          <el-input v-model="meetingName" placeholder="请输入会议名称" />
        </div>
        <div class="toolbar-row">
          <span class="toolbar-label">会议时间</span>
          <el-date-picker v-model="meetingDate" type="date" placeholder="选择日期" style="width:200px" />
        </div>
        <div class="toolbar-row">
          <span class="toolbar-label">页数</span>
          <el-input-number v-model="pageCount" :min="1" :max="10" size="default" style="width:120px" />
          <el-button type="primary" @click="exportPDF" :loading="isExporting" style="margin-left:auto;">
            <el-icon><Download /></el-icon> 导出PDF
          </el-button>
        </div>
      </div>

      <!-- A4 纸张预览 -->
      <div class="preview-area">
        <div class="preview-label">A4 打印预览</div>
        <div class="pages-container">
          <div v-for="(pg, pi) in pages" :key="pi" class="page-wrap">
            <div class="page-number">第 {{ pi + 1 }} / {{ pages.length }} 页</div>
            <div class="a4-paper">
              <div class="paper-title">签 到 册</div>
              <div class="paper-info">
                <div class="paper-info-row">
                  <span class="paper-info-label">会议名称：</span>
                  <span class="paper-info-line">{{ meetingName }}</span>
                </div>
                <div class="paper-info-row">
                  <span class="paper-info-label">会议时间：</span>
                  <span class="paper-info-line">{{ formatDate(meetingDate) }}</span>
                </div>
              </div>
              <table class="paper-table">
                <thead>
                  <tr>
                    <th style="width:36px">序号</th>
                    <th style="width:20%">单位</th>
                    <th style="width:20%">姓名</th>
                    <th style="width:20%">职务</th>
                    <th style="width:20%">联系电话</th>
                    <th style="width:20%">备注</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="num in pg" :key="num">
                    <td class="cell-seq">{{ num }}</td>
                    <td></td><td></td><td></td><td></td><td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.signin-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.signin-card {
  border-radius: 12px;
}

.card-header {
  font-size: 18px;
  font-weight: 500;
}

/* 工具栏 */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  padding: 16px 18px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-row .el-input {
  flex: 1;
}

.toolbar-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  min-width: 64px;
}

/* 预览区 */
.preview-area {
  margin-bottom: 8px;
}

.preview-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}

.pages-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* A4 纸张 */
.page-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.a4-paper {
  width: 100%;
  max-width: 720px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  padding: 52px 48px 24px;
}

.paper-title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #000;
  margin: 0 0 16px;
  letter-spacing: 10px;
}

/* 信息 */
.paper-info {
  margin-bottom: 14px;
  font-size: 18px;
  line-height: 2.2;
}

.paper-info-row {
  display: flex;
  align-items: center;
}

.paper-info-label {
  font-weight: 500;
  color: #000;
  flex-shrink: 0;
  white-space: nowrap;
}

.paper-info-line {
  color: #000;
  flex: 1;
  padding: 0 6px;
  min-height: 20px;
  border-bottom: 1px solid #000;
}

/* 表格 */
.paper-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 17px;
}

.paper-table th,
.paper-table td {
  border: 1px solid #444;
  padding: 6px 8px;
}

.paper-table th {
  background: #f2f2f2;
  font-weight: 600;
  font-size: 17px;
  text-align: center;
  color: #000;
  padding: 8px 6px;
}

.paper-table td {
  height: 34px;
}

.cell-seq {
  text-align: center;
  color: #000;
  font-size: 16px;
}

/* 分页 */
.page-number {
  font-size: 13px;
  color: #c0c4cc;
  text-align: center;
  margin-bottom: 4px;
  letter-spacing: 1px;
}

/* 响应式 */
@media (max-width: 780px) {
  .a4-paper {
    padding: 28px 20px 16px;
  }
  .toolbar-item {
    flex: 1;
    min-width: 150px;
  }
  .toolbar-input {
    width: 100%;
  }
  .toolbar-action {
    margin-left: 0;
    width: 100%;
  }
}
</style>
