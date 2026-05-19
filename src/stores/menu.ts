import { defineStore } from 'pinia';
// ... existing code ...

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menus: [
      // ... existing code ...
      // 移除了整个PDF工具菜单项
      // ... existing code ...
    ]
  })
})