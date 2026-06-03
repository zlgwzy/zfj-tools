<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const imageUrl = ref('')
const fileName = ref('')
const fileSize = ref(0)
const compressedUrl = ref('')
const compressedSize = ref(0)
const isProcessing = ref(false)

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1024 / 1024).toFixed(2) + 'MB'
}

const doCompress = async () => {
  if (!imageUrl.value) return
  isProcessing.value = true
  await new Promise(r => setTimeout(r, 50))
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = imageUrl.value
    })

    let cvs = document.createElement('canvas')
    cvs.width = img.naturalWidth
    cvs.height = img.naturalHeight

    const maxDim = 2000
    if (img.naturalWidth > maxDim || img.naturalHeight > maxDim) {
      const s = maxDim / Math.max(img.naturalWidth, img.naturalHeight)
      cvs.width = Math.floor(img.naturalWidth * s)
      cvs.height = Math.floor(img.naturalHeight * s)
    }
    const ctx = cvs.getContext('2d')!
    ctx.drawImage(img, 0, 0, cvs.width, cvs.height)

    let quality = 0.85
    let url = cvs.toDataURL('image/jpeg', quality)
    while (url.length > 500 * 1024 && quality > 0.1) {
      quality -= 0.05
      url = cvs.toDataURL('image/jpeg', quality)
    }
    while (url.length > 500 * 1024 && cvs.width > 200) {
      const s = 0.8
      const tmp = document.createElement('canvas')
      tmp.width = Math.floor(cvs.width * s)
      tmp.height = Math.floor(cvs.height * s)
      tmp.getContext('2d')!.drawImage(cvs, 0, 0, tmp.width, tmp.height)
      cvs = tmp
      quality = 0.85
      url = cvs.toDataURL('image/jpeg', quality)
      while (url.length > 500 * 1024 && quality > 0.1) {
        quality -= 0.05
        url = cvs.toDataURL('image/jpeg', quality)
      }
    }

    compressedUrl.value = url
    compressedSize.value = url.length
    ElMessage.success('压缩完成')
  } catch {
    ElMessage.error('压缩失败')
  } finally {
    isProcessing.value = false
  }
}

const startCompress = (name: string, size: number, dataUrl: string) => {
  fileName.value = name
  fileSize.value = size
  compressedUrl.value = ''
  imageUrl.value = dataUrl
  // 图片加载完成后自动压缩
  const img = new Image()
  img.onload = () => doCompress()
  img.src = dataUrl
}

const handleUpload = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return
  const file = files[0]
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片格式文件')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    startCompress(file.name, file.size, reader.result as string)
  }
  reader.readAsDataURL(file)
  ;(e.target as HTMLInputElement).value = ''
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      if (!blob) continue
      const reader = new FileReader()
      reader.onload = () => {
        startCompress(blob.name || '剪贴板图片', blob.size, reader.result as string)
      }
      reader.readAsDataURL(blob)
      break
    }
  }
}

onMounted(() => document.addEventListener('paste', handlePaste))
onUnmounted(() => document.removeEventListener('paste', handlePaste))

const download = () => {
  if (!compressedUrl.value) return
  const link = document.createElement('a')
  const name = fileName.value.replace(/\.[^.]+$/, '')
  link.download = `${name}_压缩.jpg`
  link.href = compressedUrl.value
  link.click()
}

const copyToClipboard = async () => {
  if (!compressedUrl.value) return
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = compressedUrl.value
    })
    const cvs = document.createElement('canvas')
    cvs.width = img.width; cvs.height = img.height
    cvs.getContext('2d')!.drawImage(img, 0, 0)
    const blob = await new Promise<Blob>(resolve => cvs.toBlob(b => resolve(b!), 'image/png'))
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const clearAll = () => {
  imageUrl.value = ''
  fileName.value = ''
  fileSize.value = 0
  compressedUrl.value = ''
  compressedSize.value = 0
}
</script>

<template>
  <div class="image-compressor">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>图片压缩（≤500KB）</span>
        </div>
      </template>

      <div class="content-layout">
        <div class="control-panel">
          <div class="upload-area" @click="($refs.fileInput as HTMLInputElement)?.click()">
            <el-icon><Plus /></el-icon>
            <span>选择图片</span>
            <span class="hint">支持 JPG / PNG · Ctrl+V 粘贴</span>
          </div>
          <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleUpload" />

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">原始大小</span>
              <span class="info-value">{{ formatSize(fileSize) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">压缩后</span>
              <span class="info-value" :style="{ color: compressedUrl ? '#67c23a' : '#c0c4cc' }">{{ compressedUrl ? formatSize(compressedSize) : '0 B' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">文件名</span>
              <span class="info-value">{{ fileName || '未选择' }}</span>
            </div>
            <div v-if="isProcessing" class="info-row">
              <span class="info-label">状态</span>
              <span class="info-value" style="color: #409eff;">正在压缩...</span>
            </div>
          </div>

          <div class="action-row">
            <el-button type="success" @click="copyToClipboard" :disabled="!compressedUrl">
              复制到剪贴板
            </el-button>
            <el-button type="primary" @click="download" :disabled="!compressedUrl">
              导出图片
            </el-button>
            <el-button type="danger" @click="clearAll">清空</el-button>
          </div>
        </div>

        <div class="preview-panel">
          <div v-if="imageUrl && !compressedUrl" class="preview-box">
            <div class="preview-label">原图 — {{ formatSize(fileSize) }}</div>
            <img :src="imageUrl" class="preview-img" />
          </div>
          <div v-if="compressedUrl" class="preview-box">
            <img :src="compressedUrl" class="preview-img" />
          </div>
          <div v-if="!imageUrl" class="preview-placeholder">
            <el-icon><Picture /></el-icon>
            <span>请上传图片</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.image-compressor {
  padding: 20px;
}

.main-card {
  max-width: 1100px;
  margin: 0 auto;
}

.card-header {
  font-size: 18px;
  font-weight: 500;
}

.content-layout {
  display: flex;
  gap: 20px;
  min-height: 400px;
}

.control-panel {
  width: 260px;
  flex-shrink: 0;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
  color: #909399;
}

.upload-area:hover {
  border-color: #409eff;
  background: #f0f9ff;
  color: #409eff;
}

.upload-area .el-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 6px;
}

.upload-area span {
  display: block;
  font-size: 14px;
}

.upload-area .hint {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.info-section {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #909399;
}

.info-value {
  color: #303133;
  font-weight: 500;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  align-items: center;
}

.action-row :deep(.el-button) {
  width: 100%;
  max-width: 220px;
  margin-left: 0 !important;
}

.preview-panel {
  flex: 1;
  min-width: 0;
}

.preview-box {
  margin-bottom: 16px;
}

.preview-label {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.preview-img {
  max-width: 100%;
  max-height: 60vh;
  display: block;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  color: #c0c4cc;
}

.preview-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.preview-placeholder span {
  font-size: 16px;
}
</style>

<style scoped>
.image-compressor {
  padding: 20px;
}

.main-card {
  max-width: 1100px;
  margin: 0 auto;
}

.card-header {
  font-size: 18px;
  font-weight: 500;
}

.content-layout {
  display: flex;
  gap: 20px;
  min-height: 400px;
}

.control-panel {
  width: 260px;
  flex-shrink: 0;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
  color: #909399;
}

.upload-area:hover {
  border-color: #409eff;
  background: #f0f9ff;
  color: #409eff;
}

.upload-area .el-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 6px;
}

.upload-area span {
  display: block;
  font-size: 14px;
}

.upload-area .hint {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.info-section {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #909399;
}

.info-value {
  color: #303133;
  font-weight: 500;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  align-items: center;
}

.action-row :deep(.el-button) {
  width: 100%;
  max-width: 220px;
  margin-left: 0 !important;
}

.preview-panel {
  flex: 1;
  min-width: 0;
}

.preview-box {
  margin-bottom: 16px;
}

.preview-label {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.preview-img {
  max-width: 100%;
  max-height: 60vh;
  display: block;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  color: #c0c4cc;
}

.preview-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.preview-placeholder span {
  font-size: 16px;
}
</style>
