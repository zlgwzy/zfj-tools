import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ImageItem {
  id: number
  url: string
  scale: number
  order: number
  annotation: string
  annotationPos: string
}

function createImageList(count: number): ImageItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    url: '',
    scale: 1,
    order: i,
    annotation: '',
    annotationPos: 'bottom-right'
  }))
}

// 通用工厂函数创建 store
export function usePhotoStitchingStore(gridType: 2 | 4 | 6) {
  const storeId = `photoStitching${gridType}`

  return defineStore(storeId, () => {
    const description = ref('')
    const fontSize = ref(26)
    const textColor = ref('#f02f2f')
    const fontFamily = ref('STKaiti, KaiTi')
    const firstLineAlign = ref('left')
    const firstLineIndent = ref(true)
    const useTitleSize = ref(false)
    const titleFontSize = ref(35)
    const useArtText = ref(false)
    const useHybridMode = ref(false)
    const artTextUrl = ref('')
    const artTextScale = ref(1)
    const artTextX = ref(0)
    const artTextY = ref(16)
    const annotationFontSize = ref(20)
    const annotationFontFamily = ref('STHeiti, SimHei')
    const annotationColor = ref('#ff0000')
    const imageList = ref<ImageItem[]>(createImageList(gridType))

    const resetState = () => {
      description.value = ''
      fontSize.value = 26
      textColor.value = '#f02f2f'
      fontFamily.value = 'STKaiti, KaiTi'
      firstLineAlign.value = 'left'
      firstLineIndent.value = true
      useTitleSize.value = false
      titleFontSize.value = 35
      useHybridMode.value = false
      artTextUrl.value = ''
      artTextScale.value = 1
      artTextX.value = 0
      artTextY.value = 16
      annotationFontSize.value = 25
      annotationFontFamily.value = 'STHeiti, SimHei'
      annotationColor.value = '#ff0000'
      imageList.value = createImageList(gridType)
    }

    return {
      description,
      fontSize,
      textColor,
      fontFamily,
      firstLineAlign,
      firstLineIndent,
      useTitleSize,
      titleFontSize,
      useArtText,
      useHybridMode,
      artTextUrl,
      artTextScale,
      artTextX,
      artTextY,
      annotationFontSize,
      annotationFontFamily,
      annotationColor,
      imageList,
      resetState
    }
  })()
}

// 2图拼接的store（保持兼容）
export const usePhotoStitching2Store = defineStore('photoStitching2', () => {
  const description = ref('')
  const fontSize = ref(26)
  const textColor = ref('#f02f2f')
  const fontFamily = ref('STKaiti, KaiTi')
  const firstLineAlign = ref('center')
  const imageList = ref<ImageItem[]>(createImageList(2))

  const resetState = () => {
    description.value = ''
    fontSize.value = 26
    textColor.value = '#f02f2f'
    fontFamily.value = 'STKaiti, KaiTi'
    firstLineAlign.value = 'center'
    imageList.value = createImageList(2)
  }

  return {
    description,
    fontSize,
    textColor,
    fontFamily,
    firstLineAlign,
    imageList,
    resetState
  }
})

