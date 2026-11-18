<template>
  <div class="px-4 pt-6 pb-4">
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">搜索</h1>
      <div class="card-surface p-3 flex items-center gap-3">
        <span class="text-gray-400">🔍</span>
        <input
          v-model="query"
          type="text"
          placeholder="搜索卡片标题、正文、标签…"
          class="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
          @input="doSearch"
        />
        <button v-if="query" @click="clearQuery" class="text-gray-400 text-sm hover:text-gray-600">✕</button>
      </div>
    </div>

    <div v-if="!query && recentSearches.length" class="mb-4">
      <h3 class="text-xs font-semibold text-gray-500 mb-2">最近搜索</h3>
      <div class="flex flex-wrap gap-2">
        <button v-for="q in recentSearches" :key="q" @click="query = q; doSearch()"
          class="chip bg-gray-100 text-gray-600 hover:bg-gray-200">{{ q }}</button>
      </div>
    </div>

    <div v-if="query && results.length === 0" class="text-center py-16">
      <div class="text-5xl mb-3">🔍</div>
      <p class="text-gray-500 text-sm">没有找到「{{ query }}」相关的内容</p>
    </div>

    <div v-else-if="results.length" class="space-y-2">
      <template v-for="(group, type) in groupedResults" :key="type">
        <h3 class="text-xs font-semibold text-gray-500 mb-2 mt-4">{{ group.label }}</h3>
        <router-link
          v-for="r in group.items"
          :key="r.entity_type + r.entity_id"
          :to="r.entity_type === 'card' ? `/cards/${r.entity_id}` : (r.entity_type === 'tag' ? `/tags/${r.entity_id}` : `/cards/${r.entity_id.split(':')[1]}`)"
          class="card-surface p-3 block hover:shadow-md transition"
        >
          <div class="font-medium text-gray-800 text-sm">{{ r.title }}</div>
          <div v-if="r.snippet" class="text-xs text-gray-500 mt-1 line-clamp-2">{{ r.snippet }}</div>
        </router-link>
      </template>
    </div>

    <div v-else class="text-center py-20">
      <div class="text-5xl mb-3">🔎</div>
      <p class="text-gray-500 text-sm">输入关键词开始搜索</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storage } from '../storage/dexie-adapter'
import type { SearchResult } from '../types'

const query = ref('')
const results = ref<SearchResult[]>([])
const recentSearches = ref<string[]>(
  JSON.parse(localStorage.getItem('recent_searches') || '[]')
)

let searchTimer: number | null = null

async function doSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  const q = query.value.trim()
  if (!q) {
    results.value = []
    return
  }

  // Save to recent
  const recent = recentSearches.value.filter(s => s !== q).slice(0, 9)
  recentSearches.value = [q, ...recent]
  localStorage.setItem('recent_searches', JSON.stringify(recentSearches.value))

  searchTimer = window.setTimeout(async () => {
    results.value = await storage.search(q)
  }, 200)
}

function clearQuery() {
  query.value = ''
  results.value = []
}

const groupedResults = computed(() => {
  const groups: Record<string, { label: string; items: SearchResult[] }> = {
    card: { label: '📄 卡片', items: [] },
    timeline: { label: '📝 进展', items: [] },
    tag: { label: '🏷️ 标签', items: [] },
  }
  for (const r of results.value) {
    groups[r.entity_type].items.push(r)
  }
  return groups
})
</script>
