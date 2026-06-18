<script setup lang="ts">
import html2canvas from 'html2canvas'
import { ref, computed, watch, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { usePhotoStitchingStore } from '@/stores/photoStitching'
import artTextImg from '@/assets/art_fonts/美酒名城画境绵竹-执法版.png'

// 艺术字模板列表
const artTextTemplates = [
  { name: '美酒名城·画境绵竹\n执法版', file: artTextImg }
]

// 选择艺术字模板
const selectArtTextTemplate = (url: string) => {
  artTextUrl.value = url
}

const props = defineProps<{
  gridType: 4 | 6
}>()

// 使用通用store
const store = usePhotoStitchingStore(props.gridType)

// 使用store中的状态
const description = computed({
  get: () => store.description,
  set: (value: string) => store.description = value
})
const fontSize = computed({
  get: () => store.fontSize,
  set: (value: number) => store.fontSize = value
})
const textColor = computed({
  get: () => store.textColor,
  set: (value: string) => store.textColor = value
})
const fontFamily = computed({
  get: () => store.fontFamily,
  set: (value: string) => store.fontFamily = value
})
const firstLineAlign = computed({
  get: () => store.firstLineAlign,
  set: (value: string) => store.firstLineAlign = value
})
const firstLineIndent = computed({
  get: () => store.firstLineIndent,
  set: (value: boolean) => store.firstLineIndent = value
})
const useTitleSize = computed({
  get: () => store.useTitleSize,
  set: (value: boolean) => store.useTitleSize = value
})
const titleFontSize = computed({
  get: () => store.titleFontSize,
  set: (value: number) => store.titleFontSize = value
})
const useArtText = computed({
  get: () => store.useArtText,
  set: (value: boolean) => store.useArtText = value
})
const useHybridMode = computed({
  get: () => store.useHybridMode,
  set: (value: boolean) => store.useHybridMode = value
})
const displayMode = computed({
  get: () => {
    if (!useArtText.value) return 'text'
    return useHybridMode.value ? 'hybrid' : 'art'
  },
  set: (val: string) => {
    useArtText.value = val !== 'text'
    useHybridMode.value = val === 'hybrid'
  }
})
const artTextUrl = computed({
  get: () => store.artTextUrl,
  set: (value: string) => store.artTextUrl = value
})
const artTextScale = computed({
  get: () => store.artTextScale,
  set: (value: number) => store.artTextScale = value
})
const artTextX = computed({
  get: () => store.artTextX,
  set: (value: number) => store.artTextX = value
})
const artTextY = computed({
  get: () => store.artTextY,
  set: (value: number) => store.artTextY = value
})
const annotationFontSize = computed({
  get: () => store.annotationFontSize,
  set: (value: number) => store.annotationFontSize = value
})
const annotationFontFamily = computed({
  get: () => store.annotationFontFamily,
  set: (value: string) => store.annotationFontFamily = value
})
const annotationColor = computed({
  get: () => store.annotationColor,
  set: (value: string) => store.annotationColor = value
})
const imageList = computed({
  get: () => store.imageList,
  set: (value) => {
    store.imageList = value.map(item => ({ ...item }))
  }
})

// 标注位置选项
const positionOptions = [
  { value: 'top-left', label: '左上角' },
  { value: 'top-center', label: '顶部居中' },
  { value: 'top-right', label: '右上角' },
  { value: 'center', label: '居中' },
  { value: 'bottom-left', label: '左下角' },
  { value: 'bottom-center', label: '底部居中' },
  { value: 'bottom-right', label: '右下角' }
]

// 字体选项列表
const fontOptions = [
  { value: 'PingFang SC, Microsoft YaHei', label: '微软雅黑' },
  { value: 'STSong, SimSun', label: '宋体' },
  { value: 'STHeiti, SimHei', label: '黑体' },
  { value: 'STKaiti, KaiTi', label: '楷体' },
  { value: 'STFangsong, FangSong', label: '仿宋' }
]

// 计算第一行和其他行
const firstLine = computed(() => {
  return description.value.split('\n')[0] || ''
})

const otherLines = computed(() => {
  const lines = description.value.split('\n')
  return lines.length > 1 ? lines.slice(1).join('\n') : ''
})

// 计算行号
const lineNumbers = computed(() => {
  const lines = description.value.split('\n')
  return Array.from({ length: Math.min(lines.length, 4) }, (_, i) => i + 1)
})

// 处理文本输入
const handleInput = (value: string) => {
  if (value.length > 200) {
    description.value = value.slice(0, 200)
    return
  }

  // 限制最多4行
  const lines = value.split('\n')
  if (lines.length > 4) {
    description.value = lines.slice(0, 4).join('\n')
  }
}

// 处理字体大小变化
const handleFontSizeChange = (value: number | number[]) => {
  fontSize.value = Array.isArray(value) ? value[0] : value
}

// 艺术字拖拽
const isDraggingArtText = ref(false)
const dragStartMouseX = ref(0)
const dragStartMouseY = ref(0)
const dragStartArtX = ref(0)
const dragStartArtY = ref(0)

const onArtTextMouseDown = (e: MouseEvent) => {
  if (isExporting.value) return
  isDraggingArtText.value = true
  dragStartMouseX.value = e.clientX
  dragStartMouseY.value = e.clientY
  dragStartArtX.value = artTextX.value
  dragStartArtY.value = artTextY.value
  document.addEventListener('mousemove', onArtTextMouseMove)
  document.addEventListener('mouseup', onArtTextMouseUp)
}

const onArtTextMouseMove = (e: MouseEvent) => {
  if (!isDraggingArtText.value) return
  const dx = e.clientX - dragStartMouseX.value
  const dy = e.clientY - dragStartMouseY.value
  artTextX.value = Math.round(dragStartArtX.value + dx)
  artTextY.value = Math.round(dragStartArtY.value + dy)
}

const onArtTextMouseUp = () => {
  isDraggingArtText.value = false
  document.removeEventListener('mousemove', onArtTextMouseMove)
  document.removeEventListener('mouseup', onArtTextMouseUp)
}

// 组件卸载时清理拖拽事件
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onArtTextMouseMove)
  document.removeEventListener('mouseup', onArtTextMouseUp)
})

const isExporting = ref(false)
const isCopying = ref(false)
const showAnnotation = ref(false)

// 关闭标注时清除已填写内容
watch(showAnnotation, (val) => {
  if (!val) {
    imageList.value.forEach(item => { item.annotation = ''; item.annotationPos = 'bottom-right' })
  }
})

// 是否有已上传的图片
const hasImages = computed(() => imageList.value.some(item => !!item.url))

// DataURL 的实际二进制大小（Base64 → 字节）
const realSize = (dataUrl: string) => Math.round(dataUrl.split(',')[1].length * 3 / 4)

// 通用的图片压缩函数（精细降质 + 分辨率缩放兜底）
const compressImageGeneric = (canvas: HTMLCanvasElement, maxSize: number, initialQuality = 1): string => {
  let quality = initialQuality
  let compressedUrl = canvas.toDataURL('image/jpeg', quality)

  while (realSize(compressedUrl) > maxSize && quality > 0.5) {
    quality -= 0.05
    compressedUrl = canvas.toDataURL('image/jpeg', quality)
  }

  // 降到最低质量仍然超过目标 → 缩小分辨率
  let cvs = canvas
  while (realSize(compressedUrl) > maxSize && cvs.width > 200) {
    const s = 0.8
    const tmp = document.createElement('canvas')
    tmp.width = Math.floor(cvs.width * s)
    tmp.height = Math.floor(cvs.height * s)
    tmp.getContext('2d')!.drawImage(cvs, 0, 0, tmp.width, tmp.height)
    cvs = tmp
    quality = initialQuality
    compressedUrl = cvs.toDataURL('image/jpeg', quality)
    while (realSize(compressedUrl) > maxSize && quality > 0.5) {
      quality -= 0.05
      compressedUrl = cvs.toDataURL('image/jpeg', quality)
    }
  }

  return compressedUrl
}

// 压缩图片（小于 1MB 不压缩直接读取）
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size < 3 * 1024 * 1024) {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        const maxSize = 2000
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          } else {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const compressedUrl = compressImageGeneric(canvas, 3 * 1024 * 1024, 0.92)
        resolve(compressedUrl)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// 压缩失败时的兜底：直接读取原始文件
const fallbackReadFile = (file: File, idx: number) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    if (idx >= 0 && idx < imageList.value.length) {
      imageList.value[idx].url = e.target?.result as string
    }
  }
  reader.readAsDataURL(file)
}

// 处理图片上传
const handleImageUpload = async (e: Event, index: number) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return

  const hasExistingImage = !!imageList.value[index].url

  if (hasExistingImage) {
    const file = files[0]
    try {
      const compressedDataUrl = await compressImage(file)
      imageList.value[index].url = compressedDataUrl
    } catch (error) {
      console.error('图片压缩失败:', error)
      ElMessage.error(`图片 ${file.name} 压缩失败，将使用原始文件`)
      fallbackReadFile(file, index)
    }
  } else {
    const remainingSlots = imageList.value.filter(img => !img.url).length
    const filesToProcess = Math.min(files.length, remainingSlots)

    let currentIndex = index
    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i]
      try {
        const compressedDataUrl = await compressImage(file)
        while (currentIndex < imageList.value.length && imageList.value[currentIndex].url) {
          currentIndex++
        }
        if (currentIndex < imageList.value.length) {
          imageList.value[currentIndex].url = compressedDataUrl
        }
      } catch (error) {
        console.error('图片压缩失败:', error)
        ElMessage.error(`图片 ${file.name} 压缩失败，将使用原始文件`)
        while (currentIndex < imageList.value.length && imageList.value[currentIndex].url) {
          currentIndex++
        }
        fallbackReadFile(file, currentIndex)
      }
    }

    if (files.length > filesToProcess) {
      ElMessage.warning(`已上传 ${filesToProcess} 张图片，剩余 ${files.length - filesToProcess} 张图片未处理`)
    }
  }

  ;(e.target as HTMLInputElement).value = ''
}

// 剪贴板粘贴图片
const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      if (!blob) continue
      try {
        const url = await compressImage(blob)
        // 填充到第一个空位
        const idx = imageList.value.findIndex(item => !item.url)
        if (idx >= 0) {
          imageList.value[idx].url = url
        } else {
          ElMessage.warning('所有位置已满')
        }
      } catch {
        ElMessage.error('图片处理失败')
      }
      break
    }
  }
}

onMounted(() => document.addEventListener('paste', handlePaste))
onUnmounted(() => document.removeEventListener('paste', handlePaste))

// 导出图片
const exportImage = async () => {
  // 艺术字模式下未上传艺术字时阻止导出
  if (displayMode.value !== 'text' && !artTextUrl.value) {
    ElMessage.warning('请先上传艺术字图片')
    return
  }

  const element = document.getElementById('photo-container')
  if (element) {
    try {
      isExporting.value = true
      await new Promise(resolve => setTimeout(resolve, 100))
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 3,
        backgroundColor: null
      })

      const url = compressImageGeneric(canvas, 5 * 1024 * 1024)
      const link = document.createElement('a')

      const now = new Date()
      const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
      link.download = `${description.value || '工作照片'}_${timeStr}.jpg`
      link.href = url
      link.click()
    } catch (error) {
      console.error('导出图片失败:', error)
      ElMessage.error('导出图片失败，请稍后重试')
    } finally {
      isExporting.value = false
    }
  }
}

// 复制到剪贴板
const copyToClipboard = async () => {
  const element = document.getElementById('photo-container')
  if (!element) return
  isCopying.value = true
  try {
    element.classList.add('is-exporting')
    let canvas = await html2canvas(element, {
      useCORS: true,
      scale: 2,
      backgroundColor: null
    })
    const maxClip = 2000
    if (canvas.width > maxClip || canvas.height > maxClip) {
      const s = maxClip / Math.max(canvas.width, canvas.height)
      const tmp = document.createElement('canvas')
      tmp.width = Math.floor(canvas.width * s)
      tmp.height = Math.floor(canvas.height * s)
      tmp.getContext('2d')!.drawImage(canvas, 0, 0, tmp.width, tmp.height)
      canvas = tmp
    }
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    const sz = blob.size < 1024 ? blob.size + 'B' : blob.size < 1048576 ? (blob.size / 1024).toFixed(1) + 'KB' : (blob.size / 1048576).toFixed(2) + 'MB'
    ElMessage.success(`已复制到剪贴板（${sz}）`)
  } catch {
    ElMessage.error('复制失败')
  } finally {
    element.classList.remove('is-exporting')
    isCopying.value = false
  }
}

// 拖拽状态
const draggedItem = ref<null | number>(null)

const handleDragStart = (index: number) => {
  if (!imageList.value[index].url) return
  draggedItem.value = index
}

const handleDragEnd = () => {
  draggedItem.value = null
}

const handleDragOver = (index: number, e: DragEvent) => {
  e.preventDefault()
  if (draggedItem.value !== null && draggedItem.value !== index) {
    e.dataTransfer!.dropEffect = 'move'
  }
}

const handleDrop = (targetIndex: number, e: DragEvent) => {
  e.preventDefault()
  if (draggedItem.value === null || draggedItem.value === targetIndex) return

  const sourceIndex = draggedItem.value
  const newList = [...imageList.value]

  const temp = { ...newList[sourceIndex] }
  newList[sourceIndex] = { ...newList[targetIndex] }
  newList[targetIndex] = temp

  imageList.value = newList
  draggedItem.value = null
}

// 根据 gridType 计算 grid 样式
const gridStyle = computed(() => {
  if (props.gridType === 6) {
    return {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)'
    }
  }
  return {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)'
  }
})
</script>

<template>
  <div class="work-photo-stitching">
    <el-card class="tool-container">
      <div class="control-panel">
        <div class="mode-switch">
          <span class="mode-label">显示模式：</span>
          <el-radio-group v-model="displayMode" class="mode-radio-group">
            <el-radio-button value="text">文字</el-radio-button>
            <el-radio-button value="art">艺术字</el-radio-button>
            <el-radio-button value="hybrid">混合模式</el-radio-button>
          </el-radio-group>
        </div>

        <div v-if="displayMode === 'text'" class="text-controls">
          <div class="textarea-container">
            <div class="line-numbers">
              <div v-for="num in lineNumbers" :key="num" class="line-number">{{ num }}</div>
            </div>
            <el-input
              v-model="description"
              type="textarea"
              :rows="4"
              :maxlength="200"
              show-word-limit
              resize="none"
              @input="handleInput"
              placeholder="请在这里输入工作动态相关内容！（首行默认居中对齐，输入文字限制200字以内，可通过回车键进行换行）"
              class="text-input"
            />
          </div>
          <div class="text-style-controls">
            <div class="style-row-main">
              <div class="font-size-control">
                <span class="font-size-label">文本字号：</span>
                <el-slider v-model="fontSize" :min="20" :max="35" :step="1" @input="handleFontSizeChange" class="compact-slider" />
              </div>
              <div class="font-family-control">
                <span class="font-family-label">字体：</span>
                <el-select v-model="fontFamily" class="font-select" size="small">
                  <el-option v-for="item in fontOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </div>
              <div class="align-control">
                <span class="align-label">首行对齐：</span>
                <el-radio-group v-model="firstLineAlign" size="small">
                  <el-radio-button value="center">居中</el-radio-button>
                  <el-radio-button value="left">左对齐</el-radio-button>
                </el-radio-group>
              </div>
              <div class="color-control">
                <span class="color-label">文本颜色：</span>
                <el-color-picker v-model="textColor" show-alpha class="color-picker" />
              </div>
            </div>
            <div class="style-row-sub">
              <div class="indent-control">
                <span class="indent-label">行首缩进：</span>
                <el-switch v-model="firstLineIndent" />
              </div>
              <div class="indent-control">
                <span class="indent-label">启用标题：</span>
                <el-switch v-model="useTitleSize" />
              </div>
              <div v-if="useTitleSize" class="indent-control">
                <span class="indent-label">标题字号：</span>
                <el-slider v-model="titleFontSize" :min="26" :max="50" :step="1" class="title-size-slider" />
              </div>
              <div class="annotation-toggle">
                <span class="annotation-toggle-label">图片标注：</span>
                <el-switch v-model="showAnnotation" active-text="开启" inactive-text="关闭" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="displayMode !== 'text'" class="art-text-controls">
          <div class="template-section">
            <span class="template-section-label">选择艺术字模板：</span>
            <div class="template-grid">
              <div
                v-for="(tpl, idx) in artTextTemplates"
                :key="idx"
                class="template-card"
                :class="{ 'is-active': artTextUrl === tpl.file }"
                @click="selectArtTextTemplate(tpl.file)"
              >
                <el-image :src="tpl.file" fit="contain" class="template-thumb" />
                <span class="template-name">{{ tpl.name }}</span>
              </div>
            </div>
          </div>
          <div v-if="artTextUrl" class="art-text-adjust-controls">
            <div class="art-text-scale-control">
              <span class="art-text-scale-label">缩放：</span>
              <el-slider
                v-model="artTextScale"
                :min="0.3"
                :max="3"
                :step="0.1"
                class="compact-slider"
              />
            </div>
            <el-button size="small" @click="artTextUrl = ''">清除模板</el-button>
            <span class="art-text-drag-hint">拖拽艺术字可自由移动位置</span>
          </div>
        </div>

        <div v-if="displayMode === 'hybrid'" class="text-controls">
          <div class="textarea-container">
            <div class="line-numbers">
              <div v-for="num in lineNumbers" :key="num" class="line-number">{{ num }}</div>
            </div>
            <el-input
              v-model="description"
              type="textarea"
              :rows="4"
              :maxlength="200"
              show-word-limit
              resize="none"
              @input="handleInput"
              placeholder="请在这里输入工作动态相关内容！（首行默认居中对齐，输入文字限制200字以内，可通过回车键进行换行）"
              class="text-input"
            />
          </div>
          <div class="text-style-controls">
            <div class="style-row-main">
              <div class="font-size-control">
                <span class="font-size-label">文本字号：</span>
                <el-slider v-model="fontSize" :min="20" :max="35" :step="1" @input="handleFontSizeChange" class="compact-slider" />
              </div>
              <div class="font-family-control">
                <span class="font-family-label">字体：</span>
                <el-select v-model="fontFamily" class="font-select" size="small">
                  <el-option v-for="item in fontOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </div>
            </div>
            <div class="style-row-sub">
              <div class="indent-control">
                <span class="indent-label">行首缩进：</span>
                <el-switch v-model="firstLineIndent" />
              </div>
              <div class="indent-control">
                <span class="indent-label">启用标题：</span>
                <el-switch v-model="useTitleSize" />
              </div>
              <div v-if="useTitleSize" class="indent-control">
                <span class="indent-label">标题字号：</span>
                <el-slider v-model="titleFontSize" :min="26" :max="50" :step="1" class="title-size-slider" />
              </div>
              <div class="color-control">
                <span class="color-label">文本颜色：</span>
                <el-color-picker v-model="textColor" show-alpha class="color-picker" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="showAnnotation" class="annotation-controls">
          <div class="annotation-header">图片标注</div>
          <div class="annotation-style-controls">
            <div class="ann-style-item">
              <span class="ann-style-label">字号：</span>
              <el-slider
                v-model="annotationFontSize"
                :min="20"
                :max="50"
                :step="1"
                class="compact-slider"
              />
            </div>
            <div class="ann-style-item">
              <span class="ann-style-label">字体：</span>
              <el-select
                v-model="annotationFontFamily"
                size="small"
                class="font-select"
              >
                <el-option
                  v-for="item in fontOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>
            <div class="ann-style-item">
              <span class="ann-style-label">颜色：</span>
              <el-color-picker
                v-model="annotationColor"
                show-alpha
                class="ann-color-picker"
              />
            </div>
          </div>
          <div
            v-for="(item, index) in imageList"
            :key="item.id"
            class="annotation-row"
          >
            <span class="annotation-index">图{{ index + 1 }}</span>
            <el-select
              v-model="item.annotationPos"
              size="small"
              class="annotation-pos-select"
            >
              <el-option
                v-for="opt in positionOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-input
              v-model="item.annotation"
              size="small"
              placeholder="输入标注文字"
              class="annotation-input"
              maxlength="20"
            />
          </div>
        </div>

        <div class="action-buttons">
          <el-button type="success" :disabled="!hasImages" @click="copyToClipboard" :loading="isCopying">
            复制到剪贴板
          </el-button>
          <el-button type="primary" :disabled="!hasImages" @click="exportImage">
            导出图片
          </el-button>
          <el-button type="danger" :disabled="!hasImages" @click="store.resetState()">
            清除内容
          </el-button>
        </div>
      </div>

      <div id="photo-container" class="photo-container" :class="{ 'is-exporting': isExporting }">
        <div class="photo-banner">
          <div class="banner-logo">
            <el-image
              src="/logo.png"
              fit="contain"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon>
                    <PictureFilled />
                  </el-icon>
                </div>
              </template>
            </el-image>
          </div>
          <div class="banner-content">
            <template v-if="displayMode === 'text'">
              <div class="banner-text" :style="{ fontSize: `${fontSize}px`, color: textColor, fontFamily: fontFamily }">
                <div :class="['first-line', useTitleSize ? 'title-active' : '']" :style="{ textAlign: useTitleSize ? 'center' : (firstLineAlign as 'center' | 'left'), textIndent: useTitleSize ? '0' : (firstLineIndent ? '2em' : '0'), fontSize: useTitleSize ? titleFontSize + 'px' : '' }">{{ firstLine }}</div>
                <div class="other-lines" :style="{ textIndent: firstLineIndent ? '2em' : '0' }">{{ otherLines }}</div>
              </div>
            </template>
            <div v-if="displayMode !== 'text' && !artTextUrl" class="banner-art-text-placeholder">
              <span>请上传艺术字</span>
            </div>
            <div
              v-if="displayMode !== 'text' && artTextUrl"
              class="art-text-overlay"
              :style="{
                left: `calc(50% + ${artTextX}px)`,
                top: `calc(50% + ${artTextY}px)`,
                transform: `translate(-50%, -50%) scale(${artTextScale})`,
                cursor: isDraggingArtText ? 'grabbing' : 'grab'
              }"
              @mousedown="onArtTextMouseDown"
            >
              <img :src="artTextUrl" class="art-text-overlay-img" draggable="false" />
            </div>
          </div>
        </div>
        <div v-if="displayMode === 'hybrid'" class="hybrid-text-banner">
          <div class="banner-text" :style="{ fontSize: `${fontSize}px`, color: textColor, fontFamily: fontFamily }">
            <div :class="['first-line', useTitleSize ? 'title-active' : '']" :style="{ textAlign: useTitleSize ? 'center' : (firstLineAlign as 'center' | 'left'), textIndent: useTitleSize ? '0' : (firstLineIndent ? '2em' : '0'), fontSize: useTitleSize ? titleFontSize + 'px' : '' }">{{ firstLine }}</div>
            <div class="other-lines" :style="{ textIndent: firstLineIndent ? '2em' : '0' }">{{ otherLines }}</div>
          </div>
        </div>
        <div class="photo-grid" :style="gridStyle">
          <div
            v-for="(item, index) in imageList"
            :key="item.id"
            class="photo-item"
            :class="{
              'is-dragging': draggedItem === index,
              'can-drop': draggedItem !== null && draggedItem !== index && item.url
            }"
            draggable="true"
            @dragstart="handleDragStart(index)"
            @dragend="handleDragEnd"
            @dragover="handleDragOver(index, $event)"
            @drop="handleDrop(index, $event)"
          >
            <div class="image-container"
              :style="{
                transform: `scale(${item.scale})`,
                touchAction: 'none',
                willChange: 'transform'
              }"
            >
              <img
                v-if="item.url"
                :src="item.url"
                class="grid-image"
                draggable="false"
              />
              <div v-else class="upload-placeholder">
                <el-icon>
                  <Plus />
                </el-icon>
                <span>点击上传图片</span>
              </div>
            </div>
            <el-button
              v-if="item.url"
              class="delete-btn"
              size="small"
              type="danger"
              circle
              @click.stop="store.imageList[index].url = ''"
            >
              <el-icon><Close /></el-icon>
            </el-button>
            <div
              v-if="item.annotation"
              class="annotation-label"
              :class="'pos-' + item.annotationPos"
              :style="{
                fontSize: annotationFontSize + 'px',
                fontFamily: annotationFontFamily,
                color: annotationColor
              }"
            >
              {{ item.annotation }}
            </div>
            <input
              type="file"
              :id="'upload-' + index"
              class="file-input"
              accept="image/*"
              multiple
              @change="handleImageUpload($event, index)"
              @click.stop
            />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.work-photo-stitching {
  padding: 20px;
}

.tool-container {
  max-width: 1200px;
  margin: 0 auto;
}

.control-panel {
  margin-bottom: 20px;
}

.control-panel :deep(.el-textarea__inner) {
  font-size: 16px;
  line-height: 1.6;
  padding: 12px;
}

.photo-container {
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 20px;
  border: 1px solid #dcdfe6;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  position: relative;
}

.photo-container.is-exporting {
  background-color: #fff;
  box-shadow: none;
}

.photo-banner {
  background-color: #fff;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.hybrid-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

.hybrid-toggle-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.hybrid-text-banner {
  background-color: #fff;
  padding: 0 50px;
}

.hybrid-text-banner .banner-text {
  flex: none;
  width: 100%;
}

.banner-content {
  flex: 1;
  position: relative;
  min-height: 80px;
}

.banner-logo {
  flex: 0 0 auto;
  width: 300px;
  height: 100%;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0 0 0;
}

.banner-logo .el-image {
  width: 100%;
  height: 100%;
  min-height: 80px;
  object-fit: contain;
}

.banner-text {
  flex: 3;
  color: #f02f2f;
  font-size: 26px;
  font-weight: bold;
  line-height: 1.5;
  text-align: left;
  padding: 20px 0;
  white-space: pre-wrap;
}

.first-line {
  text-align: center;
}

.first-line.title-active {
  width: 100%;
  margin-bottom: 8px;
}

.other-lines {
  text-align: left;
}

.photo-grid {
  display: grid;
  gap: 20px;
  padding: 20px;
}

.photo-item {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
  border-radius: 4px;
  border: 2px dashed #dcdfe6;
  background-color: #f5f7fa;
  user-select: none;
  cursor: move;
  transition: all 0.2s ease;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 5;
  width: 24px;
  height: 24px;
  --el-button-size: 24px;
}

.photo-item.is-dragging {
  opacity: 0.5;
  transform: scale(0.98);
  border-style: solid;
  border-color: #409eff;
}

.photo-item.can-drop {
  border-style: solid;
  border-color: #67c23a;
  background-color: #f0f9eb;
}

.photo-container.is-exporting .photo-item {
  border: none;
}

.image-container {
  width: 100%;
  height: 100%;
  transition: none;
  transform-origin: center;
  user-select: none;
  touch-action: none;
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
  z-index: 1;
}

.el-image {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  cursor: pointer;
  pointer-events: none;
  font-size: 14px;
}

.upload-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.upload-placeholder span {
  font-size: 14px;
  line-height: 1.5;
}

.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  user-select: none;
  pointer-events: none;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}


.text-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 14px;
}

.textarea-container {
  display: flex;
  position: relative;
  width: 100%;
}

.line-numbers {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30px;
  background-color: #f5f7fa;
  border-right: 1px solid #dcdfe6;
  padding: 12px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
  user-select: none;
}

.line-number {
  height: 24px;
  line-height: 24px;
}

.text-input {
  flex: 1;
  margin-left: 30px;
}

.text-input :deep(.el-textarea__inner) {
  padding-left: 12px;
  font-size: 14px;
  line-height: 24px;
}

.text-style-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 12px;
}

.style-row-main {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.style-row-sub {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.font-size-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.font-size-label {
  font-size: 14px;
  color: #606266;
  min-width: 60px;
}

.font-family-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.font-family-label {
  font-size: 14px;
  color: #606266;
  min-width: 60px;
}

.font-select {
  width: 100px;
}

.font-select :deep(.el-input__wrapper) {
  padding: 0 8px;
}

.align-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.align-label {
  font-size: 14px;
  color: #606266;
  min-width: 60px;
}

.align-control :deep(.el-radio-group) {
  display: flex;
}

.align-control :deep(.el-radio-button__inner) {
  padding: 8px 12px;
}

.color-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-label {
  font-size: 14px;
  color: #606266;
  min-width: 60px;
}

.color-picker {
  width: 40px;
  height: 32px;
}

.indent-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-size-slider {
  width: 100px;
}

.title-size-slider :deep(.el-slider__runway) {
  margin: 0;
}

.title-size-slider :deep(.el-slider__bar) {
  height: 4px;
}

.title-size-slider :deep(.el-slider__button) {
  width: 12px;
  height: 12px;
}

.indent-label {
  font-size: 14px;
  color: #606266;
  min-width: 60px;
}

.color-picker :deep(.el-color-picker__trigger) {
  width: 40px;
  height: 32px;
  padding: 4px;
}

.compact-slider {
  width: 120px;
}

.compact-slider :deep(.el-slider__runway) {
  margin: 0;
}

.compact-slider :deep(.el-slider__bar) {
  height: 4px;
}

.compact-slider :deep(.el-slider__button) {
  width: 12px;
  height: 12px;
}

.mode-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  margin-bottom: 16px;
}

.mode-label {
  font-size: 14px;
  color: #606266;
  min-width: 60px;
}

.art-text-controls {
  padding: 0 12px;
}

.template-section {
  margin-bottom: 12px;
}

.template-section-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.template-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.template-card {
  width: 180px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.template-card.is-active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

.template-thumb {
  width: 100%;
  height: 100px;
  display: block;
}

.template-name {
  display: block;
  text-align: center;
  padding: 8px;
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
  white-space: pre-line;
}

.art-text-adjust-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  margin-top: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.art-text-scale-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.art-text-scale-label {
  font-size: 14px;
  color: #606266;
  min-width: 30px;
}

.art-text-drag-hint {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.art-text-adjust-controls .compact-slider {
  width: 120px;
}

.art-text-overlay {
  position: absolute;
  z-index: 10;
  line-height: 0;
  user-select: none;
  transform-origin: center center;
  will-change: transform;
}

.art-text-overlay:hover {
  outline: 2px dashed #409eff;
  outline-offset: 2px;
}

.art-text-overlay-img {
  max-width: 600px;
  max-height: 400px;
  pointer-events: none;
  display: block;
}

.annotation-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.annotation-toggle-label {
  font-size: 14px;
  color: #606266;
}

.annotation-controls {
  padding: 12px;
  margin-top: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.annotation-header {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.annotation-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.annotation-row:last-child {
  margin-bottom: 0;
}

.annotation-index {
  font-size: 13px;
  color: #606266;
  min-width: 36px;
  flex-shrink: 0;
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

.annotation-style-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0 10px;
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
  padding: 4px 8px;
  line-height: 1.4;
  pointer-events: none;
  max-width: calc(100% - 16px);
  word-break: break-word;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.annotation-label.pos-top-left {
  top: 8px;
  left: 8px;
}

.annotation-label.pos-top-right {
  top: 8px;
  right: 8px;
}

.annotation-label.pos-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}

.annotation-label.pos-bottom-left {
  bottom: 8px;
  left: 8px;
}

.annotation-label.pos-bottom-right {
  bottom: 8px;
  right: 8px;
}

.annotation-label.pos-top-center {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.annotation-label.pos-bottom-center {
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 10px;
  padding: 16px 12px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 16px;
}

.banner-art-text-placeholder {
  flex: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 16px;
  padding: 20px 0;
  min-height: 80px;
}
</style>
