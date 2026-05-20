<script setup lang="ts">
import html2canvas from 'html2canvas'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { usePhotoStitchingStore } from '@/stores/photoStitching'

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
const imageList = computed({
  get: () => store.imageList,
  set: (value) => {
    store.imageList = value.map(item => ({ ...item }))
  }
})

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

const isExporting = ref(false)

// 通用的图片压缩函数
const compressImageGeneric = (canvas: HTMLCanvasElement, maxSize: number): string => {
  let quality = 1
  let compressedUrl = canvas.toDataURL('image/jpeg', quality)

  while (compressedUrl.length > maxSize && quality > 0.3) {
    quality -= 0.1
    compressedUrl = canvas.toDataURL('image/jpeg', quality)
  }

  return compressedUrl
}

// 压缩图片
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        const maxSize = 1200
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
        const compressedUrl = compressImageGeneric(canvas, 2 * 1024 * 1024)
        resolve(compressedUrl)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// 处理图片上传
const handleImageUpload = async (e: Event, index: number) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return

  const hasExistingImage = !!imageList.value[index].url

  if (hasExistingImage) {
    // 替换当前格子的图片
    const file = files[0]
    try {
      const compressedDataUrl = await compressImage(file)
      imageList.value[index].url = compressedDataUrl
    } catch (error) {
      console.error('图片压缩失败:', error)
      ElMessage.error(`图片 ${file.name} 压缩失败，将使用原始文件`)
      const reader = new FileReader()
      reader.onload = (e) => {
        imageList.value[index].url = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  } else {
    // 从当前格子开始填充空位
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
        const reader = new FileReader()
        reader.onload = (e) => {
          while (currentIndex < imageList.value.length && imageList.value[currentIndex].url) {
            currentIndex++
          }
          if (currentIndex < imageList.value.length) {
            imageList.value[currentIndex].url = e.target?.result as string
          }
        }
        reader.readAsDataURL(file)
      }
    }

    if (files.length > filesToProcess) {
      ElMessage.warning(`已上传 ${filesToProcess} 张图片，剩余 ${files.length - filesToProcess} 张图片未处理`)
    }
  }

  // 重置 input，允许重新选择同一文件
  ;(e.target as HTMLInputElement).value = ''
}

// 处理图片缩放
const handleScaleChange = (index: number, value: number | number[]) => {
  imageList.value[index].scale = Array.isArray(value) ? value[0] : value
}

// 导出图片
const exportImage = async () => {
  const element = document.getElementById('photo-container')
  if (element) {
    try {
      isExporting.value = true
      await new Promise(resolve => setTimeout(resolve, 100))
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: null
      })

      const url = canvas.toDataURL('image/jpeg', 1)
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
        <div class="text-controls">
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
            <div class="font-size-control">
              <span class="font-size-label">文本字号：</span>
              <el-slider
                v-model="fontSize"
                :min="20"
                :max="35"
                :step="1"
                @input="handleFontSizeChange"
                class="compact-slider"
              />
            </div>
            <div class="font-family-control">
              <span class="font-family-label">字体：</span>
              <el-select
                v-model="fontFamily"
                class="font-select"
                size="small"
              >
                <el-option
                  v-for="item in fontOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
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
              <el-color-picker
                v-model="textColor"
                show-alpha
                class="color-picker"
              />
            </div>
            <el-button
              type="danger"
              size="small"
              @click="store.resetState()"
              class="reset-button"
            >
              清除内容
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="exportImage"
              class="export-button"
            >
              导出图片
            </el-button>
          </div>
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
          <div class="banner-text" :style="{ fontSize: `${fontSize}px`, color: textColor, fontFamily: fontFamily }">
            <div class="first-line" :style="{ textAlign: firstLineAlign as 'center' | 'left' }">{{ firstLine }}</div>
            <div class="other-lines">{{ otherLines }}</div>
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
              <el-image
                v-if="item.url"
                :src="item.url"
                fit="cover"
              />
              <div v-else class="upload-placeholder">
                <el-icon>
                  <Plus />
                </el-icon>
                <span>点击上传图片</span>
              </div>
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
            <div class="scale-control">
              <span class="scale-label">缩放：</span>
              <el-slider
                v-model="item.scale"
                :min="1"
                :max="1.5"
                :step="0.05"
                @input="handleScaleChange(index, $event)"
                @click.stop
              />
            </div>
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

.banner-logo {
  flex: 1;
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

.action-panel {
  margin-top: 20px;
  text-align: center;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.scale-control {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 3;
}

.scale-control .scale-label {
  font-size: 14px;
  color: #606266;
  line-height: 1;
  margin-bottom: 0;
}

.scale-control :deep(.el-slider) {
  flex: 1;
  margin: 0;
}

.scale-control :deep(.el-slider__runway) {
  margin: 0;
}

.photo-container.is-exporting .scale-control {
  display: none;
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
  align-items: center;
  gap: 20px;
  padding: 0 12px;
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

.reset-button {
  margin-left: 0;
}

.export-button {
  margin-left: 0;
}
</style>
