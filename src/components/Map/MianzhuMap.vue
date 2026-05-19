<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { ElMessage } from 'element-plus'

const mapContainer = ref<HTMLElement | null>(null)
let map: any = null
let resizeObserver: ResizeObserver | null = null

// 地图配置
const mapConfig = {
  key: '6cf8b9723492201099a9f3958c172763',  // 您的 Web API key
  version: '2.0',
  plugins: ['AMap.Scale', 'AMap.ToolBar'],
  securityJsCode: '1f2051f88234c90fd5a740ae12904023',  // 需要替换为您的安全密钥
}

// 绵竹市中心坐标
const MIANZHUSHI_CENTER = [104.209089, 31.332041]

// 初始化地图
const initMap = async () => {
  try {
    await nextTick()
    
    const AMap = await AMapLoader.load(mapConfig)
    
    map = new AMap.Map(mapContainer.value, {
      zoom: 16.5,
      center: MIANZHUSHI_CENTER,
      resizeEnable: true,
      viewMode: '2D',
      renderOptions: {
        willReadFrequently: true,
        preserveDrawingBuffer: true,
        antialias: true,
        alpha: true
      },
      enableHighResolution: true,
      enableWebGL: true,
      preloadMode: true,
      animateEnable: false,
      dragEnable: true,
      zoomEnable: true,
      doubleClickZoom: true,
      keyboardEnable: false,
      scrollWheel: true,
      touchZoom: true,
      showIndoorMap: false,
      isHotspot: false,
      defaultCursor: 'default',
      showBuildingBlock: false,
      showLabel: true,
      jogEnable: false
    })

    // 添加比例尺控件
    map.addControl(new AMap.Scale())

    // 添加工具条控件
    map.addControl(new AMap.ToolBar({
      position: 'RB'
    }))

    // 确保地图正确渲染
    setTimeout(() => {
      map.resize()
    }, 200)

    ElMessage.success('地图加载成功')
  } catch (error) {
    console.error('地图加载失败:', error)
    ElMessage.error('地图加载失败，请刷新页面重试')
  }
}

// 组件挂载时初始化地图
onMounted(() => {
  setTimeout(() => {
    initMap()
  }, 100)
})

// 组件卸载前销毁地图实例和观察器
onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (map) {
    map.destroy()
    map = null
  }
})
</script>

<template>
  <div class="map-container">
    <el-card class="map-card">
      <template #header>
        <div class="card-header">
          <h2><el-icon><Location /></el-icon> 绵竹市地图</h2>
        </div>
      </template>
      <div ref="mapContainer" class="amap-container"></div>
    </el-card>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  padding: 0;
  /* 添加硬件加速 */
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000;
  will-change: transform;
}

.map-card {
  height: 100%;
  border-radius: 0;
}

:deep(.el-card__body) {
  height: calc(100% - 60px);
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.amap-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* 添加硬件加速 */
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000;
  will-change: transform;
}

/* 优化地图容器性能 */
:deep(.amap-container canvas) {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: optimizeQuality;
  /* 添加硬件加速 */
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000;
  will-change: transform;
}
</style> 