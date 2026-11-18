<template>
  <div v-if="card" class="animate-fade-in">
    <!-- Nav Bar -->
    <div class="sticky top-0 z-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
      <button @click="goBack" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="flex gap-1.5 flex-wrap max-w-[200px]">
        <span
          v-for="tag in resolvedTags"
          :key="tag.id"
          class="chip text-[10px]"
          :style="{ backgroundColor: tag.color + '20', color: tag.color }"
        >
          {{ tag.icon || '🏷️' }} {{ tag.name }}
        </span>
      </div>
      <button @click="goEdit" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-xl text-gray-500">
        ⋯
      </button>
    </div>

    <!-- Cover + Title -->
    <div class="relative">
      <div class="h-40 bg-gradient-to-br from-rose-400 via-orange-400 to-amber-400 relative overflow-hidden">
        <div v-if="coverUrl" class="absolute inset-0">
          <img :src="coverUrl" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/20"></div>
        </div>
        <div class="absolute inset-0 opacity-30">
          <div class="absolute top-4 left-4 w-20 h-20 rounded-full bg-white/20 blur-xl"></div>
          <div class="absolute bottom-8 right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
        </div>
        <div class="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-2.5 py-1 text-[10px] font-medium text-gray-600 shadow">
          {{ formatDate(card.created_at) }} 创建
        </div>
      </div>
      <div class="absolute -bottom-5 left-4 flex items-center gap-2">
        <span class="px-3 py-1 bg-white rounded-full shadow-md text-xs font-semibold border"
          :class="statusClass">
          {{ statusEmoji }} {{ statusLabel }}
        </span>
        <span class="px-3 py-1 bg-white rounded-full shadow-md text-xs font-semibold text-amber-600 border border-amber-100">
          ⭐ {{ priorityLabel }}
        </span>
      </div>
    </div>

    <!-- Title + Meta -->
    <div class="px-5 pt-8 pb-4">
      <h1 class="text-xl font-bold text-gray-900 leading-snug">{{ card.title }}</h1>
      <p v-if="excerpt" class="text-sm text-gray-500 mt-1 line-clamp-2">{{ excerpt }}</p>
    </div>

    <!-- Quick Info Bar -->
    <div class="mx-4 mb-4 card-surface p-3">
      <div class="flex justify-around text-center text-xs">
        <div>
          <div class="text-gray-400 mb-0.5">📌 截止</div>
          <div class="font-semibold text-gray-700">{{ card.due_date ? formatDate(card.due_date) : '—' }}</div>
        </div>
        <div class="w-px bg-gray-100"></div>
        <div>
          <div class="text-gray-400 mb-0.5">🔔 提醒</div>
          <div class="font-semibold text-gray-700">{{ card.reminder_date ? '已设置' : '—' }}</div>
        </div>
        <div class="w-px bg-gray-100"></div>
        <div>
          <div class="text-gray-400 mb-0.5">📊 进展</div>
          <div class="font-semibold text-emerald-600">{{ timeline.length }}</div>
        </div>
        <div class="w-px bg-gray-100"></div>
        <div>
          <div class="text-gray-400 mb-0.5">🔥 热度</div>
          <div class="font-semibold text-rose-500">{{ timeline.length > 0 ? '活跃' : '冷静' }}</div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="contentText" class="mx-4 mb-4 card-surface p-5">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-amber-400"></div>
        <h2 class="text-sm font-semibold text-gray-800">详细想法</h2>
      </div>
      <div class="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
        <RichContent :content="card.content" />
      </div>
      <!-- Attachments -->
      <div v-if="attachmentUrls.length" class="mt-4 grid grid-cols-2 gap-2">
        <div v-for="(url, idx) in attachmentUrls" :key="idx" class="aspect-video rounded-xl overflow-hidden bg-gray-200">
          <img :src="url" class="w-full h-full object-cover" />
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="px-4 pb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div class="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-teal-400"></div>
          <h2 class="text-sm font-semibold text-gray-800">进展时间线</h2>
          <span class="px-1.5 py-0.5 bg-gray-100 rounded-md text-xs text-gray-500">{{ timeline.length }}</span>
        </div>
      </div>

      <div v-if="timeline.length === 0" class="text-center py-6 text-gray-400 text-sm">
        还没有进展记录，点下方按钮加第一条吧
      </div>

      <div class="space-y-3 relative">
        <div v-for="entry in timeline" :key="entry.id" class="relative bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div class="flex items-start justify-between mb-1.5">
            <span class="text-xs font-medium text-gray-400">{{ timeAgo(entry.created_at) }}</span>
            <span v-if="entry.mood" class="text-base">{{ entry.mood }}</span>
          </div>
          <p class="text-sm text-gray-700 leading-relaxed">{{ entry.content }}</p>
        </div>
      </div>

      <!-- Add Timeline -->
      <div class="mt-4 card-surface p-3">
        <textarea
          v-model="newEntryContent"
          placeholder="记录一下进展…"
          rows="2"
          class="w-full text-sm resize-none outline-none text-gray-700 placeholder:text-gray-400"
        ></textarea>
        <div class="flex items-center justify-between mt-2">
          <div class="flex gap-1">
            <button
              v-for="m in moods"
              :key="m"
              :class="['w-7 h-7 rounded-full flex items-center justify-center transition', selectedMood === m ? 'bg-rose-100 scale-110' : 'hover:bg-gray-100']"
              @click="selectedMood = selectedMood === m ? null : m"
            >{{ m }}</button>
          </div>
          <button :disabled="!newEntryContent.trim()" class="btn-primary text-xs py-1.5 px-3 disabled:opacity-50" @click="addTimeline">
            添加
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="sticky bottom-[60px] mx-4 mb-3 flex gap-2 z-20">
      <button class="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50" @click="goEdit">
        ✏️ 编辑
      </button>
      <button class="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50" @click="toggleArchive">
        {{ card.status === 'archived' ? '📤 恢复' : '📦 归档' }}
      </button>
      <button class="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800" @click="handleDelete">
        🗑️ 删除
      </button>
    </div>
  </div>

  <div v-else class="text-center py-20 text-gray-400">
    <div class="text-5xl mb-3">🔍</div>
    <p class="text-sm">卡片不存在</p>
    <router-link to="/" class="text-rose-500 text-xs mt-2 block">返回首页</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTagsStore } from '../stores/tags'
import { storage } from '../storage/dexie-adapter'
import type { Card, TimelineEntry, ImageAttachment } from '../types'
import RichContent from '../components/RichContent.vue'

const route = useRoute()
const router = useRouter()
const tagsStore = useTagsStore()

const card = ref<Card | null>(null)
const timeline = ref<TimelineEntry[]>([])
const attachments = ref<ImageAttachment[]>([])
const coverUrl = ref<string | null>(null)
const attachmentUrls = ref<string[]>([])

const newEntryContent = ref('')
const selectedMood = ref<string | null>(null)
const moods = ['🔥', '💪', '🎉', '🧠', '😰', '🎯', '📚']

const resolvedTags = computed(() => {
  if (!card.value) return []
  return card.value.tags
    .map(id => tagsStore.getTagById(id))
    .filter((t): t is any => !!t)
})

const statusEmoji = computed(() => ({
  pending: '⏳',
  doing: '🟢',
  done: '✅',
  archived: '📦',
}[card.value?.status || 'pending']))

const statusLabel = computed(() => ({
  pending: '待开始',
  doing: '进行中',
  done: '已完成',
  archived: '已归档',
}[card.value?.status || 'pending']))

const statusClass = computed(() => ({
  pending: 'border-gray-200 text-gray-600 bg-white',
  doing: 'border-emerald-100 text-emerald-600 bg-white',
  done: 'border-blue-100 text-blue-600 bg-white',
  archived: 'border-gray-200 text-gray-400 bg-white',
}[card.value?.status || 'pending']))

const priorityLabel = computed(() => ({
  low: '低优先级',
  medium: '中优先级',
  high: '高优先级',
}[card.value?.priority || 'medium']))

const contentText = computed(() => {
  if (!card.value?.content) return ''
  return tiptapToText(card.value.content)
})

const excerpt = computed(() => {
  const t = contentText.value
  if (!t) return ''
  return t.substring(0, 60) + (t.length > 60 ? '…' : '')
})

function tiptapToText(json: any): string {
  if (!json) return ''
  if (typeof json === 'string') return json
  let text = ''
  const walk = (node: any) => {
    if (!node) return
    if (node.text) text += node.text + ' '
    if (node.content) node.content.forEach(walk)
  }
  walk(json)
  return text.trim()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return formatDate(iso)
}

async function loadData() {
  const id = route.params.id as string
  if (!id) return
  card.value = await storage.getCard(id)
  if (card.value) {
    timeline.value = await storage.getTimeline(id)
    attachments.value = await storage.getAttachments(id)
    if (card.value.cover_image) {
      coverUrl.value = URL.createObjectURL(card.value.cover_image)
    }
    attachmentUrls.value = attachments.value.map(a => URL.createObjectURL(a.blob))
  }
}

async function addTimeline() {
  const content = newEntryContent.value.trim()
  if (!content || !card.value) return
  await storage.saveTimelineEntry({
    card_id: card.value.id,
    content,
    mood: selectedMood.value,
  })
  newEntryContent.value = ''
  selectedMood.value = null
  timeline.value = await storage.getTimeline(card.value.id)
  card.value = await storage.getCard(card.value.id)
}

async function toggleArchive() {
  if (!card.value) return
  const newStatus = card.value.status === 'archived' ? 'pending' : 'archived'
  await storage.updateCard(card.value.id, { status: newStatus })
  card.value = await storage.getCard(card.value.id)
}

async function handleDelete() {
  if (!card.value) return
  if (!confirm('确定要删除这张卡片吗？相关的时间线和附件也会一起删除。')) return
  await storage.deleteCard(card.value.id)
  router.push('/')
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

function goEdit() {
  if (!card.value) return
  router.push(`/cards/${card.value.id}/edit`)
}

watch(() => route.params.id, loadData)
onMounted(async () => {
  await tagsStore.fetchTags()
  await loadData()
})
</script>
