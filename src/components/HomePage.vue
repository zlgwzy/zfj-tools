<script setup lang="ts">
import { ref, onMounted } from 'vue'
import WorkPhotoStitching from './ImageProcessing/WorkPhotoStitchingGrid.vue'
import WorkPhotoStitching6 from './ImageProcessing/WorkPhotoStitchingGrid.vue'
import WorkPhotoStitchingLong from './ImageProcessing/WorkPhotoStitching_Long.vue'
import ImageAnnotation from './ImageProcessing/ImageAnnotation.vue'
import ImageCropper from './ImageProcessing/ImageCropper.vue'
import ImageCompressor from './ImageProcessing/ImageCompressor.vue'
import BatchAnnotator from './ImageProcessing/BatchAnnotator.vue'
import WorkPhotoComparison from './ImageProcessing/WorkPhotoComparison.vue'
import MianzhuMap from './Map/MianzhuMap.vue'
import Changelog from './Changelog/Changelog.vue'

// 定义当前激活的菜单项索引
const activeIndex = ref('1')

// 处理菜单项选择事件
const handleSelect = (index: string) => {
  activeIndex.value = index
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab')
  if (tab) {
    activeIndex.value = tab
  }
})
</script>

<template>
  <div class="common-layout">
    <el-container>
      <!-- 侧边栏菜单 -->
      <el-aside width="200px">
        <div class="logo-container">
          <h1 class="web-title">执法局工具箱</h1>
        </div>
        <el-menu
          :default-active="activeIndex"
          class="el-menu-vertical"
          :collapse="false"
          @select="handleSelect"
        >
          <el-menu-item index="1">
            <el-icon><home-filled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-sub-menu index="2">
            <template #title>
              <el-icon><picture-filled /></el-icon>
              <span>图片处理</span>
            </template>
            <el-menu-item index="2-1">
              <span>工作照拼接-四宫格</span>
            </el-menu-item>
            <el-menu-item index="2-3">
              <span>工作照拼接-六宫格</span>
            </el-menu-item>
            <el-menu-item index="2-4">
              <span>工作照拼接-长图</span>
            </el-menu-item>
            <el-menu-item index="2-8">
              <span>工作照拼接-对比图</span>
            </el-menu-item>
            <el-menu-item index="2-5">
              <span>图片标注（200字以内）</span>
            </el-menu-item>
            <el-menu-item index="2-6">
              <span>图片裁剪（4:3）</span>
            </el-menu-item>
            <el-menu-item index="2-7">
              <span>图片压缩（≤1MB）</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item index="3">
            <el-icon><management /></el-icon>
            <span>文档处理</span>
          </el-menu-item>
          <el-menu-item index="4">
            <el-icon><list /></el-icon>
            <span>表格处理</span>
          </el-menu-item>
          <el-sub-menu index="8">
            <template #title>
              <el-icon><tools /></el-icon>
              <span>自动化</span>
            </template>
            <el-menu-item index="8-1">
              <span>批量图片标注</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item index="5">
            <el-icon><location /></el-icon>
            <a href="?tab=5" @click.prevent="handleSelect('5')">绵竹地图</a>
          </el-menu-item>
          <el-menu-item index="6">
            <el-icon><document /></el-icon>
            <span>更新日志</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <!-- 主内容区域 -->
        <el-main>
          <!-- 根据激活的菜单项索引显示不同的内容 -->
          <div v-if="activeIndex === '1'" class="main-container">
            <img src="/images/home_page.jpeg" alt="首页图片" class="home-page-image">
            <el-card class="welcome-card">
              <div class="welcome-content">
                <p>本工具箱提供了一系列实用的工具，包括图片处理、文档处理、表格处理、自动化流程等功能，旨在提高执法局工作人员的日常工作效率。所有工具都经过精心设计和优化，操作简单直观，能够满足日常办公需求。</p>
              </div>
            </el-card>
          </div>

          <!-- 工作照片拼接工具 -->
          <WorkPhotoStitching v-if="activeIndex === '2-1'" :grid-type="4" />
          <WorkPhotoStitching6 v-if="activeIndex === '2-3'" :grid-type="6" />
          <WorkPhotoStitchingLong v-if="activeIndex === '2-4'" />
          <WorkPhotoComparison v-if="activeIndex === '2-8'" />
          <ImageAnnotation v-if="activeIndex === '2-5'" />
          <ImageCropper v-if="activeIndex === '2-6'" />
          <ImageCompressor v-if="activeIndex === '2-7'" />

          <!-- 文档处理 -->
          <div v-if="activeIndex === '3'" class="main-container">
            <el-card class="welcome-card">
              <div class="welcome-content" style="text-align: center; padding: 60px">
                <el-icon style="font-size: 48px; color: #c0c4cc; margin-bottom: 16px"><management /></el-icon>
                <p style="color: #909399; font-size: 16px;">文档处理模块开发中…</p>
              </div>
            </el-card>
          </div>

          <!-- 表格处理 -->
          <div v-if="activeIndex === '4'" class="main-container">
            <el-card class="welcome-card">
              <div class="welcome-content" style="text-align: center; padding: 60px">
                <el-icon style="font-size: 48px; color: #c0c4cc; margin-bottom: 16px"><list /></el-icon>
                <p style="color: #909399; font-size: 16px;">表格处理模块开发中…</p>
              </div>
            </el-card>
          </div>

          <!-- 绵竹地图 -->
          <MianzhuMap v-if="activeIndex === '5'" />

          <BatchAnnotator v-if="activeIndex === '8-1'" />

          <!-- 更新日志 -->
          <Changelog v-if="activeIndex === '6'" />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.common-layout {
  height: 100vh;
}

.el-container {
  height: 100%;
}

.el-aside {
  background-color: #fff;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #dcdfe6;
}

.web-title {
  margin: 0;
  font-size: 20px;
  color: #409eff;
}

.el-menu-vertical {
  border-right: none;
  flex: 1;
}

.el-main {
  padding: 20px;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-card {
  margin-top: 20px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: linear-gradient(145deg, var(--el-bg-color), var(--el-bg-color-overlay));
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  width: 80%;
}

.welcome-card::before,
.welcome-card::after {
  content: '';
  position: absolute;
  inset: -2px;
  z-index: -1;
  background: linear-gradient(
    90deg,
    #409EFF,
    #79BBFF,
    #A0CFFF,
    #79BBFF,
    #409EFF
  );
  background-size: 300% 300%;
  animation: borderGlow 8s linear infinite;
  border-radius: 12px;
  opacity: 0.5;
}

.welcome-card::after {
  filter: blur(12px);
  opacity: 0.3;
}

@keyframes borderGlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.welcome-content {
  padding: 30px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  border-radius: 12px;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(5px);
}

.welcome-content p {
  margin: 0;
  line-height: 2;
  font-size: 15px;
  color: #606266;
  text-align: justify;
  letter-spacing: 0.5px;
  text-indent: 2em;
  animation: fadeIn 0.8s ease-out;
  font-weight: 400;
  opacity: 0.9;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 0.9;
    transform: translateY(0);
  }
}

.home-page-image {
  width: 80%;
  height: auto;
  margin-bottom: 20px;
  display: block;
  margin-left: auto;
  margin-right: auto;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.home-page-image:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

/* Make menu link look like normal text (no underline/highlight color) */
.el-menu-vertical a {
  color: inherit;
  text-decoration: none;
  outline: none;
}

.el-menu-vertical a:hover,
.el-menu-vertical a:focus,
.el-menu-vertical a:active,
.el-menu-vertical a:visited {
  color: inherit;
  text-decoration: none;
}

</style>