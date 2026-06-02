<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const imageUrl = ref('')
const imgEl = ref<HTMLImageElement | null>(null)

// 裁剪区域位置（基于图片实际像素坐标）
const cropX = ref(0)
const cropY = ref(0)
const cropW = ref(0)
const cropH = ref(0)

const isDragging = ref(false)
const dragStart = { x: 0, y: 0, cx: 0, cy: 0 }
const isExporting = ref(false)

// 图片加载后的自然尺寸
const natW = ref(0)
const natH = ref(0)

// 显示缩放比
const scale = computed(() => {
  if (!imgEl.value) return 1
  return imgEl.value.naturalWidth / imgEl.value.width
})

// 判断是否已是 4:3

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
    imageUrl.value = reader.result as string
  }
  reader.readAsDataURL(file)
  ;(e.target as HTMLInputElement).value = ''
}

const onImgLoad = () => {
  if (!imgEl.value) return
  natW.value = imgEl.value.naturalWidth
  natH.value = imgEl.value.naturalHeight

  // 初始裁剪区域：以图片较短边为基准，居中裁剪 4:3
  if (natW.value / natH.value > 4 / 3) {
    // 图片更宽，以高度为基准
    cropH.value = natH.value
    cropW.value = Math.round(natH.value * 4 / 3)
    cropX.value = Math.round((natW.value - cropW.value) / 2)
    cropY.value = 0
  } else {
    // 图片更高或相等，以宽度为基准
    cropW.value = natW.value
    cropH.value = Math.round(natW.value * 3 / 4)
    cropX.value = 0
    cropY.value = Math.round((natH.value - cropH.value) / 2)
  }
}

// 裁剪框拖拽与缩放
const activeHandle = ref('') // ''=移动, tl/tr/bl/br=缩放

const onMouseDown = (e: MouseEvent, handle = '') => {
  if (!imgEl.value || !imageUrl.value) return
  isDragging.value = true
  activeHandle.value = handle
  const rect = imgEl.value.getBoundingClientRect()
  const s = imgEl.value.naturalWidth / rect.width
  dragStart.x = e.clientX
  dragStart.y = e.clientY
  dragStart.cx = cropX.value
  dragStart.cy = cropY.value
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !imgEl.value) return
  const rect = imgEl.value.getBoundingClientRect()
  const s = imgEl.value.naturalWidth / rect.width
  const dx = Math.round((e.clientX - dragStart.x) * s)
  const dy = Math.round((e.clientY - dragStart.y) * s)

  if (activeHandle.value) {
    // 缩放模式 — 用鼠标绝对位置计算，边缘跟随鼠标
    const mx = (e.clientX - rect.left) * s
    const my = (e.clientY - rect.top) * s
    let x = cropX.value, y = cropY.value, w = cropW.value, h = cropH.value
    const ratio = 4 / 3
    const minW = 80, minH = 60

    switch (activeHandle.value) {
      case 'br':
        w = Math.max(minW, mx - cropX.value)
        h = Math.round(w / ratio)
        break
      case 'bl':
        w = Math.max(minW, cropX.value + cropW.value - mx)
        x = cropX.value + cropW.value - w
        h = Math.round(w / ratio)
        break
      case 'tr':
        h = Math.max(minH, my - cropY.value)
        w = Math.round(h * ratio)
        break
      case 'tl':
        w = Math.max(minW, cropX.value + cropW.value - mx)
        x = cropX.value + cropW.value - w
        h = Math.round(w / ratio)
        y = cropY.value + cropH.value - h
        break
    }

    // 限制不超出图片边界
    if (x < 0) { w = Math.max(minW, cropX.value + cropW.value); h = Math.round(w / ratio); x = 0 }
    if (y < 0) { h = Math.max(minH, cropY.value + cropH.value); w = Math.round(h * ratio); y = 0 }
    if (x + w > natW.value) { w = natW.value - x; h = Math.round(w / ratio) }
    if (y + h > natH.value) { h = natH.value - y; w = Math.round(h * ratio) }

    cropX.value = Math.round(x)
    cropY.value = Math.round(y)
    cropW.value = Math.round(w)
    cropH.value = Math.round(h)
  } else {
    // 移动模式
    let nx = dragStart.cx + dx
    let ny = dragStart.cy + dy
    nx = Math.max(0, Math.min(nx, natW.value - cropW.value))
    ny = Math.max(0, Math.min(ny, natH.value - cropH.value))
    cropX.value = nx
    cropY.value = ny
  }
}

const onMouseUp = () => {
  isDragging.value = false
  activeHandle.value = ''
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

// 生成裁剪后的 canvas
const getCroppedCanvas = () => {
  const canvas = document.createElement('canvas')
  canvas.width = cropW.value
  canvas.height = cropH.value
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    imgEl.value!,
    cropX.value, cropY.value, cropW.value, cropH.value,
    0, 0, cropW.value, cropH.value
  )
  return canvas
}

// 导出裁剪结果
const exportCrop = async () => {
  if (!imageUrl.value || !imgEl.value) return
  isExporting.value = true
  await new Promise(r => setTimeout(r, 50))
  try {
    const canvas = getCroppedCanvas()
    let quality = 0.92
    let url = canvas.toDataURL('image/jpeg', quality)
    while (url.length > 5 * 1024 * 1024 && quality > 0.2) {
      quality -= 0.05
      url = canvas.toDataURL('image/jpeg', quality)
    }
    const link = document.createElement('a')
    const ts = new Date()
    const timeStr = `${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,'0')}${String(ts.getDate()).padStart(2,'0')}_${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}${String(ts.getSeconds()).padStart(2,'0')}`
    link.download = `裁剪_${timeStr}.jpg`
    link.href = url
    link.click()
  } catch {
    ElMessage.error('导出失败')
  } finally {
    isExporting.value = false
  }
}

const copyToClipboard = async () => {
  if (!imageUrl.value || !imgEl.value) return
  try {
    let canvas = getCroppedCanvas()
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
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const clearAll = () => {
  imageUrl.value = ''
  imgEl.value = null
  natW.value = 0
  natH.value = 0
}
</script>

<template>
  <div class="image-cropper">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>图片裁剪（4:3）</span>
        </div>
      </template>

      <div class="content-layout">
        <div class="control-panel">
          <div class="upload-area" @click="($refs.fileInput as HTMLInputElement)?.click()">
            <el-icon><Plus /></el-icon>
            <span>选择图片</span>
            <span class="hint">支持 JPG / PNG</span>
          </div>
          <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleUpload" />

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">原图尺寸</span>
              <span class="info-value">{{ natW }} × {{ natH }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">裁剪尺寸</span>
              <span class="info-value">{{ cropW }} × {{ cropH }}（4:3）</span>
            </div>
          </div>

          <div class="action-row">
            <el-button type="success" @click="copyToClipboard" :disabled="!imageUrl">
              复制到剪贴板
            </el-button>
            <el-button type="primary" @click="exportCrop" :loading="isExporting" :disabled="!imageUrl">
              导出图片
            </el-button>
            <el-button type="danger" :disabled="!imageUrl" @click="clearAll">清空</el-button>
          </div>
        </div>

        <div class="preview-panel">
          <div v-if="imageUrl" class="crop-container">
            <img
              ref="imgEl"
              :src="imageUrl"
              class="crop-image"
              @load="onImgLoad"
              draggable="false"
            />
            <template v-if="natW > 0">
              <div class="crop-overlay">
                <div class="mask" :style="{ top: 0, left: 0, right: 0, height: (cropY / scale) + 'px' }" />
                <div class="mask" :style="{ bottom: 0, left: 0, right: 0, height: ((natH - cropY - cropH) / scale) + 'px' }" />
                <div class="mask" :style="{ top: (cropY / scale) + 'px', left: 0, width: (cropX / scale) + 'px', height: (cropH / scale) + 'px' }" />
                <div class="mask" :style="{ top: (cropY / scale) + 'px', right: 0, width: ((natW - cropX - cropW) / scale) + 'px', height: (cropH / scale) + 'px' }" />
              </div>
              <div
                class="crop-window"
                :style="{
                  top: (cropY / scale) + 'px',
                  left: (cropX / scale) + 'px',
                  width: (cropW / scale) + 'px',
                  height: (cropH / scale) + 'px'
                }"
                @mousedown="(e) => onMouseDown(e)"
              >
                <div class="crop-handle tl" @mousedown.stop="(e) => onMouseDown(e, 'tl')" />
                <div class="crop-handle tr" @mousedown.stop="(e) => onMouseDown(e, 'tr')" />
                <div class="crop-handle bl" @mousedown.stop="(e) => onMouseDown(e, 'bl')" />
                <div class="crop-handle br" @mousedown.stop="(e) => onMouseDown(e, 'br')" />
                <div class="crop-grid">
                  <div class="grid-line hl" /><div class="grid-line hr" />
                  <div class="grid-line vl" /><div class="grid-line vr" />
                </div>
              </div>
            </template>
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
.image-cropper {
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
  max-width: 200px;
  margin-left: 0 !important;
}

.help-text {
  margin-top: 10px;
  font-size: 12px;
  color: #c0c4cc;
  text-align: center;
  line-height: 1.5;
}

.preview-panel {
  flex: 1;
  min-width: 0;
}

.crop-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
  cursor: move;
  user-select: none;
}

.crop-image {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  pointer-events: none;
}

.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.45);
}

.crop-window {
  position: absolute;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
  cursor: move;
}

.crop-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #fff;
  border: 2px solid #409eff;
  border-radius: 2px;
}

.crop-handle.tl { top: -5px; left: -5px; cursor: nw-resize; }
.crop-handle.tr { top: -5px; right: -5px; cursor: ne-resize; }
.crop-handle.bl { bottom: -5px; left: -5px; cursor: sw-resize; }
.crop-handle.br { bottom: -5px; right: -5px; cursor: se-resize; }

.crop-grid {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.4);
}

.grid-line.hl { top: 33.33%; left: 0; right: 0; height: 1px; }
.grid-line.hr { top: 66.66%; left: 0; right: 0; height: 1px; }
.grid-line.vl { left: 33.33%; top: 0; bottom: 0; width: 1px; }
.grid-line.vr { left: 66.66%; top: 0; bottom: 0; width: 1px; }

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
