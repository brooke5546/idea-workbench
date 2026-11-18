<template>
  <div class="px-4 pt-6 pb-4">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">标签管理</h1>
        <p class="text-sm text-gray-500">按主题组织你的想法和计划</p>
      </div>
    </div>

    <button @click="showNewTag = true" class="w-full card-surface p-4 mb-4 text-left hover:shadow-md transition flex items-center gap-3">
      <span class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl">+</span>
      <div>
        <div class="text-sm font-semibold text-gray-700">新建标签</div>
        <div class="text-xs text-gray-400">创建新的分类主题</div>
      </div>
    </button>

    <div v-if="tags.length === 0" class="text-center py-16">
      <div class="text-5xl mb-3">🏷️</div>
      <p class="text-gray-500 text-sm">还没有标签，开始创建第一个吧</p>
    </div>

    <div v-else class="space-y-3">
      <router-link
        v-for="tag in tagsWithCount"
        :key="tag.id"
        :to="`/tags/${tag.id}`"
        class="card-surface p-4 hover:shadow-md transition flex items-center gap-3"
      >
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          :style="{ backgroundColor: tag.color + '20' }">
          {{ tag.icon || '🏷️' }}
        </div>
        <div class="flex-1">
          <div class="font-semibold text-gray-900">{{ tag.name }}</div>
          <div class="text-xs text-gray-500">{{ tag.count }} 张卡片</div>
        </div>
        <button @click.stop="editTag(tag)" class="text-gray-400 hover:text-gray-600 text-sm">⋮</button>
      </router-link>
    </div>

    <!-- New/Edit Tag Modal -->
    <div v-if="showNewTag || editingTag" class="fixed inset-0 bg-black/40 z-50 flex items-end" @click.self="closeModal">
      <div class="bg-white w-full rounded-t-3xl p-6 animate-slide-up max-w-md mx-auto">
        <h3 class="text-lg font-bold text-gray-900 mb-4">{{ editingTag ? '编辑标签' : '新建标签' }}</h3>
        <input v-model="form.name" placeholder="标签名，如「学习-英语」" class="w-full text-sm outline-none border-b border-gray-200 py-2 mb-4" />
        <div class="flex gap-2 mb-4 flex-wrap">
          <button
            v-for="c in tagColors"
            :key="c"
            @click="form.color = c"
            :class="['w-8 h-8 rounded-full transition', form.color === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : '']"
            :style="{ backgroundColor: c }"
          ></button>
        </div>
        <div class="flex gap-2 mb-4 flex-wrap">
          <button
            v-for="e in tagEmojis"
            :key="e"
            @click="form.icon = e"
            :class="['w-9 h-9 rounded-lg text-xl flex items-center justify-center transition', form.icon === e ? 'bg-gray-100' : 'hover:bg-gray-50']"
          >{{ e }}</button>
        </div>
        <div class="flex gap-2">
          <button @click="closeModal" class="btn-secondary flex-1">取消</button>
          <button v-if="editingTag" @click="deleteTagAction" class="px-4 py-2 rounded-xl bg-red-50 text-red-500 text-sm font-medium">删除</button>
          <button @click="saveTag" class="btn-primary flex-1">{{ editingTag ? '保存' : '创建' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useTagsStore } from '../stores/tags'
import { useCardsStore } from '../stores/cards'
import type { Tag } from '../types'

const tagsStore = useTagsStore()
const cardsStore = useCardsStore()

const tags = computed(() => tagsStore.tags)
const showNewTag = ref(false)
const editingTag = ref<Tag | null>(null)

const tagColors = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6']
const tagEmojis = ['📚', '💼', '💡', '🎯', '🔥', '💰', '🏷️', '✅', '🎨', '🧠', '📅', '🚀']

const form = reactive({
  name: '',
  color: '#f43f5e',
  icon: '🏷️',
})

const tagsWithCount = computed(() => {
  return tags.value.map(tag => ({
    ...tag,
    count: cardsStore.cards.filter(c => c.tags.includes(tag.id)).length,
  }))
})

function editTag(tag: Tag) {
  editingTag.value = tag
  form.name = tag.name
  form.color = tag.color
  form.icon = tag.icon || '🏷️'
}

async function saveTag() {
  if (!form.name.trim()) return
  if (editingTag.value) {
    await tagsStore.updateTag(editingTag.value.id, {
      name: form.name.trim(),
      color: form.color,
      icon: form.icon,
    })
  } else {
    await tagsStore.createTag({
      name: form.name.trim(),
      color: form.color,
      icon: form.icon,
    })
  }
  closeModal()
}

async function deleteTagAction() {
  if (!editingTag.value) return
  if (!confirm(`删除标签「${editingTag.value.name}」？卡片不会被删除，仅移除标签关联。`)) return
  await tagsStore.deleteTag(editingTag.value.id)
  closeModal()
}

function closeModal() {
  showNewTag.value = false
  editingTag.value = null
}

onMounted(async () => {
  await Promise.all([
    tagsStore.fetchTags(),
    cardsStore.fetchCards(),
  ])
})
</script>
