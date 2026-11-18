<template>
  <div class="px-4 pt-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">工作台</h1>
        <p class="text-sm text-gray-500">{{ greeting }}</p>
      </div>
      <router-link to="/cards/new" class="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white flex items-center justify-center text-xl shadow-md hover:shadow-lg transition">
        +
      </router-link>
    </div>

    <!-- Quick Record -->
    <div class="card-surface p-4 mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">📝</span>
        <span class="text-sm font-medium text-gray-700">快速记录灵感</span>
      </div>
      <textarea
        v-model="quickText"
        placeholder="想到什么了？一句话就能记下来…"
        rows="2"
        class="w-full text-sm resize-none bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
        @keydown.enter.exact.prevent="quickRecord"
      ></textarea>
      <div class="flex items-center justify-between mt-2">
        <span class="text-xs text-gray-400">Enter 快速记录</span>
        <button
          class="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
          :disabled="!quickText.trim()"
          @click="quickRecord"
        >
          保存
        </button>
      </div>
    </div>

    <!-- View Toggle -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium text-gray-600">最近活跃</span>
      <div class="flex gap-1">
        <button
          v-for="v in views"
          :key="v.value"
          :class="['text-xs px-2.5 py-1 rounded-full transition', activeView === v.value ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100']"
          @click="activeView = v.value"
        >
          {{ v.label }}
        </button>
      </div>
    </div>

    <!-- Cards Grid -->
    <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">加载中…</div>

    <div v-else-if="cards.length === 0" class="text-center py-16">
      <div class="text-5xl mb-3">🌱</div>
      <p class="text-gray-500 text-sm mb-1">还没有记录</p>
      <p class="text-gray-400 text-xs">上方快速输入，开始第一个想法吧</p>
    </div>

    <!-- List View -->
    <div v-else-if="activeView === 'list'" class="space-y-3 pb-4">
      <CardItem v-for="card in cards" :key="card.id" :card="card" />
    </div>

    <!-- Kanban View -->
    <div v-else-if="activeView === 'kanban'" class="pb-4 space-y-4">
      <div v-for="col in columns" :key="col.status">
        <div class="flex items-center gap-2 mb-2 px-1">
          <span class="text-sm font-semibold text-gray-700">{{ col.label }}</span>
          <span class="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{{ col.cards.length }}</span>
        </div>
        <div class="space-y-2">
          <CardItem v-for="card in col.cards" :key="card.id" :card="card" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCardsStore } from '../stores/cards'
import { useTagsStore } from '../stores/tags'
import CardItem from '../components/CardItem.vue'
import { v4 as uuid } from '../utils/uuid'

const cardsStore = useCardsStore()
const tagsStore = useTagsStore()

const cards = computed(() => cardsStore.cards)
const loading = computed(() => cardsStore.loading)

const quickText = ref('')
const activeView = ref<'list' | 'kanban'>('list')
const views = [
  { value: 'list' as const, label: '列表' },
  { value: 'kanban' as const, label: '看板' },
]

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，灵感不会等你'
  if (h < 12) return '上午好，抓住这个灵感'
  if (h < 14) return '午间小憩，记下这个想法'
  if (h < 18) return '下午好，别让它溜走'
  return '晚上好，灵感随时在线'
})

const columns = computed(() => {
  const statuses = [
    { status: 'pending' as const, label: '⏳ 待开始' },
    { status: 'doing' as const, label: '🟢 进行中' },
    { status: 'done' as const, label: '✅ 已完成' },
  ]
  return statuses.map(s => ({
    ...s,
    cards: cards.value.filter(c => c.status === s.status),
  }))
})

async function quickRecord() {
  const text = quickText.value.trim()
  if (!text) return
  await cardsStore.createCard({
    id: uuid(),
    title: text.length > 30 ? text.substring(0, 30) + '…' : text,
    content: null,
    status: 'pending',
    priority: 'medium',
    tags: [],
  })
  quickText.value = ''
}

onMounted(async () => {
  await Promise.all([
    cardsStore.fetchCards(),
    tagsStore.fetchTags(),
  ])
})
</script>
