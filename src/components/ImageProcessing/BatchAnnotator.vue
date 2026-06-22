<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import JSZip from 'jszip'

const images = ref<string[]>([])
const configText = ref('')
const isProcessing = ref(false)

// 拖拽排序
const draggedIdx = ref<null | number>(null)

const onDragStart = (idx: number) => { draggedIdx.value = idx }
const onDragEnd = () => { draggedIdx.value = null }
const onDragOver = (idx: number, e: DragEvent) => {
  e.preventDefault()
  if (draggedIdx.value !== null && draggedIdx.value !== idx) e.dataTransfer!.dropEffect = 'move'
}
const onDrop = (targetIdx: number) => {
  if (draggedIdx.value === null || draggedIdx.value === targetIdx) return
  const list = [...images.value]
  const tmp = list[draggedIdx.value]
  list[draggedIdx.value] = list[targetIdx]
  list[targetIdx] = tmp
  images.value = list
  draggedIdx.value = null
}

// 标注样式参数（参考图片标注模块）
const annotationPos = ref('bottom-right')
const fontFamily = ref('STHeiti, SimHei')
const textColor = ref('#ff0000')

const positionOptions = [
  { value: 'top-left', label: '左上角' }, { value: 'top-center', label: '顶部居中' },
  { value: 'top-right', label: '右上角' }, { value: 'center', label: '居中' },
  { value: 'bottom-left', label: '左下角' }, { value: 'bottom-center', label: '底部居中' },
  { value: 'bottom-right', label: '右下角' }
]
const fontOptions = [
  { value: 'PingFang SC, Microsoft YaHei', label: '微软雅黑' },
  { value: 'STSong, SimSun', label: '宋体' }, { value: 'STHeiti, SimHei', label: '黑体' },
  { value: 'STKaiti, KaiTi', label: '楷体' }, { value: 'STFangsong, FangSong', label: '仿宋' }
]

const handleImageUpload = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    const reader = new FileReader()
    reader.onload = () => { images.value.push(reader.result as string) }
    reader.readAsDataURL(file)
  }
  ;(e.target as HTMLInputElement).value = ''
}

// 单张标注
const annotateImage = (url: string, text: string): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight
      const refShort = 427
      const scale = Math.max(1, Math.min(w, h) / refShort)
      const size = Math.round(25 * scale)
      const pad = Math.round(8 * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)

      ctx.save()
      ctx.font = `bold ${size}px ${fontFamily.value}`
      ctx.fillStyle = textColor.value
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 3; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 1
      ctx.textBaseline = 'top'; ctx.textAlign = 'left'

      let tx = 0, ty = 0
      const p = annotationPos.value
      if (p === 'top-left') { tx = pad; ty = pad }
      else if (p === 'top-center') { tx = w / 2; ty = pad; ctx.textAlign = 'center' }
      else if (p === 'top-right') { tx = w - pad; ty = pad; ctx.textAlign = 'right' }
      else if (p === 'center') { tx = w / 2; ty = h / 2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle' }
      else if (p === 'bottom-left') { tx = pad; ty = h - pad; ctx.textBaseline = 'bottom' }
      else if (p === 'bottom-center') { tx = w / 2; ty = h - pad; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom' }
      else if (p === 'bottom-right') { tx = w - pad; ty = h - pad; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom' }

      ctx.fillText(text, tx, ty)
      ctx.restore()
      resolve(canvas)
    }
    img.onerror = reject
    img.src = url
  })
}

// 批量标注并打包
const runBatchAnnotation = async () => {
  if (images.value.length === 0 || !configText.value) {
    ElMessage.warning('请上传图片和输入需要标注的文本')
    return
  }
  const lines = configText.value.trim().split('|').map(s => s.trim()).filter(Boolean)
  if (lines.length < images.value.length) {
    ElMessage.warning(`文本有 ${lines.length} 项，图片有 ${images.value.length} 张，超出部分跳过`)
  }

  isProcessing.value = true
  try {
    const zip = new JSZip()
    const ts = new Date()
    const timeStr = `${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,'0')}${String(ts.getDate()).padStart(2,'0')}_${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}${String(ts.getSeconds()).padStart(2,'0')}`

    for (let i = 0; i < Math.min(images.value.length, lines.length); i++) {
      const text = lines[i]
      const canvas = await annotateImage(images.value[i], text)
      const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.92))
      zip.file(`${text}_${timeStr}.jpg`, blob)
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(content)
    link.download = `批量标注_${timeStr}.zip`
    link.click()
    URL.revokeObjectURL(link.href)
    ElMessage.success('批量标注完成')
  } catch (e) {
    console.error(e)
    ElMessage.error('处理失败')
  } finally {
    isProcessing.value = false
  }
}

const clearAll = () => { images.value = []; configText.value = '' }
</script>

<template>
  <div class="batch-annotator">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>批量图片标注</span>
        </div>
      </template>

      <div class="content-layout">
        <div class="control-panel">
          <div class="upload-area" @click="($refs.imageInput as HTMLInputElement)?.click()">
            <el-icon><Plus /></el-icon>
            <span>点击上传图片</span>
            <span class="hint">支持 JPG / PNG</span>
          </div>
          <input ref="imageInput" type="file" accept="image/*" multiple style="display: none" @change="handleImageUpload" />

          <div class="text-config-section">
            <div class="section-title">标注文本</div>
            <el-input
              v-model="configText"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 6 }"
              placeholder="请输入需要标注的文本！"
              maxlength="500"
              show-word-limit
            />
            <span class="config-hint">用 | 竖线分隔，每段对应一张图片</span>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">图片数</span>
              <span class="info-value">{{ images.length }} 张</span>
            </div>
            <div class="info-row">
              <span class="info-label">文本行</span>
              <span class="info-value">{{ configText ? configText.trim().split('|').map(s => s.trim()).filter(Boolean).length : 0 }} 项</span>
            </div>
          </div>

          <div class="annotation-section">
            <div class="section-title">标注位置</div>
            <el-select v-model="annotationPos" style="width:100%">
              <el-option v-for="opt in positionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>

            <div class="style-section">
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
          </div>

          <div class="action-row">
            <el-button type="primary" @click="runBatchAnnotation" :loading="isProcessing" :disabled="images.length === 0 || !configText">
              开始标注
            </el-button>
            <el-button type="danger" @click="clearAll">清空</el-button>
          </div>
        </div>

        <div class="preview-panel">
          <div v-if="images.length > 0" class="image-list">
            <div
              v-for="(url, idx) in images" :key="idx"
              class="image-thumb"
              :class="{ 'is-dragging': draggedIdx === idx, 'can-drop': draggedIdx !== null && draggedIdx !== idx }"
              draggable="true"
              @dragstart="onDragStart(idx)"
              @dragend="onDragEnd"
              @dragover="onDragOver(idx, $event)"
              @drop="onDrop(idx)"
            >
              <span class="thumb-index">{{ idx + 1 }}</span>
              <img :src="url" class="thumb-img" draggable="false" />
            </div>
          </div>
          <div v-else class="preview-placeholder">
            <el-icon><Picture /></el-icon>
            <span>请上传图片和输入需要标注的文本</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.batch-annotator { padding: 20px; }
.main-card { max-width: 1200px; margin: 0 auto; }
.card-header { font-size: 18px; font-weight: 500; }
.content-layout { display: flex; gap: 20px; align-items: flex-start; }
.control-panel { width: 240px; flex-shrink: 0; }
.upload-area {
  border: 2px dashed #dcdfe6; border-radius: 8px; padding: 18px;
  text-align: center; cursor: pointer; transition: all 0.3s;
  background: #fafafa; color: #909399;
}
.upload-area:hover { border-color: #409eff; background: #f0f9ff; color: #409eff; }
.upload-area .el-icon { font-size: 24px; display: block; margin: 0 auto 4px; }
.upload-area span { display: block; font-size: 14px; }
.upload-area .hint { font-size: 12px; color: #c0c4cc; margin-top: 2px; }

.info-section { margin-top: 12px; padding: 12px; background: #f5f7fa; border-radius: 8px; }
.info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
.info-row:last-child { margin-bottom: 0; }
.info-label { color: #909399; }
.info-value { color: #303133; font-weight: 500; }

.annotation-section { margin-top: 12px; }
.section-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 8px; margin-top: 12px; }
.section-title:first-child { margin-top: 0; }
.text-config-section { margin-top: 12px; }
.config-hint { display: block; font-size: 12px; color: #c0c4cc; margin-top: 4px; }
.style-section { margin-top: 12px; padding: 12px; background: #f5f7fa; border-radius: 8px; }
.style-item { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.style-item:last-child { margin-bottom: 0; }
.style-label { font-size: 13px; color: #606266; min-width: 30px; flex-shrink: 0; }
.style-slider { flex: 1; }
.font-select { flex: 1; }
.action-row { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; align-items: center; }
.action-row :deep(.el-button) { width: 100%; max-width: 200px; margin-left: 0 !important; }

.preview-panel { flex: 1; min-width: 0; }
.image-list { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.image-thumb { position: relative; aspect-ratio: 4/3; border-radius: 4px; overflow: hidden; border: 1px solid #dcdfe6; cursor: grab; user-select: none; transition: box-shadow 0.2s; }
.image-thumb:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.image-thumb.is-dragging { opacity: 0.5; border-color: #409eff; }
.image-thumb.can-drop { border-color: #67c23a; background: #f0f9eb; }
.thumb-index { position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.6); color: #fff; font-size: 12px; padding: 2px 8px; border-radius: 4px; z-index: 1; }
.thumb-img { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
.preview-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 350px; border: 2px dashed #dcdfe6; border-radius: 8px; color: #c0c4cc; }
.preview-placeholder .el-icon { font-size: 48px; margin-bottom: 12px; }
.preview-placeholder span { font-size: 16px; }
</style>
