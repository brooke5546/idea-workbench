<template>
  <router-link :to="`/cards/${card.id}`" class="card-surface overflow-hidden hover:shadow-md transition-all active:scale-[0.99] block">
    <!-- Cover -->
    <div v-if="coverUrl" class="h-28 bg-gray-200 relative overflow-hidden">
      <img :src="coverUrl" class="w-full h-full object-cover" />
    </div>
    <div v-else class="h-28 bg-gradient-to-br from-rose-400 via-orange-400 to-amber-400 relative overflow-hidden">
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-2 left-2 w-10 h-10 rounded-full bg-white/20 blur-md"></div>
        <div class="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-white/10 blur-xl"></div>
      </div>
    </div>

    <div class="p-3">
      <!-- Tags -->
      <div class="flex gap-1 mb-2 flex-wrap">
        <span
          v-for="tag in resolvedTags"
          :key="tag.id"
          class="chip"
          :style="{ backgroundColor: tag.color + '20', color: tag.color }"
        >
          {{ tag.icon || '🏷️' }} {{ tag.name }}
        </span>
      </div>

      <!-- Title -->
      <h3 class="font-semibold text-gray-900 leading-snug line-clamp-2">
        {{ card.title }}
      </h3>

      <!-- Meta -->
      <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>{{ timeAgo(card.updated_at) }}</span>
        <div class="flex items-center gap-1.5">
          <span v-if="statusEmoji" class="text-sm">{{ statusEmoji }}</span>
          <span v-if="timeline.length" class="text-rose-500">🔥{{ timeline.length }}</span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import type { Card, Tag, TimelineEntry } from '../types'
import { useTagsStore } from '../stores/tags'
import { storage } from '../storage/dexie-adapter'

const props = defineProps<{
  card: Card
}>()

const tagsStore = useTagsStore()
const timeline = ref<TimelineEntry[]>([])
const coverUrl = ref<string | null>(null)

const resolvedTags = computed<Tag[]>(() => {
  return props.card.tags
    .map(id => tagsStore.getTagById(id))
    .filter((t): t is Tag => !!t)
})

const statusEmoji = computed(() => {
  const map: Record<string, string> = {
    pending: '⏳',
    doing: '🟢',
    done: '✅',
    archived: '📦',
  }
  return map[props.card.status] || ''
})

watchEffect(async () => {
  timeline.value = await storage.getTimeline(props.card.id)
  if (props.card.cover_image) {
    coverUrl.value = URL.createObjectURL(props.card.cover_image)
  }
})

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return new Date(iso).toLocaleDateString()
}
</script>
