<template>
  <div class="px-4 pt-6 pb-4">
    <div class="flex items-center gap-3 mb-5">
      <router-link to="/tags" class="text-gray-400 hover:text-gray-700">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
        :style="{ backgroundColor: currentTag?.color + '20' }">
        {{ currentTag?.icon || '🏷️' }}
      </div>
      <div>
        <h1 class="font-bold text-gray-900">{{ currentTag?.name || '加载中…' }}</h1>
        <p class="text-xs text-gray-500">{{ cards.length }} 张卡片</p>
      </div>
    </div>

    <div v-if="cards.length === 0" class="text-center py-16">
      <div class="text-5xl mb-3">📭</div>
      <p class="text-gray-500 text-sm">这个标签下还没有卡片</p>
      <router-link to="/cards/new" class="text-rose-500 text-xs mt-2 inline-block">+ 去创建</router-link>
    </div>

    <div v-else class="space-y-3">
      <CardItem v-for="card in cards" :key="card.id" :card="card" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCardsStore } from '../stores/cards'
import { useTagsStore } from '../stores/tags'
import CardItem from '../components/CardItem.vue'

const route = useRoute()
const cardsStore = useCardsStore()
const tagsStore = useTagsStore()

const cards = computed(() =>
  cardsStore.cards.filter(c => c.tags.includes(route.params.tagId as string))
)

const currentTag = computed(() => tagsStore.getTagById(route.params.tagId as string))

async function load() {
  await Promise.all([
    cardsStore.fetchCards(),
    tagsStore.fetchTags(),
  ])
}

watch(() => route.params.tagId, load)
onMounted(load)
</script>
