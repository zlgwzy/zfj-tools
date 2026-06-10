<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

interface ImageItem {
  id: string
  url: string
  file: File
  annotation: string
  annotationPos: string
}

const annotationFontSize = ref(25)
const annotationFontFamily = ref('STHeiti, SimHei')
const annotationColor = ref('#ffffff')

const fontOptions = [
  { value: 'PingFang SC, Microsoft YaHei', label: '微软雅黑' },
  { value: 'STSong, SimSun', label: '宋体' },
  { value: 'STHeiti, SimHei', label: '黑体' },
  { value: 'STKaiti, KaiTi', label: '楷体' },
  { value: 'STFangsong, FangSong', label: '仿宋' }
]

const positionOptions = [
  { value: 'top-left', label: '左上角' },
  { value: 'top-center', label: '顶部居中' },
  { value: 'top-right', label: '右上角' },
  { value: 'center', label: '居中' },
  { value: 'bottom-left', label: '左下角' },
  { value: 'bottom-center', label: '底部居中' },
  { value: 'bottom-right', label: '右下角' }
]

const imageList = ref<ImageItem[]>([])
const resultImage = ref<string>('')
const spacing = ref<number>(0)
const orientation = ref<'vertical' | 'horizontal'>('horizontal')
const uniformSize = ref<boolean>(true)
const uniformWidth = ref<boolean>(false)
const isProcessing = ref<boolean>(false)
const isCopying = ref(false)
const processingProgress = ref<number>(0)
const isUploading = ref<boolean>(false)
const uploadProgress = ref<number>(0)
const maxImageSize = ref<number>(1434) // 最大图片尺寸限制 (2048 * 0.7)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// 生成唯一ID
const generateId = () => Math.random().toString(36).slice(2, 10)

// 压缩图片
const compressImage = (file: File, maxSize: number = 2048): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    
    img.onload = () => {
      // 计算压缩比例
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
      }
      
      canvas.width = width
      canvas.height = height
      
      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height)
      
      // 转换为DataURL，使用0.7压缩比例
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      resolve(dataUrl)
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// 读取文件为DataURL（带压缩）
const readFileAsDataUrl = (file: File): Promise<string> => {
  return compressImage(file, maxImageSize.value)
}

// 处理文件上传
const handleFileSelect = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return
  
  
  isUploading.value = true
  uploadProgress.value = 0
  
  try {
    const newImages: ImageItem[] = []
    const totalFiles = files.length
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // 更新上传进度
      uploadProgress.value = Math.floor((i / totalFiles) * 100)
      
      if (!file.type.startsWith('image/')) {
        ElMessage.warning(`文件 ${file.name} 不是图片格式，已跳过`)
        continue
      }
      
      try {
        const dataUrl = await readFileAsDataUrl(file)
        newImages.push({
          id: generateId(),
          url: dataUrl,
          file: file,
          annotation: '',
          annotationPos: 'bottom-right'
        })
      } catch (error) {
        console.error(`处理文件 ${file.name} 失败:`, error)
        ElMessage.error(`文件 ${file.name} 处理失败，已跳过`)
      }
      
      // 让出控制权，避免阻塞UI
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    imageList.value.push(...newImages)
    uploadProgress.value = 100
    
    if (newImages.length > 0) {
      ElMessage.success(`成功添加 ${newImages.length} 张图片`)
    }
    
  } catch (error) {
    console.error('上传处理失败:', error)
    ElMessage.error('上传处理失败，请重试')
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
    // 清空文件输入，允许重复选择相同文件
    if (e.target) {
      (e.target as HTMLInputElement).value = ''
    }
  }
}

// 处理粘贴
const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  
  isUploading.value = true
  uploadProgress.value = 0
  
  try {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile()
        if (!blob) continue
        
        uploadProgress.value = 50
        
        try {
          const dataUrl = await readFileAsDataUrl(blob)
          imageList.value.push({
            id: generateId(),
            url: dataUrl,
            file: blob as File,
            annotation: '',
            annotationPos: 'bottom-right'
          })
          uploadProgress.value = 100
          ElMessage.success('已粘贴图片')
        } catch (error) {
          console.error('粘贴图片处理失败:', error)
          ElMessage.error('粘贴图片处理失败')
        }
        break
      }
    }
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

// 删除图片
const removeImage = (id: string) => {
  const index = imageList.value.findIndex(img => img.id === id)
  if (index > -1) {
    imageList.value.splice(index, 1)
    if (draggedIdx.value === index) draggedIdx.value = null
  }
}

// 拖拽排序
const draggedIdx = ref<null | number>(null)

const onDragStart = (index: number) => {
  if (!imageList.value[index].url) return
  draggedIdx.value = index
}

const onDragEnd = () => {
  draggedIdx.value = null
}

const onDragOver = (index: number, e: DragEvent) => {
  e.preventDefault()
  if (draggedIdx.value !== null && draggedIdx.value !== index) {
    e.dataTransfer!.dropEffect = 'move'
  }
}

const onDrop = (targetIndex: number, e: DragEvent) => {
  e.preventDefault()
  if (draggedIdx.value === null || draggedIdx.value === targetIndex) return
  const src = draggedIdx.value
  const list = [...imageList.value]
  const tmp = { ...list[src] }
  list[src] = { ...list[targetIndex] }
  list[targetIndex] = tmp
  imageList.value = list
  draggedIdx.value = null
}

// 在 Canvas 上绘制标注文字（fontScale 为外部传入的统一缩放系数，以图一为准）
const drawAnnotation = (ctx: CanvasRenderingContext2D, text: string, pos: string, ix: number, iy: number, iw: number, ih: number, fontScale?: number) => {
  if (!text) return
  const refShort = 427
  const imgScale = fontScale ?? Math.max(1, Math.min(iw, ih) / refShort)
  const size = Math.round(annotationFontSize.value * imgScale)
  const pad = Math.round(8 * imgScale)
  ctx.save()
  ctx.font = `bold ${size}px ${annotationFontFamily.value}`
  ctx.fillStyle = annotationColor.value
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 3
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 1
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  let tx = ix, ty = iy
  switch (pos) {
    case 'top-left':       tx = ix + pad; ty = iy + pad; break
    case 'top-center':     tx = ix + iw / 2; ty = iy + pad; ctx.textAlign = 'center'; break
    case 'top-right':      tx = ix + iw - pad; ty = iy + pad; ctx.textAlign = 'right'; break
    case 'center':         tx = ix + iw / 2; ty = iy + ih / 2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; break
    case 'bottom-left':    tx = ix + pad; ty = iy + ih - pad; ctx.textBaseline = 'bottom'; break
    case 'bottom-center':  tx = ix + iw / 2; ty = iy + ih - pad; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; break
    case 'bottom-right':   tx = ix + iw - pad; ty = iy + ih - pad; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; break
  }
  ctx.fillText(text, tx, ty)
  ctx.restore()
}

// 拼接长图
const stitchLongImage = async (isAuto = false, successMsg?: string) => {
  if (imageList.value.length < 2) {
    ElMessage.warning('请至少添加2张图片')
    return
  }
  
  isProcessing.value = true
  processingProgress.value = 0
  
  try {
    // 创建新的Canvas，避免复用可能导致的问题
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: false  // 禁用透明度，提升性能
    })!
    
    // 创建当前图片列表的副本，避免在加载过程中被修改
    const currentImageList = [...imageList.value]
    const totalImages = currentImageList.length
    
    console.log('开始拼接，图片列表长度:', currentImageList.length)
    
    // 创建图片加载的Promise数组，确保按顺序加载
    const imagePromises = currentImageList.map(async (item, index) => {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = item.url
      })
      
      // 更新进度
      processingProgress.value = Math.floor(((index + 1) / totalImages) * 50)
      
      // 让出控制权，避免阻塞UI
      await new Promise(resolve => setTimeout(resolve, 0))
      
      return img
    })
    
    // 等待所有图片加载完成，保持顺序
    const images = await Promise.all(imagePromises)
    
    // 调试：确保图片顺序正确
    console.log('图片加载顺序:', images.map((img, index) => ({
      index,
      width: img.width,
      height: img.height,
      src: img.src.substring(0, 50) + '...'
    })))
    
    // 确保所有图片都已正确加载
    for (let i = 0; i < images.length; i++) {
      if (!images[i] || images[i].width === 0 || images[i].height === 0) {
        throw new Error(`图片 ${i} 加载失败或尺寸为0`)
      }
    }

    const refShort = 427
    const maxWIdx = images.reduce((best, img, i, arr) => img.width > arr[best].width ? i : best, 0)

    if (orientation.value === 'vertical') {
      // 纵向排列：垂直拼接
      const maxWidth = Math.max(...images.map(img => img.width))
      let totalHeight
      
      if (uniformSize.value) {
        // 统一尺寸：按比例缩放图片到统一宽度
        totalHeight = images.reduce((sum, img) => {
          const scale = maxWidth / img.width
          const scaledHeight = img.height * scale
          return sum + scaledHeight
        }, 0) + spacing.value * (images.length - 1)
      } else if (uniformWidth.value) {
        // 统一宽度：按比例缩放图片到统一宽度，但保持高度比例
        totalHeight = images.reduce((sum, img) => {
          const scale = maxWidth / img.width
          const scaledHeight = img.height * scale
          return sum + scaledHeight
        }, 0) + spacing.value * (images.length - 1)
      } else {
        // 保持原尺寸
        totalHeight = images.reduce((sum, img) => sum + img.height, 0) + spacing.value * (images.length - 1)
      }
      
      canvas.width = maxWidth
      canvas.height = totalHeight
      
      // 设置Canvas绘制质量
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // 填充白色背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, maxWidth, totalHeight)

      // 以最宽图片的实际显示尺寸的较短边计算统一缩放系数
      const fontScale = (uniformSize.value || uniformWidth.value)
        ? Math.max(1, Math.min(maxWidth, images[maxWIdx].height * maxWidth / images[maxWIdx].width) / refShort)
        : Math.max(1, Math.min(images[maxWIdx].width, images[maxWIdx].height) / refShort)

      // 绘制图片
      let currentY = 0
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        if (uniformSize.value || uniformWidth.value) {
          // 统一宽度：按比例缩放图片到统一宽度
          const scale = maxWidth / img.width
          const scaledHeight = Math.floor(img.height * scale)
          const x = 0
          const y = Math.floor(currentY)
          const w = Math.floor(maxWidth)
          const h = Math.floor(scaledHeight)
          
          console.log(`绘制图片 ${i}:`, { x, y, w, h, scale, originalSize: { width: img.width, height: img.height } })
          
          ctx.drawImage(img, x, y, w, h)
          const itemV = currentImageList[i]
          if (itemV.annotation) { drawAnnotation(ctx, itemV.annotation, itemV.annotationPos, x, y, w, h, fontScale) }
          currentY += scaledHeight + spacing.value
        } else {
          // 保持原尺寸：居中对齐
          const x = Math.floor((maxWidth - img.width) / 2)
          const y = Math.floor(currentY)

          console.log(`绘制图片 ${i}:`, { x, y, width: img.width, height: img.height })

          ctx.drawImage(img, x, y)
          const itemV = currentImageList[i]
          if (itemV.annotation) { drawAnnotation(ctx, itemV.annotation, itemV.annotationPos, x, y, img.width, img.height, fontScale) }
          currentY += img.height + spacing.value
        }
        
        // 更新进度
        processingProgress.value = 50 + Math.floor(((i + 1) / images.length) * 40)
        
        // 让出控制权，避免阻塞UI
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }
    } else {
      // 横向排列：水平拼接
      let maxHeight = Math.max(...images.map(img => img.height))
      let totalWidth
      
      if (uniformSize.value) {
        // 统一高度：按比例缩放图片到统一高度
        totalWidth = images.reduce((sum, img) => {
          const scale = maxHeight / img.height
          const scaledWidth = img.width * scale
          return sum + scaledWidth
        }, 0) + spacing.value * (images.length - 1)
      } else if (uniformWidth.value) {
        // 统一宽度：按比例缩放图片到统一宽度
        const maxWidth = Math.max(...images.map(img => img.width))
        totalWidth = maxWidth * images.length + spacing.value * (images.length - 1)
        // 重新计算实际需要的高度（考虑缩放后的高度）
        maxHeight = Math.max(...images.map(img => {
          const scale = maxWidth / img.width
          return img.height * scale
        }))
      } else {
        // 保持原尺寸
        totalWidth = images.reduce((sum, img) => sum + img.width, 0) + spacing.value * (images.length - 1)
      }
      
      canvas.width = totalWidth
      canvas.height = maxHeight
      
      // 设置Canvas绘制质量
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // 填充白色背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, totalWidth, canvas.height)

      // 以最宽图片的实际显示尺寸的较短边计算统一缩放系数
      const fontScale = (uniformSize.value || uniformWidth.value)
        ? Math.max(1, Math.min(images[maxWIdx].width * maxHeight / images[maxWIdx].height, maxHeight) / refShort)
        : Math.max(1, Math.min(images[maxWIdx].width, images[maxWIdx].height) / refShort)

      // 绘制图片
      let currentX = 0
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        if (uniformSize.value) {
          // 统一高度：按比例缩放图片到统一高度
          const scale = maxHeight / img.height
          const scaledWidth = Math.floor(img.width * scale)
          const x = Math.floor(currentX)
          const y = 0
          const w = Math.floor(scaledWidth)
          const h = Math.floor(maxHeight)
          
          console.log(`绘制图片 ${i}:`, { x, y, w, h, scale, originalSize: { width: img.width, height: img.height } })
          
          ctx.drawImage(img, x, y, w, h)
          const itemH1 = currentImageList[i]; if (itemH1.annotation) { drawAnnotation(ctx, itemH1.annotation, itemH1.annotationPos, x, y, w, h, fontScale) }
          currentX += scaledWidth + spacing.value
        } else if (uniformWidth.value) {
          // 统一宽度：按比例缩放图片到统一宽度
          const maxWidth = Math.max(...images.map(img => img.width))
          const scale = maxWidth / img.width
          const scaledHeight = Math.floor(img.height * scale)
          const x = Math.floor(currentX)
          const y = Math.floor((maxHeight - scaledHeight) / 2)
          const w = Math.floor(maxWidth)
          const h = Math.floor(scaledHeight)
          
          console.log(`绘制图片 ${i}:`, { x, y, w, h, scale, originalSize: { width: img.width, height: img.height } })
          
          ctx.drawImage(img, x, y, w, h)
          const itemH2 = currentImageList[i]; if (itemH2.annotation) { drawAnnotation(ctx, itemH2.annotation, itemH2.annotationPos, x, y, w, h, fontScale) }
          currentX += maxWidth + spacing.value
        } else {
          // 保持原尺寸：居中对齐
          const x = Math.floor(currentX)
          const y = Math.floor((maxHeight - img.height) / 2)
          
          console.log(`绘制图片 ${i}:`, { x, y, width: img.width, height: img.height })
          
          ctx.drawImage(img, x, y)
          currentX += img.width + spacing.value
          const itemH3 = currentImageList[i]; if (itemH3.annotation) { drawAnnotation(ctx, itemH3.annotation, itemH3.annotationPos, x, y, img.width, img.height, fontScale) }
        }
        
        // 更新进度
        processingProgress.value = 50 + Math.floor(((i + 1) / images.length) * 40)
        
        // 让出控制权，避免阻塞UI
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }
    }
    
    // 生成最终图片
    processingProgress.value = 90

    console.log('Canvas尺寸:', canvas.width, 'x', canvas.height)

    // 输出图片压缩：以单张图片最大尺寸为基准，避免多图叠加后过度压缩
    try {
      const maxOutput = 2000
      let outputCanvas = canvas
      const maxImgDim = Math.max(...images.map(img => Math.max(img.width, img.height)))
      if (maxImgDim > maxOutput) {
        const s = maxOutput / maxImgDim
        const tw = Math.floor(canvas.width * s)
        const th = Math.floor(canvas.height * s)
        const tmp = document.createElement('canvas')
        tmp.width = tw
        tmp.height = th
        const tctx = tmp.getContext('2d')!
        tctx.imageSmoothingEnabled = true
        tctx.imageSmoothingQuality = 'high'
        tctx.drawImage(canvas, 0, 0, tw, th)
        outputCanvas = tmp
      }
      // 动态压缩：「图片数量 × 1MB」为目标（Base64 → 二进制换算）
      const maxBytes = imageList.value.length * 1024 * 1024
      const base64Target = Math.round(maxBytes * 4 / 3) + 50
      let quality = 1.0, url = outputCanvas.toDataURL('image/jpeg', quality)
      while (url.length > base64Target && quality > 0.15) {
        quality -= 0.05
        url = outputCanvas.toDataURL('image/jpeg', quality)
      }
      resultImage.value = url
      canvasRef.value = outputCanvas

      processingProgress.value = 100
      ElMessage.success(successMsg || (isAuto ? '已自动重新生成' : '长图生成完成！'))
    } catch (error) {
      console.error('生成图片失败:', error)
      ElMessage.error('生成图片失败，请重试')
    }
    
  } catch (e) {
    console.error(e)
    ElMessage.error('拼接失败，请重试')
  } finally {
    isProcessing.value = false
    processingProgress.value = 0
  }
}

// 下载结果
const downloadResult = () => {
  if (!resultImage.value) return

  const link = document.createElement('a')
  const now = new Date()
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`
  link.download = `长图拼接_${ts}.jpg`
  link.href = resultImage.value
  link.click()
}

// 复制图片到剪贴板（转 PNG 后写入，兼容性更好）
const copyImageToClipboard = async () => {
  if (!resultImage.value) return
  isCopying.value = true
  try {
    const blob = await (await fetch(resultImage.value)).blob()
    let finalSize = blob.size
    if (blob.type !== 'image/png') {
      const img = await createImageBitmap(blob)
      const cvs = document.createElement('canvas')
      cvs.width = img.width
      cvs.height = img.height
      const ctx = cvs.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const pngBlob = await new Promise<Blob>(resolve => cvs.toBlob(b => resolve(b!), 'image/png'))
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })])
      finalSize = pngBlob.size
    } else {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    }
    const s = finalSize < 1024 ? finalSize + 'B' : finalSize < 1048576 ? (finalSize / 1024).toFixed(1) + 'KB' : (finalSize / 1048576).toFixed(2) + 'MB'
    ElMessage.success(`已复制到剪贴板（${s}）`)
  } catch {
    ElMessage.error('复制失败，请手动下载')
  } finally {
    isCopying.value = false
  }
}

// 切换参数后自动重新生成长图（防抖）
const annotationSnapshot = computed(() =>
  imageList.value.map(i => i.annotation + '|' + i.annotationPos).join(',')
)
const imageOrderSnapshot = computed(() =>
  imageList.value.map(i => i.id).join(',')
)
let autoStitchTimer: ReturnType<typeof setTimeout> | null = null
let skipAutoStitch = false
watch([spacing, orientation, uniformSize, uniformWidth, annotationFontSize, annotationFontFamily, annotationColor, annotationSnapshot, imageOrderSnapshot], () => {
  if (skipAutoStitch) return
  if (resultImage.value && imageList.value.length >= 2) {
    if (autoStitchTimer) clearTimeout(autoStitchTimer)
    autoStitchTimer = setTimeout(() => stitchLongImage(true), 300)
  }
})

// 清空所有图片
const clearAll = () => {
  imageList.value = []
  resultImage.value = ''
  processingProgress.value = 0
  uploadProgress.value = 0
}

// 移除自动拼接功能，改为手动点击生成

onMounted(() => {
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)
})
</script>

<template>
  <div class="work-photo-stitching-long">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>工作照拼接 - 长图</span>
        </div>
      </template>

      <!-- 设置区域 -->
      <div class="settings-section">
        <div class="settings-container">
          <div class="settings-left">
            <div class="setting-item">
              <span class="label">排列方向：</span>
              <el-radio-group v-model="orientation">
                <el-radio-button value="horizontal">横向排列</el-radio-button>
                <el-radio-button value="vertical">纵向排列</el-radio-button>
              </el-radio-group>
            </div>
            <div class="setting-item">
              <span class="label">尺寸处理：</span>
              <el-radio-group v-model="uniformSize" @change="uniformWidth = false">
                <el-radio-button :value="true">统一尺寸</el-radio-button>
                <el-radio-button :value="false">保持原尺寸</el-radio-button>
              </el-radio-group>
            </div>
            <div v-if="!uniformSize" class="setting-item">
              <span class="label">统一宽度：</span>
              <el-switch 
                v-model="uniformWidth" 
                active-text="统一宽度" 
                inactive-text="保持原宽度"
              />
            </div>
            <div class="setting-item">
              <span class="label">图片间距：</span>
              <el-slider v-model="spacing" :min="0" :max="100" :step="5" style="width: 200px" />
              <span class="value">{{ spacing }}px</span>
            </div>
            <div class="setting-item">
              <span class="label">图片数量：</span>
              <span class="value">{{ imageList.length }} 张</span>
            </div>
            <div class="setting-item">
              <span class="label">操作提示：</span>
              <span class="value" style="color: #409eff;">调整参数后将自动生成图片</span>
            </div>
            <div class="upload-compact-area" @click="fileInput?.click()" :class="{ 'uploading': isUploading }">
              <el-icon><Plus /></el-icon>
              <span v-if="!isUploading">点击上传多张图片</span>
              <span v-else>正在处理图片...</span>
              <span class="paste-hint">或 Ctrl+V 粘贴</span>
              <input ref="fileInput" type="file" accept="image/*" multiple style="display: none" @change="handleFileSelect" />
            </div>
            <div v-if="isUploading" class="upload-progress">
              <el-progress :percentage="uploadProgress" :show-text="true" />
              <span class="progress-text">正在压缩和加载图片...</span>
            </div>

            <div class="annotation-controls">
              <div class="annotation-header">图片标注</div>
              <div class="annotation-style-controls">
                <div class="ann-style-item">
                  <span class="ann-style-label">字号：</span>
                  <el-slider v-model="annotationFontSize" :min="20" :max="50" :step="1" class="compact-slider" />
                </div>
                <div class="ann-style-item">
                  <span class="ann-style-label">字体：</span>
                  <el-select v-model="annotationFontFamily" size="small" class="font-select">
                    <el-option v-for="item in fontOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>
                <div class="ann-style-item">
                  <span class="ann-style-label">颜色：</span>
                  <el-color-picker v-model="annotationColor" show-alpha class="ann-color-picker" />
                </div>
              </div>
              <div class="action-row">
                <el-button type="primary" :disabled="imageList.length < 2" @click="() => stitchLongImage()" :loading="isProcessing">
                  {{ resultImage ? '重新生成' : '生成长图' }}
                </el-button>
                <el-button type="danger" :disabled="imageList.length === 0" @click="clearAll">
                  清空
                </el-button>
              </div>
              <div v-if="isProcessing" class="progress-info">
                <el-progress :percentage="processingProgress" :show-text="true" />
                <span class="progress-text">正在处理图片...</span>
              </div>
            </div>
          </div>

          <div class="settings-right">
            <h4>尺寸模式说明</h4>
            <div class="mode-item">
              <div class="mode-title">统一尺寸</div>
              <div class="mode-desc">
                <p>• 所有图片按比例缩放到相同尺寸</p>
                <p>• 横向排列：统一高度，宽度按比例调整</p>
                <p>• 纵向排列：统一宽度，高度按比例调整</p>
                <p>• 适合：需要整齐统一效果的场景</p>
              </div>
            </div>
            <div class="mode-item">
              <div class="mode-title">保持原尺寸 + 统一宽度</div>
              <div class="mode-desc">
                <p>• 所有图片宽度统一，高度保持原比例</p>
                <p>• 横向排列：垂直居中对齐</p>
                <p>• 纵向排列：水平居中对齐</p>
                <p>• 适合：保持图片原始比例的场景</p>
              </div>
            </div>
            <div class="mode-item">
              <div class="mode-title">保持原尺寸</div>
              <div class="mode-desc">
                <p>• 完全保持图片原始尺寸</p>
                <p>• 横向排列：垂直居中对齐</p>
                <p>• 纵向排列：水平居中对齐</p>
                <p>• 适合：需要保持图片原始清晰度的场景</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 图片列表 -->
      <div v-if="imageList.length > 0" class="image-list-section">
        <div class="section-title">图片列表（拖拽可调整排序）</div>
        <div class="image-list">
          <div
            v-for="(item, index) in imageList"
            :key="item.id"
            class="image-item"
            :class="{ 'is-dragging': draggedIdx === index, 'can-drop': draggedIdx !== null && draggedIdx !== index }"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragend="onDragEnd"
            @dragover="onDragOver(index, $event)"
            @drop="onDrop(index, $event)"
          >
            <div class="image-preview" draggable="false">
              <img :src="item.url" :alt="`图片 ${index + 1}`" draggable="false" />
            </div>
            <div class="image-info">
              <div class="image-name">{{ item.file.name }}</div>
              <div class="image-annotation-row" draggable="false">
                <el-select v-model="item.annotationPos" size="small" class="annotation-pos-select">
                  <el-option v-for="opt in positionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
                <el-input v-model="item.annotation" size="small" placeholder="标注文字" class="annotation-input" maxlength="20" />
              </div>
              <div class="image-actions" draggable="false">
                <el-button size="small" type="danger" @click="removeImage(item.id)">删除</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 拼接结果 -->
      <div v-if="resultImage" class="result-section">
        <div class="result-header">
          <span>拼接结果</span>
          <div class="result-actions">
            <el-button type="success" @click="copyImageToClipboard" :loading="isCopying">复制到剪贴板</el-button>
            <el-button type="primary" @click="downloadResult">下载长图</el-button>
          </div>
        </div>
        <div class="result-body">
          <div class="result-preview">
            <img 
              :src="resultImage" 
              :data-orientation="orientation"
              class="result-img" 
              alt="拼接结果" 
            />
          </div>
        </div>
      </div>

      <canvas ref="canvasRef" style="display: none"></canvas>
    </el-card>
  </div>
</template>

<style scoped>
.work-photo-stitching-long {
  padding: 20px;
}

.main-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
}

.action-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.progress-info {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 200px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
}


.settings-section {
  margin: 20px 0;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.settings-container {
  display: flex;
  gap: 30px;
}

.settings-left {
  flex: 1;
}

.settings-right {
  flex: 1;
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.settings-right h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.mode-item {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.mode-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.mode-title {
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
  font-size: 14px;
}

.mode-desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

.mode-desc p {
  margin: 4px 0;
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
  min-width: 100px;
}

.value {
  margin-left: 10px;
  color: #909399;
  font-size: 14px;
}

.upload-compact-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 18px 20px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
  color: #606266;
  font-size: 14px;
  margin-bottom: 4px;
}

.upload-compact-area:hover {
  border-color: #409eff;
  background: #f0f9ff;
  color: #409eff;
}

.upload-compact-area.uploading {
  border-color: #67c23a;
  background: #f0f9ff;
  cursor: not-allowed;
}

.upload-compact-area .el-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.upload-compact-area .paste-hint {
  font-size: 12px;
  color: #c0c4cc;
}

.upload-progress {
  margin-top: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.upload-progress .progress-text {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #606266;
}

.image-list-section {
  margin: 20px auto;
  max-width: 50%;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 15px;
}

.image-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  transition: box-shadow 0.3s;
  cursor: grab;
  user-select: none;
}

.image-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-item.is-dragging {
  opacity: 0.5;
  border-style: solid;
  border-color: #409eff;
}

.image-item.can-drop {
  border-style: solid;
  border-color: #67c23a;
  background-color: #f0f9eb;
}

.image-preview {
  width: 80px;
  height: 80px;
  margin-right: 15px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.image-name {
  font-size: 14px;
  color: #606266;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-actions {
  display: flex;
  gap: 8px;
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
}

.result-preview {
  display: flex;
  justify-content: center;
}

/* 纵向排列：图片宽度为容器一半，居中 */
.result-img[data-orientation="vertical"] {
  width: 50%;
  height: auto;
  display: block;
}

/* 横向排列时的样式 */
.result-img[data-orientation="horizontal"] {
  max-width: 100%;
  max-height: 60vh;
  width: auto;
  height: auto;
}

.result-img {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 纵向排列时的样式 */
.result-img[data-orientation="vertical"] {
  max-width: 100%;
  height: auto;
}

/* 横向排列时的样式 */
.result-img[data-orientation="horizontal"] {
  max-width: 100%;
  max-height: 60vh;
  width: auto;
  height: auto;
}


.image-annotation-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0;
}

.annotation-pos-select {
  width: 100px;
  flex-shrink: 0;
}

.annotation-input {
  flex: 1;
}

.annotation-input :deep(.el-input__inner) {
  font-size: 13px;
}

.annotation-controls {
  margin: 12px 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.annotation-header {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.annotation-style-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.ann-style-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ann-style-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.ann-style-item .compact-slider {
  width: 100px;
}

.font-select {
  width: 120px;
}

.font-select :deep(.el-input__wrapper) {
  padding: 0 8px;
}

.ann-color-picker {
  width: 36px;
  height: 28px;
}

.ann-color-picker :deep(.el-color-picker__trigger) {
  width: 36px;
  height: 28px;
  padding: 3px;
}

.annotation-label {
  position: absolute;
  z-index: 4;
  padding: 3px 6px;
  line-height: 1.3;
  pointer-events: none;
  max-width: calc(100% - 10px);
  word-break: break-word;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.annotation-label.pos-top-left { top: 4px; left: 4px; }
.annotation-label.pos-top-center { top: 4px; left: 50%; transform: translateX(-50%); white-space: nowrap; }
.annotation-label.pos-top-right { top: 4px; right: 4px; }
.annotation-label.pos-center { top: 50%; left: 50%; transform: translate(-50%, -50%); white-space: nowrap; }
.annotation-label.pos-bottom-left { bottom: 4px; left: 4px; }
.annotation-label.pos-bottom-center { bottom: 4px; left: 50%; transform: translateX(-50%); white-space: nowrap; }
.annotation-label.pos-bottom-right { bottom: 4px; right: 4px; }
</style>
