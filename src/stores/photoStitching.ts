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
    const firstLineAlign = ref('center')
    const useArtText = ref(false)
    const artTextUrl = ref('')
    const artTextScale = ref(1)
    const artTextX = ref(20)
    const artTextY = ref(60)
    const annotationFontSize = ref(14)
    const annotationFontFamily = ref('STKaiti, KaiTi')
    const annotationColor = ref('#ffffff')
    const imageList = ref<ImageItem[]>(createImageList(gridType))

    const resetState = () => {
      description.value = ''
      fontSize.value = 26
      textColor.value = '#f02f2f'
      fontFamily.value = 'STKaiti, KaiTi'
      firstLineAlign.value = 'center'
      artTextUrl.value = ''
      artTextScale.value = 1
      artTextX.value = 20
      artTextY.value = 60
      annotationFontSize.value = 14
      annotationFontFamily.value = 'STKaiti, KaiTi'
      annotationColor.value = '#ffffff'
      imageList.value = createImageList(gridType)
    }

    return {
      description,
      fontSize,
      textColor,
      fontFamily,
      firstLineAlign,
      useArtText,
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

