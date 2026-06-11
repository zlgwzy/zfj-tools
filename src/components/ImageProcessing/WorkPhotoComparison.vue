<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const img1 = ref('')
const img2 = ref('')
const resultUrl = ref('')
const isProcessing = ref(false)
const orientation = ref<'horizontal' | 'vertical'>('horizontal')

// 拖拽交换
const dragIdx = ref(0)

const onBoxDragStart = (idx: number) => { dragIdx.value = idx }
const onBoxDrop = (idx: number) => {
  if (dragIdx.value === idx) return
  const tmp = img1.value; img1.value = img2.value; img2.value = tmp
  if (resultUrl.value) generateComparison()
}

// 剪贴板粘贴：自动粘贴到空白框，全满时提示
const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      if (!blob) continue
      if (!img1.value) {
        img1.value = await compressImage(blob)
      } else if (!img2.value) {
        img2.value = await compressImage(blob)
      } else {
        ElMessage.warning('请先点击要替换的图片上的删除按钮')
      }
      break
    }
  }
}

// 删除单张
const removeImg = (idx: number) => {
  if (idx === 1) img1.value = ''; else img2.value = ''
}

onMounted(() => document.addEventListener('paste', handlePaste))
onUnmounted(() => document.removeEventListener('paste', handlePaste))

// 上传时压缩图片到最长边 2000px（小于 1MB 不压缩直接读取）
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size < 3 * 1024 * 1024) {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxDim = 2000
        let w = img.width, h = img.height
        if (w > maxDim || h > maxDim) {
          const s = maxDim / Math.max(w, h)
          w = Math.floor(w * s); h = Math.floor(h * s)
        }
        const cvs = document.createElement('canvas')
        cvs.width = w; cvs.height = h
        cvs.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(cvs.toDataURL('image/jpeg', 0.92))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

const handleUpload = async (e: Event, idx: number) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) return
  try {
    const url = await compressImage(files[0])
    if (idx === 1) img1.value = url
    else img2.value = url
  } catch {
    ElMessage.error('图片处理失败')
  }
  ;(e.target as HTMLInputElement).value = ''
}

const generateComparison = async () => {
  if (!img1.value || !img2.value) {
    ElMessage.warning('请上传两张图片')
    return
  }
  isProcessing.value = true
  await new Promise(r => setTimeout(r, 50))

  try {
    const load = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url
    })
    const [im1, im2] = await Promise.all([load(img1.value), load(img2.value)])

    const gap = 10
    let canvas, ctx, cx1, cy1, cx2, cy2

    if (orientation.value === 'horizontal') {
      const maxH = Math.max(im1.height, im2.height)
      const s1 = maxH / im1.height, s2 = maxH / im2.height
      const w1 = Math.floor(im1.width * s1), w2 = Math.floor(im2.width * s2)
      canvas = document.createElement('canvas')
      canvas.width = w1 + gap + w2; canvas.height = maxH
      ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(im1, 0, 0, w1, maxH)
      ctx.drawImage(im2, w1 + gap, 0, w2, maxH)
      cx1 = w1 / 2; cy1 = maxH / 2
      cx2 = w1 + gap + w2 / 2; cy2 = maxH / 2
    } else {
      const maxW = Math.max(im1.width, im2.width)
      const s1 = maxW / im1.width, s2 = maxW / im2.width
      const h1 = Math.floor(im1.height * s1), h2 = Math.floor(im2.height * s2)
      canvas = document.createElement('canvas')
      canvas.width = maxW; canvas.height = h1 + gap + h2
      ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(im1, 0, 0, maxW, h1)
      ctx.drawImage(im2, 0, h1 + gap, maxW, h2)
      cx1 = maxW / 2; cy1 = h1 / 2
      cx2 = maxW / 2; cy2 = h1 + gap + h2 / 2
    }

    // 标注
    const refShort = 427
    const fontScale = Math.max(1, Math.min(im1.width, im1.height) / refShort)
    const size = Math.round(35 * fontScale)

    const drawLabel = (text: string, x: number, y: number) => {
      ctx.save()
      ctx.font = `bold ${size}px STHeiti, SimHei`
      ctx.fillStyle = 'rgb(255, 25, 25)'
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 3; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 1
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(text, x, y)
      ctx.restore()
    }
    drawLabel('处置前', cx1, cy1)
    drawLabel('处置后', cx2, cy2)

    // 压缩到 500KB 以内
    let quality = 0.92
    let url = canvas.toDataURL('image/jpeg', quality)
    while (url.length > 1024 * 1024 && quality > 0.15) {
      quality -= 0.05
      url = canvas.toDataURL('image/jpeg', quality)
    }
    resultUrl.value = url
    ElMessage.success('对比图生成完成！')
  } catch {
    ElMessage.error('生成失败')
  } finally {
    isProcessing.value = false
  }
}

const download = () => {
  if (!resultUrl.value) return
  const link = document.createElement('a')
  const ts = new Date()
  const timeStr = `${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,'0')}${String(ts.getDate()).padStart(2,'0')}_${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}${String(ts.getSeconds()).padStart(2,'0')}`
  link.download = `对比图_${timeStr}.jpg`
  link.href = resultUrl.value
  link.click()
}

const copyToClipboard = async () => {
  if (!resultUrl.value) return
  try {
    const blob = await (await fetch(resultUrl.value)).blob()
    const img = await createImageBitmap(blob)
    let cvs = document.createElement('canvas')
    cvs.width = img.width; cvs.height = img.height
    cvs.getContext('2d')!.drawImage(img, 0, 0)
    // 缩放到最长边 1200px 后再转 PNG
    const maxClip = 2000
    if (cvs.width > maxClip || cvs.height > maxClip) {
      const s = maxClip / Math.max(cvs.width, cvs.height)
      const tmp = document.createElement('canvas')
      tmp.width = Math.floor(cvs.width * s); tmp.height = Math.floor(cvs.height * s)
      tmp.getContext('2d')!.drawImage(cvs, 0, 0, tmp.width, tmp.height)
      cvs = tmp
    }
    const pngBlob = await new Promise<Blob>(resolve => cvs.toBlob(b => resolve(b!), 'image/png'))
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })])
    const sz = pngBlob.size < 1024 ? pngBlob.size + 'B' : pngBlob.size < 1048576 ? (pngBlob.size / 1024).toFixed(1) + 'KB' : (pngBlob.size / 1048576).toFixed(2) + 'MB'
    ElMessage.success(`已复制到剪贴板（${sz}）`)
  } catch {
    ElMessage.error('复制失败')
  }
}

// 排列方向或图片变化时自动重新生成
watch(orientation, () => { if (resultUrl.value) generateComparison() })
watch([img1, img2], () => { if (resultUrl.value && img1.value && img2.value) generateComparison() })

const clearAll = () => { img1.value = ''; img2.value = ''; resultUrl.value = '' }
</script>

<template>
  <div class="photo-comparison">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>工作照拼接 - 对比图</span>
        </div>
      </template>

      <div class="content-layout">
        <div class="control-panel">
          <div class="upload-grid">
            <div class="upload-box" data-slot="1" draggable="true"
              @click="($refs.input1 as HTMLInputElement)?.click()"
              @dragstart="onBoxDragStart(1)"
              @dragover.prevent
              @drop="onBoxDrop(1)">
              <img v-if="img1" :src="img1" class="box-img" draggable="false" />
              <div v-if="img1" class="box-label">处置前</div>
              <div v-if="img1" class="box-del" @click.stop="removeImg(1)">×</div>
              <template v-else>
                <el-icon><Plus /></el-icon>
                <span>处置前</span>
                <span class="box-hint">点击上传或 Ctrl+V 粘贴</span>
              </template>
            </div>
            <input ref="input1" type="file" accept="image/*" style="display:none" @change="e => handleUpload(e, 1)" />
            <div class="drag-arrow">⇅ 拖拽可交换位置</div>
            <div class="upload-box" data-slot="2" draggable="true"
              @click="($refs.input2 as HTMLInputElement)?.click()"
              @dragstart="onBoxDragStart(2)"
              @dragover.prevent
              @drop="onBoxDrop(2)">
              <img v-if="img2" :src="img2" class="box-img" draggable="false" />
              <div v-if="img2" class="box-label">处置后</div>
              <div v-if="img2" class="box-del" @click.stop="removeImg(2)">×</div>
              <template v-else>
                <el-icon><Plus /></el-icon>
                <span>处置后</span>
                <span class="box-hint">点击上传或 Ctrl+V 粘贴</span>
              </template>
            </div>
            <input ref="input2" type="file" accept="image/*" style="display:none" @change="e => handleUpload(e, 2)" />
          </div>

          <div class="action-row">
            <el-radio-group v-model="orientation" size="small">
              <el-radio-button value="horizontal" style="width:50%">横向排列</el-radio-button>
              <el-radio-button value="vertical" style="width:50%">纵向排列</el-radio-button>
            </el-radio-group>
            <el-button type="primary" @click="generateComparison" :loading="isProcessing" :disabled="!img1 || !img2">
              生成对比图
            </el-button>
            <el-button type="success" @click="copyToClipboard" :disabled="!resultUrl">
              复制到剪贴板
            </el-button>
            <el-button type="primary" @click="download" :disabled="!resultUrl">
              导出图片
            </el-button>
            <el-button type="danger" @click="clearAll">清空</el-button>
          </div>
          <div class="clipboard-hint">提示：由于浏览器机制限制，复制到剪贴板仅支持 PNG 格式，文件大小会较原图明显增加。</div>
        </div>

        <div class="preview-panel">
          <div v-if="resultUrl" class="result-box">
            <img :src="resultUrl" class="result-img" />
          </div>
          <div v-else class="preview-placeholder">
            <el-icon><Picture /></el-icon>
            <span>上传两张图片生成对比图</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.photo-comparison { padding: 20px; }
.main-card { max-width: 1100px; margin: 0 auto; }
.card-header { font-size: 18px; font-weight: 500; }
.content-layout { display: flex; gap: 20px; align-items: flex-start; }
.control-panel { width: 240px; flex-shrink: 0; }
.upload-grid { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.upload-box {
  flex: 1; aspect-ratio: 4/3; border: 2px dashed #dcdfe6; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.3s;
  background: #fafafa; color: #909399; overflow: hidden;
  position: relative;
}
.upload-box:hover { border-color: #409eff; background: #f0f9ff; color: #409eff; }
.upload-box .el-icon { font-size: 24px; display: block; margin-bottom: 4px; }
.upload-box span { font-size: 14px; }
.upload-box[draggable="true"] { cursor: grab; }
.box-img { width: 100%; height: 100%; object-fit: cover; }
.box-del {
  position: absolute; top: 4px; right: 4px; width: 22px; height: 22px;
  border-radius: 50%; background: rgba(0,0,0,0.5); color: #fff;
  display: none; align-items: center; justify-content: center;
  font-size: 16px; cursor: pointer; z-index: 2; line-height: 1;
}
.box-del:hover { background: #f56c6c; }
.upload-box:hover .box-del { display: flex; }
.box-label {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.5); color: #fff; font-size: 13px;
  text-align: center; padding: 4px; pointer-events: none;
}
.box-hint { font-size: 11px; color: #c0c4cc; margin-top: 2px; }
.action-row :deep(.el-radio-group) { width: 100%; max-width: 220px; }
.action-row :deep(.el-radio-button__inner) { width: 100%; justify-content: center; height: 32px; line-height: 32px; padding: 0 8px; }
.action-row :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: #e6a23c; border-color: #e6a23c; box-shadow: -1px 0 0 0 #e6a23c;
}
.drag-arrow { text-align: center; font-size: 12px; color: #c0c4cc; line-height: 1; }
.action-row { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; align-items: center; }
.action-row :deep(.el-button) { width: 100%; max-width: 220px; margin-left: 0 !important; }
.clipboard-hint {
  margin-top: 10px; padding: 8px 10px; font-size: 12px; color: #909399;
  line-height: 1.5; background: #fef6ec; border-left: 3px solid #e6a23c;
  border-radius: 4px; text-align: left;
}
.preview-panel { flex: 1; min-width: 0; }
.result-box { text-align: center; }
.result-img { max-width: 100%; max-height: 70vh; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.preview-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 350px; border: 2px dashed #dcdfe6; border-radius: 8px; color: #c0c4cc; }
.preview-placeholder .el-icon { font-size: 48px; margin-bottom: 12px; }
.preview-placeholder span { font-size: 16px; }
</style>
