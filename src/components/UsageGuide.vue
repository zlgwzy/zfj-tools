<script setup lang="ts">
import { ref } from 'vue'

const currentFeature = ref(0)

const features = [
  {
    name: '工作照拼接-四宫格',
    icon: 'Grid',
    desc: '将4张工作照片拼接为2×2网格布局，支持文字标题、艺术字和图片标注。',
    steps: [
      { icon: 'Upload', text: '点击每个格子或 Ctrl+V 粘贴图片，支持拖拽排序' },
      { icon: 'Edit', text: '输入工作动态文本（最多200字，支持4行），调整字号、字体、颜色' },
      { icon: 'MagicStick', text: '可选艺术字模式，选择模板后拖拽调整位置和缩放' },
      { icon: 'PictureFilled', text: '可选开启图片标注，每张图单独设置标注文字' },
      { icon: 'Download', text: '导出图片（3倍高清JPEG）或复制到剪贴板（PNG）' },
    ],
    tips: [
      '图片上传自动压缩至最长边≤2000px，初始质量0.92',
      '导出时3倍渲染，细节丰富，自动压缩至≤5MB',
      '艺术字模式下必须先选择模板才能导出',
      '混合模式 = 上方艺术字 + 下方文字区域（无LOGO）',
    ]
  },
  {
    name: '工作照拼接-六宫格',
    icon: 'Grid',
    desc: '将6张工作照片拼接为2×3网格布局，功能与四宫格完全一致。',
    steps: [
      { icon: 'Upload', text: '点击每个格子或 Ctrl+V 粘贴图片，支持拖拽排序' },
      { icon: 'Edit', text: '输入工作动态文本（最多200字，支持4行），调整样式' },
      { icon: 'MagicStick', text: '可选艺术字模式，选择模板后拖拽调整位置和缩放' },
      { icon: 'PictureFilled', text: '可选开启图片标注' },
      { icon: 'Download', text: '导出图片或复制到剪贴板' },
    ],
    tips: [
      '功能与四宫格完全一致，只是网格布局变为2行3列',
      '图片上传和导出参数同四宫格',
    ]
  },
  {
    name: '工作照拼接-长图',
    icon: 'CopyDocument',
    desc: '多张图片水平或垂直拼接为一张长图，适合展示完整工作流程。',
    steps: [
      { icon: 'Upload', text: '上传多张图片，支持 Ctrl+V 粘贴，支持拖拽排序' },
      { icon: 'Operation', text: '选择排列方向（横向/纵向），调整图片间距' },
      { icon: 'FullScreen', text: '可选开启统一尺寸，自定义统一宽度' },
      { icon: 'EditPen', text: '每张图可单独设置标注文字，调整字号、字体、颜色' },
      { icon: 'Download', text: '导出JPEG或复制到剪贴板PNG' },
    ],
    tips: [
      '图片上传自动压缩至最长边≤2000px，JPEG 0.92',
      '调整参数后长图自动重新生成（300ms防抖）',
      '导出压缩目标为「图片数×1MB」，质量更高',
      '对比图功能已拆分至独立模块',
    ]
  },
  {
    name: '工作照拼接-对比图',
    icon: 'RefreshRight',
    desc: '两张图片并排或上下排列，自动标注"处置前"/"处置后"，适合展示整治前后对比。',
    steps: [
      { icon: 'Upload', text: '上传两张图片（处置前/处置后），支持 Ctrl+V 粘贴' },
      { icon: 'Sort', text: '拖拽图片可交换位置，切换后自动重新生成' },
      { icon: 'Operation', text: '选择排列方向（横向并排/纵向堆叠）' },
      { icon: 'MagicStick', text: '点击"生成对比图"，自动标注红色标签' },
      { icon: 'Download', text: '导出JPEG或复制到剪贴板PNG' },
    ],
    tips: [
      '标签字体大小根据图片尺寸自动适配',
      '切换方向或更换图片后自动重新生成',
      '图片上传时自动压缩至最长边≤2000px',
    ]
  },
  {
    name: '图片标注',
    icon: 'EditPen',
    desc: '在单张图片上添加文字标注，支持自定义位置、字号、字体和颜色。',
    steps: [
      { icon: 'Upload', text: '上传图片或 Ctrl+V 粘贴' },
      { icon: 'Edit', text: '输入标注文字（最多200字），支持回车换行' },
      { icon: 'Operation', text: '选择位置（7个位置可选）' },
      { icon: 'Setting', text: '调整样式：字号20~50px、5种字体、自定义颜色' },
      { icon: 'Download', text: '导出JPEG（≤5MB）或复制到剪贴板PNG' },
    ],
    tips: [
      '预览效果与导出效果一致（基于图片实际像素计算字号）',
      '文字超出可用宽度时自动折行',
      '支持手动回车换行',
    ]
  },
  {
    name: '图片裁剪（4:3）',
    icon: 'Crop',
    desc: '将任意比例的图片裁剪为标准的4:3比例，适合统一照片格式。',
    steps: [
      { icon: 'Upload', text: '上传图片或 Ctrl+V 粘贴' },
      { icon: 'Rank', text: '拖拽裁剪框移动位置，拖拽四角缩放大小' },
      { icon: 'Operation', text: '裁剪框保持4:3固定比例，最小80×60px' },
      { icon: 'Download', text: '导出JPEG/PNG（与原图格式一致）或复制到剪贴板PNG' },
    ],
    tips: [
      '拖动裁剪框时保持4:3固定比例，不可自由变形',
      '导出自动压缩至≤5MB',
      '复制到剪贴板仅支持PNG格式',
    ]
  },
  {
    name: '图片压缩（≤1MB）',
    icon: 'Compress',
    desc: '将图片自动压缩至1MB以内，方便上传和传输。',
    steps: [
      { icon: 'Upload', text: '上传图片或 Ctrl+V 粘贴' },
      { icon: 'MagicStick', text: '自动压缩：最长边超2000px自动缩小，逐步调整质量' },
      { icon: 'Setting', text: '必要时缩小分辨率（0.8倍缩放后继续降质）' },
      { icon: 'Download', text: '导出图片或复制到剪贴板PNG' },
    ],
    tips: [
      '初始压缩质量0.92，最低降至0.1',
      '降质后仍超过1MB会缩小尺寸，直至≥200px为止',
      '复制到剪贴板仅支持PNG格式，文件会较压缩图明显增大',
    ]
  },
  {
    name: '批量图片标注',
    icon: 'Files',
    desc: '上传多张图片和文本配置，自动批量标注并打包为ZIP下载。',
    steps: [
      { icon: 'Upload', text: '上传多张图片，支持拖拽排序' },
      { icon: 'Edit', text: '输入配置文本，每行对应一张图片的标注文字' },
      { icon: 'Setting', text: '调整标注样式：位置、字体、颜色' },
      { icon: 'Download', text: '点击"批量标注并下载ZIP"，自动打包' },
    ],
    tips: [
      '文本行数应与图片数量一一对应',
      '图片尺寸较大会自动压缩至≤5MB',
      'ZIP内图片格式为JPEG',
    ]
  }
]
</script>

<template>
  <div class="guide-wrapper">
    <div class="guide-layout">
      <!-- 左侧功能列表 -->
      <div class="guide-sidebar">
        <div class="sidebar-title">
          <el-icon><Reading /></el-icon>
          图片处理
        </div>
        <div
          v-for="(f, idx) in features"
          :key="idx"
          class="sidebar-item"
          :class="{ active: currentFeature === idx }"
          @click="currentFeature = idx"
        >
          <el-icon><component :is="f.icon" /></el-icon>
          <span>{{ f.name }}</span>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="guide-main">
        <transition name="fade" mode="out-in">
          <div class="feature-card" :key="currentFeature">
            <div class="feature-header">
              <div class="feature-icon">
                <el-icon><component :is="features[currentFeature].icon" /></el-icon>
              </div>
              <div>
                <h2 class="feature-title">{{ features[currentFeature].name }}</h2>
                <p class="feature-desc">{{ features[currentFeature].desc }}</p>
              </div>
            </div>

            <div class="feature-steps">
              <h3 class="section-title">
                <el-icon><List /></el-icon>
                操作步骤
              </h3>
              <div
                v-for="(step, si) in features[currentFeature].steps"
                :key="si"
                class="step-item"
              >
                <div class="step-num">{{ si + 1 }}</div>
                <div class="step-icon">
                  <el-icon><component :is="step.icon" /></el-icon>
                </div>
                <div class="step-text">{{ step.text }}</div>
              </div>
            </div>

            <div class="feature-tips">
              <h3 class="section-title">
                <el-icon><WarningFilled /></el-icon>
                注意事项
              </h3>
              <div class="tips-list">
                <div v-for="(tip, ti) in features[currentFeature].tips" :key="ti" class="tip-item">
                  <el-icon class="tip-icon"><WarningFilled /></el-icon>
                  <span>{{ tip }}</span>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- 底部导航 -->
        <div class="guide-nav">
          <el-button
            :disabled="currentFeature === 0"
            @click="currentFeature--"
          >
            <el-icon><ArrowLeft /></el-icon>
            上一个
          </el-button>
          <span class="nav-indicator">{{ currentFeature + 1 }} / {{ features.length }}</span>
          <el-button
            :disabled="currentFeature === features.length - 1"
            @click="currentFeature++"
          >
            下一个
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.guide-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.guide-layout {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

/* 左侧边栏 */
.guide-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--el-border-color-lighter);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding: 8px 10px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;
  margin-bottom: 2px;
}

.sidebar-item:hover {
  background: rgba(var(--el-color-primary-rgb), 0.06);
  color: var(--el-color-primary);
}

.sidebar-item.active {
  background: rgba(var(--el-color-primary-rgb), 0.1);
  color: var(--el-color-primary);
  font-weight: 600;
}

/* 右侧内容 */
.guide-main {
  flex: 1;
  min-width: 0;
}

.feature-card {
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--el-border-color-lighter);
}

.feature-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(var(--el-color-primary-rgb), 0.08);
  margin-bottom: 20px;
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon .el-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.feature-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.feature-desc {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

/* 步骤 */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 16px;
}

.feature-steps {
  margin-bottom: 24px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 8px;
  background: var(--el-fill-color-lighter);
  transition: background 0.2s;
}

.step-item:hover {
  background: rgba(var(--el-color-primary-rgb), 0.04);
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--el-color-primary);
  font-size: 16px;
}

.step-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

/* 注意事项 */
.feature-tips {
  background: rgba(var(--el-color-warning-rgb), 0.05);
  border-radius: 10px;
  padding: 16px 20px;
  border: 1px solid rgba(var(--el-color-warning-rgb), 0.1);
}

.feature-tips .section-title {
  color: var(--el-color-warning);
  margin-bottom: 12px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.tip-icon {
  color: var(--el-color-warning);
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 14px;
}

/* 底部导航 */
.guide-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  padding: 16px 0;
}

.nav-indicator {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

/* 切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@media screen and (max-width: 768px) {
  .guide-layout {
    flex-direction: column;
  }
  .guide-sidebar {
    width: 100%;
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px;
  }
  .sidebar-title {
    width: 100%;
  }
  .sidebar-item {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
}
</style>
