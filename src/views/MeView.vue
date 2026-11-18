<template>
  <div class="px-4 pt-6 pb-4">
    <h1 class="text-2xl font-bold text-gray-900 mb-5">我的</h1>

    <!-- Stats -->
    <div class="card-surface p-5 mb-4">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">📊 数据概览</h3>
      <div class="grid grid-cols-4 gap-3 text-center">
        <div>
          <div class="text-xl font-bold text-gray-900">{{ totalCards }}</div>
          <div class="text-xs text-gray-500 mt-0.5">总卡片</div>
        </div>
        <div>
          <div class="text-xl font-bold text-emerald-600">{{ doingCards }}</div>
          <div class="text-xs text-gray-500 mt-0.5">进行中</div>
        </div>
        <div>
          <div class="text-xl font-bold text-blue-600">{{ doneCards }}</div>
          <div class="text-xs text-gray-500 mt-0.5">已完成</div>
        </div>
        <div>
          <div class="text-xl font-bold text-rose-500">{{ tagsStore.tags.length }}</div>
          <div class="text-xs text-gray-500 mt-0.5">标签</div>
        </div>
      </div>
    </div>

    <!-- Data Management -->
    <div class="mb-4">
      <h3 class="text-xs font-semibold text-gray-500 mb-2 px-1">数据管理</h3>
      <div class="card-surface divide-y divide-gray-100">
        <button @click="exportData" class="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition">
          <span class="text-lg">📤</span>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-800">导出数据</div>
            <div class="text-xs text-gray-500">下载为 JSON 文件，建议定期备份</div>
          </div>
          <span class="text-gray-300">›</span>
        </button>
        <label class="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition cursor-pointer">
          <span class="text-lg">📥</span>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-800">导入数据</div>
            <div class="text-xs text-gray-500">从 JSON 文件恢复（会覆盖现有数据）</div>
          </div>
          <span class="text-gray-300">›</span>
          <input type="file" accept="application/json" class="hidden" @change="importData" />
        </label>
      </div>
    </div>

    <!-- Preferences -->
    <div class="mb-4">
      <h3 class="text-xs font-semibold text-gray-500 mb-2 px-1">偏好设置</h3>
      <div class="card-surface divide-y divide-gray-100">
        <div class="p-4 flex items-center gap-3">
          <span class="text-lg">🔔</span>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-800">提醒通知</div>
            <div class="text-xs text-gray-500">打开 App 时检查到期提醒</div>
          </div>
          <span class="text-emerald-500 text-xs">已开启</span>
        </div>
        <div class="p-4 flex items-center gap-3">
          <span class="text-lg">🎨</span>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-800">主题色</div>
            <div class="text-xs text-gray-500">暖色调（默认）</div>
          </div>
          <span class="text-gray-300">›</span>
        </div>
      </div>
    </div>

    <!-- About -->
    <div class="card-surface p-4 text-center">
      <div class="text-3xl mb-1">💡</div>
      <div class="font-semibold text-gray-800 text-sm">想法工作台</div>
      <div class="text-xs text-gray-500 mt-0.5">v1.0.0 · 记录灵感，追踪进展</div>
      <p class="text-xs text-gray-400 mt-2 leading-relaxed">
        这是一个用 Vue 3 + Dexie 构建的纯本地 PWA<br>
        数据全部存在你自己的设备上，隐私无忧
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCardsStore } from '../stores/cards'
import { useTagsStore } from '../stores/tags'
import { storage } from '../storage/dexie-adapter'

const cardsStore = useCardsStore()
const tagsStore = useTagsStore()

const totalCards = computed(() => cardsStore.cards.length)
const doingCards = computed(() => cardsStore.cards.filter(c => c.status === 'doing').length)
const doneCards = computed(() => cardsStore.cards.filter(c => c.status === 'done').length)

async function exportData() {
  const data = await storage.exportAll()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `idea-workbench-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function importData(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!confirm('导入会覆盖所有现有数据，确定继续？')) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    await storage.importAll(data)
    await cardsStore.fetchCards()
    await tagsStore.fetchTags()
    alert('导入成功！')
  } catch (err) {
    alert('导入失败：' + (err as Error).message)
  }
}

onMounted(async () => {
  await Promise.all([
    cardsStore.fetchCards(),
    tagsStore.fetchTags(),
  ])
})
</script>
