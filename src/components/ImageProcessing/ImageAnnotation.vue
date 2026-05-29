<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const imageUrl = ref('')
const fileName = ref('')

const annotation = ref('')
const annotationPos = ref('bottom-center')
const fontSize = ref(30)
const fontFamily = ref('STHeiti, SimHei')
const textColor = ref('#ffffff')
const isExporting = ref(false)

const positionOptions = [
  { value: 'top-left', label: '左上角' },
  { value: 'top-center', label: '顶部居中' },
  { value: 'top-right', label: '右上角' },
  { value: 'center', label: '居中' },
  { value: 'bottom-left', label: '左下角' },
  { value: 'bottom-center', label: '底部居中' },
  { value: 'bottom-right', label: '右下角' }
]

const fontOptions = [
  { value: 'PingFang SC, Microsoft YaHei', label: '微软雅黑' },
  { value: 'STSong, SimSun', label: '宋体' },
  { value: 'STHeiti, SimHei', label: '黑体' },
  { value: 'STKaiti, KaiTi', label: '楷体' },
  { value: 'STFangsong, FangSong', label: '仿宋' }
]

const img = ref<HTMLImageElement | null>(null)

const handleUpload = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return
  const file = files[0]
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片格式文件')
    return
  }
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    imageUrl.value = reader.result as string
    annotation.value = ''
  }
  reader.readAsDataURL(file)
  ;(e.target as HTMLInputElement).value = ''
}

const onImgLoad = (e: Event) => {
  img.value = e.target as HTMLImageElement
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
        imageUrl.value = reader.result as string
        fileName.value = blob.name || '剪贴板图片'
        annotation.value = ''
      }
      reader.readAsDataURL(blob)
      break
    }
  }
}

onMounted(() => document.addEventListener('paste', handlePaste))
onUnmounted(() => document.removeEventListener('paste', handlePaste))

const exportImage = async () => {
  if (!imageUrl.value || !img.value) return
  isExporting.value = true
  await new Promise(r => setTimeout(r, 100))

  try {
    const w = img.value.naturalWidth
    const h = img.value.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img.value, 0, 0, w, h)

    if (annotation.value) {
      const pad = 12
      const refShort = 427
      const imgScale = Math.max(1, Math.min(w, h) / refShort)
      const size = Math.round(fontSize.value * imgScale)
      ctx.save()
      ctx.font = `bold ${size}px ${fontFamily.value}`
      ctx.fillStyle = textColor.value
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 3
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      ctx.textBaseline = 'top'
      ctx.textAlign = 'left'

      let tx = 0, ty = 0
      switch (annotationPos.value) {
        case 'top-left':       tx = pad; ty = pad; break
        case 'top-center':     tx = w / 2; ty = pad; ctx.textAlign = 'center'; break
        case 'top-right':      tx = w - pad; ty = pad; ctx.textAlign = 'right'; break
        case 'center':         tx = w / 2; ty = h / 2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; break
        case 'bottom-left':    tx = pad; ty = h - pad; ctx.textBaseline = 'bottom'; break
        case 'bottom-center':  tx = w / 2; ty = h - pad; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; break
        case 'bottom-right':   tx = w - pad; ty = h - pad; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; break
      }
      ctx.fillText(annotation.value, tx, ty)
      ctx.restore()
    }

    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    const ts = new Date()
    const timeStr = `${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,'0')}${String(ts.getDate()).padStart(2,'0')}_${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}${String(ts.getSeconds()).padStart(2,'0')}`
    link.download = `标注_${timeStr}.png`
    link.href = url
    link.click()
  } catch {
    ElMessage.error('导出失败，请重试')
  } finally {
    isExporting.value = false
  }
}

const clearAll = () => {
  imageUrl.value = ''
  fileName.value = ''
  annotation.value = ''
  img.value = null
}
</script>

<template>
  <div class="image-annotation">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>图片标注</span>
        </div>
      </template>

      <div class="content-layout">
        <!-- 左侧：控制面板 -->
        <div class="control-panel">
          <div class="upload-area" @click="($refs.fileInput as HTMLInputElement)?.click()">
            <el-icon><Plus /></el-icon>
            <span>选择图片</span>
            <span class="hint">支持 JPG / PNG · Ctrl+V 粘贴</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleUpload"
          />

          <div v-if="imageUrl" class="annotation-section">
            <div class="section-title">标注文字</div>
            <el-input v-model="annotation" placeholder="输入标注文字" maxlength="30" />

            <div class="section-title" style="margin-top: 12px">标注位置</div>
            <el-select v-model="annotationPos" style="width: 100%">
              <el-option v-for="opt in positionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>

            <div class="style-section">
              <div class="style-item">
                <span class="style-label">字号</span>
                <el-slider v-model="fontSize" :min="20" :max="50" :step="1" class="style-slider" />
              </div>
              <div class="style-item">
                <span class="style-label">字体</span>
                <el-select v-model="fontFamily" class="font-select">
                  <el-option v-for="item in fontOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </div>
              <div class="style-item">
                <span class="style-label">颜色</span>
                <el-color-picker v-model="textColor" show-alpha />
              </div>
            </div>

            <div class="action-row">
              <el-button type="primary" @click="exportImage" :loading="isExporting" :disabled="!imageUrl">
                导出图片
              </el-button>
              <el-button type="danger" @click="clearAll">清空</el-button>
            </div>
          </div>
        </div>

        <!-- 右侧：预览 -->
        <div class="preview-panel">
          <div v-if="imageUrl" id="annotation-preview" class="preview-container">
            <img :src="imageUrl" class="preview-img" @load="onImgLoad" />
            <div
              v-if="annotation"
              class="annotation-overlay"
              :class="'pos-' + annotationPos"
              :style="{ fontSize: fontSize + 'px', fontFamily: fontFamily, color: textColor }"
            >
              {{ annotation }}
            </div>
          </div>
          <div v-else class="preview-placeholder">
            <el-icon><Picture /></el-icon>
            <span>请上传图片</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.image-annotation {
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
  min-height: 500px;
}

.control-panel {
  width: 280px;
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

.annotation-section {
  margin-top: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.style-section {
  margin-top: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.style-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.style-item:last-child {
  margin-bottom: 0;
}

.style-label {
  font-size: 13px;
  color: #606266;
  min-width: 30px;
  flex-shrink: 0;
}

.style-slider {
  flex: 1;
}

.font-select {
  flex: 1;
}

.action-row {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.preview-panel {
  flex: 1;
  min-width: 0;
}

.preview-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.preview-img {
  max-width: 100%;
  max-height: 70vh;
  display: block;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.annotation-overlay {
  position: absolute;
  z-index: 2;
  padding: 4px 8px;
  line-height: 1.4;
  pointer-events: none;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  max-width: calc(100% - 16px);
  word-break: break-word;
}

.annotation-overlay.pos-top-left { top: 8px; left: 8px; }
.annotation-overlay.pos-top-center { top: 8px; left: 50%; transform: translateX(-50%); white-space: nowrap; }
.annotation-overlay.pos-top-right { top: 8px; right: 8px; }
.annotation-overlay.pos-center { top: 50%; left: 50%; transform: translate(-50%, -50%); white-space: nowrap; }
.annotation-overlay.pos-bottom-left { bottom: 8px; left: 8px; }
.annotation-overlay.pos-bottom-center { bottom: 8px; left: 50%; transform: translateX(-50%); white-space: nowrap; }
.annotation-overlay.pos-bottom-right { bottom: 8px; right: 8px; }

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
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
