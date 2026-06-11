<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const imageUrl = ref('')
const fileName = ref('')

const annotation = ref('')
const annotationPos = ref('bottom-center')
const fontSize = ref(30)
const fontFamily = ref('STHeiti, SimHei')
const textColor = ref('#ffffff')
const isExporting = ref(false)
const isCopying = ref(false)

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
      imageUrl.value = ''
      img.value = null
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

// 绘制标注到 canvas 并返回（共用逻辑）
const drawAnnotationOnCanvas = () => {
  const w = img.value!.naturalWidth
  const h = img.value!.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img.value!, 0, 0, w, h)

  if (annotation.value) {
    // 以 img 元素当前显示宽度为基准缩放字号，保证导出与预览视觉一致
    const displayW = img.value!.width
    const scale = w / displayW
    const pad = Math.round(8 * scale)       // 元素定位偏移
    const pt = Math.round(4 * scale)         // padding-top
    const pl = Math.round(8 * scale)         // padding-left/right
    const size = Math.round(fontSize.value * scale)
    ctx.save()
    ctx.font = `bold ${size}px ${fontFamily.value}`
    ctx.fillStyle = textColor.value
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 3
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 1
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    let tx = 0, ty = 0
    switch (annotationPos.value) {
      case 'top-left':       tx = pad + pl; ty = pad + pt; break
      case 'top-center':     tx = w / 2; ty = pad + pt; ctx.textAlign = 'center'; break
      case 'top-right':      tx = w - (pad + pl); ty = pad + pt; ctx.textAlign = 'right'; break
      case 'center':         tx = w / 2; ty = h / 2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; break
      case 'bottom-left':    tx = pad + pl; ty = h - (pad + pt); ctx.textBaseline = 'bottom'; break
      case 'bottom-center':  tx = w / 2; ty = h - (pad + pt); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; break
      case 'bottom-right':   tx = w - (pad + pl); ty = h - (pad + pt); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; break
    }
    // 自动换行：手动换行 + 超出可用宽度自动切断
    const maxW = w - (pad + pl) * 2
    const lineH = Math.round(size * 1.4)
    let drawY = ty
    for (const line of annotation.value.split('\n')) {
      const m = ctx.measureText(line)
      if (m.width <= maxW) {
        ctx.fillText(line, tx, drawY)
        drawY += lineH
      } else {
        let buf = ''
        for (const ch of line) {
          if (ctx.measureText(buf + ch).width > maxW) {
            ctx.fillText(buf, tx, drawY)
            drawY += lineH
            buf = ch
          } else {
            buf += ch
          }
        }
        if (buf) { ctx.fillText(buf, tx, drawY); drawY += lineH }
      }
    }
    ctx.restore()
  }
  return canvas
}

const realSize = (dataUrl: string) => Math.round(dataUrl.split(',')[1].length * 3 / 4)

// 压缩到 5MB 以内（仅调 JPEG 质量，不改变像素尺寸）
const compressToSize = (canvas: HTMLCanvasElement, maxBytes = 5 * 1024 * 1024): string => {
  let quality = 0.92
  let url = canvas.toDataURL('image/jpeg', quality)
  while (realSize(url) > maxBytes && quality > 0.2) {
    quality -= 0.05
    url = canvas.toDataURL('image/jpeg', quality)
  }
  return url
}

const exportImage = async () => {
  if (!imageUrl.value || !img.value) return
  isExporting.value = true
  await new Promise(r => setTimeout(r, 100))
  try {
    const canvas = drawAnnotationOnCanvas()
    const url = compressToSize(canvas)
    const link = document.createElement('a')
    const ts = new Date()
    const timeStr = `${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,'0')}${String(ts.getDate()).padStart(2,'0')}_${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}${String(ts.getSeconds()).padStart(2,'0')}`
    const name = annotation.value ? annotation.value.replace(/\n/g, '') : '标注'
    link.download = `${name}_${timeStr}.jpg`
    link.href = url
    link.click()
  } catch {
    ElMessage.error('导出失败，请重试')
  } finally {
    isExporting.value = false
  }
}

const copyToClipboard = async () => {
  if (!imageUrl.value || !img.value) return
  isCopying.value = true
  try {
    let canvas = drawAnnotationOnCanvas()
    // 等比缩放到最长边 2000px，大幅提升速度
    const maxClip = 2000
    if (canvas.width > maxClip || canvas.height > maxClip) {
      const s = maxClip / Math.max(canvas.width, canvas.height)
      const tmp = document.createElement('canvas')
      tmp.width = Math.floor(canvas.width * s)
      tmp.height = Math.floor(canvas.height * s)
      const tctx = tmp.getContext('2d')!
      tctx.imageSmoothingEnabled = true
      tctx.imageSmoothingQuality = 'high'
      tctx.drawImage(canvas, 0, 0, tmp.width, tmp.height)
      canvas = tmp
    }
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    const sz = blob.size < 1024 ? blob.size + 'B' : blob.size < 1048576 ? (blob.size / 1024).toFixed(1) + 'KB' : (blob.size / 1048576).toFixed(2) + 'MB'
    ElMessage.success(`已复制到剪贴板（${sz}）`)
  } catch {
    ElMessage.error('复制失败')
  } finally {
    isCopying.value = false
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
          <span>图片标注（200字以内）</span>
        </div>
      </template>

      <div class="content-layout">
        <!-- 左侧：控制面板 -->
        <div class="control-panel">
          <div class="upload-area" @click="($refs.fileInput as HTMLInputElement)?.click()">
            <el-icon><Plus /></el-icon>
            <span>点击上传图片</span>
            <span class="hint">支持 JPG / PNG · Ctrl+V 粘贴</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleUpload"
          />

          <div class="annotation-section">
            <div class="section-title">标注文字（200字以内）</div>
            <el-input
              v-model="annotation"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 6 }"
              placeholder="输入标注文字"
              maxlength="200"
              show-word-limit
            />

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
              <el-button type="success" @click="copyToClipboard" :disabled="!imageUrl" :loading="isCopying">
                复制到剪贴板
              </el-button>
              <el-button type="primary" @click="exportImage" :loading="isExporting" :disabled="!imageUrl">
                导出图片
              </el-button>
              <el-button type="danger" :disabled="!imageUrl" @click="clearAll">清空</el-button>
            </div>
            <div class="clipboard-hint">提示：由于浏览器机制限制，复制到剪贴板仅支持 PNG 格式，文件大小会较原图明显增加。</div>
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
  align-items: flex-start;
}

.control-panel {
  width: 240px;
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
  margin: 0 auto 6px;
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
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.action-row :deep(.el-button) {
  width: 100%;
  max-width: 240px;
  margin-left: 0 !important;
}

.clipboard-hint {
  margin-top: 10px;
  padding: 8px 10px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  background: #fef6ec;
  border-left: 3px solid #e6a23c;
  border-radius: 4px;
  text-align: left;
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
  white-space: pre-wrap;
  overflow-wrap: break-word;
  text-align: left;
}

.annotation-overlay.pos-top-left { top: 8px; left: 8px; }
.annotation-overlay.pos-top-center { top: 8px; left: 8px; right: 8px; text-align: center; }
.annotation-overlay.pos-top-right { top: 8px; right: 8px; text-align: right; }
.annotation-overlay.pos-center { top: 50%; left: 8px; right: 8px; transform: translateY(-50%); text-align: center; }
.annotation-overlay.pos-bottom-left { bottom: 8px; left: 8px; }
.annotation-overlay.pos-bottom-center { bottom: 8px; left: 8px; right: 8px; text-align: center; }
.annotation-overlay.pos-bottom-right { bottom: 8px; right: 8px; text-align: right; }

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
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
