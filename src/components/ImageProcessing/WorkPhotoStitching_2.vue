<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Switch } from '@element-plus/icons-vue'

const leftImage = ref<string>('')
const rightImage = ref<string>('')
const resultImage = ref<string>('')
const mode = ref<'horizontal' | 'vertical'>('horizontal')
const spacing = ref<number>(0)
const isProcessing = ref<boolean>(false)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const leftFileInput = ref<HTMLInputElement | null>(null)
const rightFileInput = ref<HTMLInputElement | null>(null)

// 交换左右图片
const swapImages = () => {
  if (!leftImage.value || !rightImage.value) {
    ElMessage.warning('请先添加两张图片')
    return
  }
  const tmpImg = leftImage.value
  leftImage.value = rightImage.value
  rightImage.value = tmpImg
  ElMessage.success('已交换左右图片')
}

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result as string)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const handleUpload = async (e: Event, position: 'left' | 'right') => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return
  const file = files[0]
  if (!file.type.startsWith('image/')) { ElMessage.error('请选择图片文件'); return }
  const dataUrl = await readFileAsDataUrl(file)
  if (position === 'left') leftImage.value = dataUrl; else rightImage.value = dataUrl
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile(); if (!blob) continue
      const dataUrl = await readFileAsDataUrl(blob)
      if (!leftImage.value) { leftImage.value = dataUrl; ElMessage.success('已粘贴到左侧') }
      else if (!rightImage.value) { rightImage.value = dataUrl; ElMessage.success('已粘贴到右侧') }
      else { leftImage.value = dataUrl; ElMessage.success('已替换左侧') }
      break
    }
  }
}

// 压缩图片到指定大小（优化版本）
const compressImageToSize = (canvas: HTMLCanvasElement, maxSizeBytes: number): string => {
  // 先尝试固定质量
  let quality = 0.85
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  
  // 如果图片已经小于目标大小，直接返回
  if (dataUrl.length <= maxSizeBytes) {
    return dataUrl
  }
  
  // 如果图片太大，先尝试降低质量
  const qualitySteps = [0.7, 0.6, 0.5, 0.4, 0.3]
  for (const q of qualitySteps) {
    dataUrl = canvas.toDataURL('image/jpeg', q)
    if (dataUrl.length <= maxSizeBytes) {
      return dataUrl
    }
  }
  
  // 如果质量调整还不够，则缩放画布
  const currentSize = dataUrl.length
  const scale = Math.sqrt(maxSizeBytes / currentSize) * 0.95 // 0.95 是安全系数
  
  if (scale < 1) {
    const newCanvas = document.createElement('canvas')
    const newCtx = newCanvas.getContext('2d', { willReadFrequently: true })!
    
    newCanvas.width = Math.floor(canvas.width * scale)
    newCanvas.height = Math.floor(canvas.height * scale)
    
    // 设置高质量缩放
    newCtx.imageSmoothingEnabled = true
    newCtx.imageSmoothingQuality = 'high'
    
    newCtx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height)
    return newCanvas.toDataURL('image/jpeg', 0.8)
  }
  
  return dataUrl
}

// 拼接图片（优化版本）
const stitch = async () => {
  if (!leftImage.value || !rightImage.value) { ElMessage.warning('请先添加两张图片'); return }
  isProcessing.value = true
  
  try {
    // 使用 requestAnimationFrame 让出控制权，避免阻塞UI
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    const canvas = canvasRef.value || document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!

    // 预加载图片
    const imgL = new Image(), imgR = new Image()
    await Promise.all([
      new Promise<void>((resolve, reject) => { 
        imgL.onload = () => resolve()
        imgL.onerror = reject
        imgL.src = leftImage.value 
      }),
      new Promise<void>((resolve, reject) => { 
        imgR.onload = () => resolve()
        imgR.onerror = reject
        imgR.src = rightImage.value 
      })
    ])

    // 再次让出控制权
    await new Promise(resolve => requestAnimationFrame(resolve))

    // 计算尺寸
    let canvasWidth, canvasHeight
    if (mode.value === 'horizontal') {
      const totalWidth = imgL.width + spacing.value + imgR.width
      const height = Math.max(imgL.height, imgR.height)
      canvasWidth = totalWidth
      canvasHeight = height
    } else {
      const width = Math.max(imgL.width, imgR.width)
      const totalHeight = imgL.height + spacing.value + imgR.height
      canvasWidth = width
      canvasHeight = totalHeight
    }

    // 设置画布尺寸
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    
    // 设置高质量渲染
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 绘制图片
    if (mode.value === 'horizontal') {
      const halfWidth = Math.floor((canvasWidth - spacing.value) / 2)
      const scaleL = halfWidth / imgL.width
      const scaleR = halfWidth / imgR.width
      const scaledHeightL = imgL.height * scaleL
      const scaledHeightR = imgR.height * scaleR
      const yL = (canvasHeight - scaledHeightL) / 2
      const yR = (canvasHeight - scaledHeightR) / 2
      
      ctx.drawImage(imgL, 0, Math.floor(yL), halfWidth, Math.floor(scaledHeightL))
      ctx.drawImage(imgR, halfWidth + spacing.value, Math.floor(yR), halfWidth, Math.floor(scaledHeightR))
    } else {
      const halfHeight = Math.floor((canvasHeight - spacing.value) / 2)
      const scaleL = halfHeight / imgL.height
      const scaleR = halfHeight / imgR.height
      const scaledWidthL = imgL.width * scaleL
      const scaledWidthR = imgR.width * scaleR
      const xL = (canvasWidth - scaledWidthL) / 2
      const xR = (canvasWidth - scaledWidthR) / 2
      
      ctx.drawImage(imgL, Math.floor(xL), 0, Math.floor(scaledWidthL), halfHeight)
      ctx.drawImage(imgR, Math.floor(xR), halfHeight + spacing.value, Math.floor(scaledWidthR), halfHeight)
    }

    // 最后让出控制权再进行压缩
    await new Promise(resolve => requestAnimationFrame(resolve))

    // 控制图片大小在5M以内
    const maxSizeBytes = 5 * 1024 * 1024 // 5MB
    resultImage.value = compressImageToSize(canvas, maxSizeBytes)
    
    // 显示拼接完成信息和文件大小
    const finalSizeKB = Math.round(resultImage.value.length / 1024)
    const finalSizeMB = (finalSizeKB / 1024).toFixed(2)
    ElMessage.success(`拼接完成，文件大小：${finalSizeMB}MB`)
    
    if (!canvasRef.value) canvasRef.value = canvas
  } catch (e) { 
    console.error(e)
    ElMessage.error('拼接失败，请重试') 
  } finally { 
    isProcessing.value = false 
  }
}

// 下载结果
const downloadResult = () => {
  if (!resultImage.value) return
  const link = document.createElement('a')
  const now = new Date()
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`
  link.download = `两宫格拼接_${ts}.jpg`
  link.href = resultImage.value
  link.click()
}

// 自动预览（优化防抖）
let stitchTimer: number | null = null
const requestPreview = () => {
  if (!leftImage.value || !rightImage.value) return
  if (isProcessing.value) return // 如果正在处理，跳过新的请求
  if (stitchTimer) window.clearTimeout(stitchTimer)
  stitchTimer = window.setTimeout(() => { 
    if (!isProcessing.value) { // 再次检查是否正在处理
      stitch() 
    }
  }, 300) // 增加防抖时间到300ms
}
watch([leftImage, rightImage], requestPreview)
watch([mode, spacing], requestPreview)

onMounted(() => { document.addEventListener('paste', handlePaste) })
onUnmounted(() => { document.removeEventListener('paste', handlePaste) })
</script>

<template>
  <div class="work-photo-stitching-2">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>工作照拼接 - 两宫格</span>
        </div>
      </template>

      <!-- 图片上传区域 -->
      <div class="upload-section">
        <div class="upload-grid">
          <!-- 左图 -->
          <div class="upload-item" :class="{ 'has-image': leftImage }">
            <div v-if="!leftImage" class="upload-placeholder" @click="() => leftFileInput?.click()">
              <el-icon><Plus /></el-icon>
              <span>点击上传左图</span>
              <span class="paste-hint">或 Ctrl+V 粘贴</span>
            </div>
            <div v-else class="image-preview">
              <img :src="leftImage" alt="左图" />
              <div class="image-overlay">
                <el-button type="danger" size="small" @click="leftImage = ''">删除</el-button>
              </div>
            </div>
            <input ref="leftFileInput" type="file" accept="image/*" style="display: none" @change="(e) => handleUpload(e, 'left')" />
          </div>

          <!-- 右图 -->
          <div class="upload-item" :class="{ 'has-image': rightImage }">
            <div v-if="!rightImage" class="upload-placeholder" @click="() => rightFileInput?.click()">
              <el-icon><Plus /></el-icon>
              <span>点击上传右图</span>
              <span class="paste-hint">或 Ctrl+V 粘贴</span>
            </div>
            <div v-else class="image-preview">
              <img :src="rightImage" alt="右图" />
              <div class="image-overlay">
                <el-button type="danger" size="small" @click="rightImage = ''">删除</el-button>
              </div>
            </div>
            <input ref="rightFileInput" type="file" accept="image/*" style="display: none" @change="(e) => handleUpload(e, 'right')" />
          </div>
        </div>
        
        <!-- 交换按钮 -->
        <div v-if="leftImage && rightImage" class="swap-section">
          <el-button type="primary" @click="swapImages" :icon="Switch">
            交换左右图片位置
          </el-button>
        </div>
      </div>

      <!-- 拼接设置 -->
      <div class="settings-section">
        <div class="setting-item">
          <span class="label">拼接模式：</span>
          <el-radio-group v-model="mode">
            <el-radio-button value="horizontal">水平拼接</el-radio-button>
            <el-radio-button value="vertical">垂直拼接</el-radio-button>
          </el-radio-group>
        </div>
        <div class="setting-item">
          <span class="label">间距：</span>
          <el-slider v-model="spacing" :min="0" :max="100" :step="5" style="width: 200px" />
          <span class="value">{{ spacing }}px</span>
        </div>
      </div>

      <!-- 拼接结果 -->
      <div v-if="resultImage || isProcessing" class="result-section">
        <div class="result-header">
          <span>拼接结果</span>
          <div v-if="isProcessing" class="processing-indicator">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在拼接...</span>
          </div>
          <el-button v-else type="primary" @click="downloadResult">下载图片</el-button>
        </div>
        <div class="result-body">
          <div v-if="isProcessing" class="processing-placeholder">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在处理图片，请稍候...</span>
          </div>
          <div v-else-if="resultImage" class="result-preview">
            <img :src="resultImage" class="result-img" alt="拼接结果" />
          </div>
        </div>
      </div>

      <canvas ref="canvasRef" style="display: none"></canvas>
    </el-card>
  </div>
</template>

<style scoped>
.work-photo-stitching-2 {
  padding: 20px;
}

.main-card {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
}

.upload-section {
  margin: 20px 0;
}

.swap-section {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.upload-item {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  min-height: 200px;
  position: relative;
  transition: border-color 0.3s;
}

.upload-item:hover {
  border-color: #409eff;
}

.upload-item.has-image {
  border-style: solid;
  border-color: #67c23a;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  cursor: pointer;
}

.upload-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.paste-hint {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 5px;
}

.image-preview {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.settings-section {
  margin: 20px 0;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.label {
  margin-right: 15px;
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.value {
  margin-left: 10px;
  color: #909399;
  font-size: 14px;
}

.result-section {
  margin-top: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
}

.result-header {
  background: #f5f7fa;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #606266;
}

.result-body {
  padding: 20px;
  overflow: auto;
  max-height: 70vh;
}

.result-preview {
  display: flex;
  justify-content: center;
}

.result-img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.processing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-size: 14px;
}

.processing-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
  font-size: 14px;
}

.processing-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

</style>