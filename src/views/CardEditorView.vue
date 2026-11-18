<template>
  <div class="px-4 pt-6 pb-24 animate-fade-in">
    <!-- Nav Bar -->
    <div class="flex items-center justify-between mb-5">
      <button @click="goBack" class="text-gray-500 text-sm hover:text-gray-700">取消</button>
      <h1 class="font-semibold text-gray-800">{{ isEdit ? '编辑卡片' : '新建卡片' }}</h1>
      <button @click="save" :disabled="!form.title.trim()" class="text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        :class="form.title.trim() ? 'text-rose-500 hover:text-rose-600' : 'text-gray-400'">
        保存
      </button>
    </div>

    <!-- Title -->
    <input
      v-model="form.title"
      type="text"
      placeholder="给它起个标题吧…"
      class="w-full text-xl font-bold text-gray-900 placeholder:text-gray-300 outline-none border-b border-gray-200 pb-3 mb-4 bg-transparent"
    />

    <!-- Cover Image -->
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-amber-400"></span>
        <h3 class="text-sm font-semibold text-gray-700">封面图（可选）</h3>
      </div>
      <div v-if="form.cover_image" class="relative rounded-xl overflow-hidden">
        <img :src="coverPreview" class="w-full h-32 object-cover" />
        <button @click="form.cover_image = null; coverPreview = undefined" class="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center text-sm">✕</button>
      </div>
      <div v-else class="h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
        <label class="cursor-pointer text-gray-400 text-sm hover:text-rose-500 flex items-center gap-1.5">
          <span class="text-lg">📷</span> 点此上传封面
          <input type="file" accept="image/*" class="hidden" @change="onCoverChange" />
        </label>
      </div>
    </div>

    <!-- Content -->
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-amber-400"></span>
        <h3 class="text-sm font-semibold text-gray-700">详细想法</h3>
      </div>
      <div class="card-surface p-4">
        <textarea
          v-model="form.content_text"
          rows="6"
          placeholder="展开说说这个想法…可以是详细描述、待办清单、参考链接等等"
          class="w-full text-sm resize-none outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
        ></textarea>

        <!-- Image Attachment -->
        <div class="mt-3 pt-3 border-t border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs text-gray-500">添加图片：</span>
            <label class="text-xs text-rose-500 hover:underline cursor-pointer">
              + 从相册选择
              <input type="file" accept="image/*" multiple class="hidden" @change="onAttachmentsChange" />
            </label>
          </div>
          <div v-if="attachmentPreviews.length" class="grid grid-cols-3 gap-2">
            <div v-for="(url, idx) in attachmentPreviews" :key="idx" class="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img :src="url" class="w-full h-full object-cover" />
              <button @click="removeAttachment(idx)" class="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-[10px]">✕</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tags -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-amber-400"></span>
          <h3 class="text-sm font-semibold text-gray-700">标签</h3>
        </div>
        <button @click="showNewTag = true" class="text-xs text-rose-500 hover:underline">+ 新建标签</button>
      </div>
      <div v-if="tagsStore.tags.length === 0" class="text-xs text-gray-400 py-2">还没有标签，先建一个吧</div>
      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="tag in tagsStore.tags"
          :key="tag.id"
          @click="toggleTag(tag.id)"
          :class="['chip transition border', form.tags.includes(tag.id) ? 'ring-2 ring-offset-1 ring-rose-300' : 'opacity-60 hover:opacity-100']"
          :style="{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }"
        >
          {{ tag.icon || '🏷️' }} {{ tag.name }}
        </button>
      </div>
    </div>

    <!-- Status + Priority -->
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-amber-400"></span>
        <h3 class="text-sm font-semibold text-gray-700">状态 & 优先级</h3>
      </div>
      <div class="card-surface p-4 space-y-4">
        <div>
          <label class="text-xs text-gray-500 mb-1.5 block">状态</label>
          <div class="flex gap-2">
            <button v-for="s in statusOptions" :key="s.value" @click="form.status = s.value"
              :class="['chip border transition flex-1 justify-center', form.status === s.value ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50']">
              {{ s.emoji }} {{ s.label }}
            </button>
          </div>
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1.5 block">优先级</label>
          <div class="flex gap-2">
            <button v-for="p in priorityOptions" :key="p.value" @click="form.priority = p.value"
              :class="['chip border transition flex-1 justify-center', form.priority === p.value ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50']">
              {{ p.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dates -->
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-amber-400"></span>
        <h3 class="text-sm font-semibold text-gray-700">时间（可选）</h3>
      </div>
      <div class="card-surface p-4 space-y-3">
        <div>
          <label class="text-xs text-gray-500 mb-1 block">📌 截止日期</label>
          <input type="date" v-model="form.due_date_local" class="w-full text-sm outline-none py-1.5 bg-transparent text-gray-700" />
        </div>
        <div class="border-t border-gray-100 pt-3">
          <label class="text-xs text-gray-500 mb-1 block">🔔 提醒</label>
          <input type="datetime-local" v-model="form.reminder_date_local" class="w-full text-sm outline-none py-1.5 bg-transparent text-gray-700" />
        </div>
      </div>
    </div>

    <!-- New Tag Modal -->
    <div v-if="showNewTag" class="fixed inset-0 bg-black/40 z-50 flex items-end" @click.self="showNewTag = false">
      <div class="bg-white w-full rounded-t-3xl p-6 animate-slide-up max-w-md mx-auto">
        <h3 class="text-lg font-bold text-gray-900 mb-4">新建标签</h3>
        <input v-model="newTagName" placeholder="标签名，如「学习-英语」" class="w-full text-sm outline-none border-b border-gray-200 py-2 mb-4" />
        <div class="flex gap-2 mb-4">
          <button
            v-for="c in tagColors"
            :key="c"
            @click="newTagColor = c"
            :class="['w-8 h-8 rounded-full transition', newTagColor === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : '']"
            :style="{ backgroundColor: c }"
          ></button>
        </div>
        <div class="flex gap-2 mb-4">
          <button
            v-for="e in tagEmojis"
            :key="e"
            @click="newTagIcon = e"
            :class="['w-9 h-9 rounded-lg text-xl flex items-center justify-center transition', newTagIcon === e ? 'bg-gray-100' : 'hover:bg-gray-50']"
          >{{ e }}</button>
        </div>
        <div class="flex gap-2">
          <button @click="showNewTag = false" class="btn-secondary flex-1">取消</button>
          <button @click="createNewTag" class="btn-primary flex-1">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTagsStore } from '../stores/tags'
import { storage } from '../storage/dexie-adapter'
import type { Card } from '../types'
import { v4 as uuid } from '../utils/uuid'

const route = useRoute()
const router = useRouter()
const tagsStore = useTagsStore()

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  content_text: '',
  cover_image: null as Blob | null,
  tags: [] as string[],
  status: 'pending' as Card['status'],
  priority: 'medium' as Card['priority'],
  due_date_local: '',
  reminder_date_local: '',
})

const coverPreview = ref<string | undefined>(undefined)
const newAttachments = ref<Blob[]>([])
const attachmentPreviews = ref<string[]>([])

const showNewTag = ref(false)
const newTagName = ref('')
const newTagColor = ref('#f43f5e')
const newTagIcon = ref('🏷️')

const tagColors = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6']
const tagEmojis = ['📚', '💼', '💡', '🎯', '🔥', '💰', '🏷️', '✅', '🎨', '🧠', '📅', '🚀']

const statusOptions = [
  { value: 'pending' as const, label: '待开始', emoji: '⏳' },
  { value: 'doing' as const, label: '进行中', emoji: '🟢' },
  { value: 'done' as const, label: '已完成', emoji: '✅' },
]

const priorityOptions = [
  { value: 'low' as const, label: '⭐ 低' },
  { value: 'medium' as const, label: '⭐⭐ 中' },
  { value: 'high' as const, label: '⭐⭐⭐ 高' },
]

function toggleTag(id: string) {
  const idx = form.tags.indexOf(id)
  if (idx >= 0) form.tags.splice(idx, 1)
  else form.tags.push(id)
}

function onCoverChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    form.cover_image = file
    coverPreview.value = URL.createObjectURL(file)
  }
}

function onAttachmentsChange(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  for (const f of files) {
    newAttachments.value.push(f)
    attachmentPreviews.value.push(URL.createObjectURL(f))
  }
}

function removeAttachment(idx: number) {
  newAttachments.value.splice(idx, 1)
  attachmentPreviews.value.splice(idx, 1)
}

async function createNewTag() {
  if (!newTagName.value.trim()) return
  await tagsStore.createTag({
    name: newTagName.value.trim(),
    color: newTagColor.value,
    icon: newTagIcon.value,
  })
  newTagName.value = ''
  showNewTag.value = false
}

const saving = ref(false)
const saveError = ref('')

async function save() {
  if (!form.title.trim()) return
  if (saving.value) return

  saving.value = true
  saveError.value = ''

  try {
    const dueDate = form.due_date_local ? new Date(form.due_date_local).toISOString() : null
    const reminderDate = form.reminder_date_local ? new Date(form.reminder_date_local).toISOString() : null

    if (isEdit.value) {
      // Update
      await storage.updateCard(route.params.id as string, {
        title: form.title.trim(),
        content: form.content_text ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: form.content_text }] }] } : null,
        cover_image: form.cover_image,
        tags: form.tags,
        status: form.status,
        priority: form.priority,
        due_date: dueDate,
        reminder_date: reminderDate,
      })

      // Save attachments
      for (const blob of newAttachments.value) {
        await storage.saveAttachment({
          card_id: route.params.id as string,
          blob,
        })
      }

      router.replace(`/cards/${route.params.id}`)
    } else {
      // Create
      const id = uuid()
      await storage.saveCard({
        id,
        title: form.title.trim(),
        content: form.content_text ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: form.content_text }] }] } : null,
        cover_image: form.cover_image,
        tags: form.tags,
        status: form.status,
        priority: form.priority,
        due_date: dueDate,
        reminder_date: reminderDate,
      })

      for (const blob of newAttachments.value) {
        await storage.saveAttachment({
          card_id: id,
          blob,
        })
      }

      router.replace(`/cards/${id}`)
    }
  } catch (e: any) {
    console.error('[CardEditor] Save failed:', e)
    saveError.value = e?.message || '保存失败，请稍后重试'
    alert('保存失败：' + (e?.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(async () => {
  await tagsStore.fetchTags()

  if (isEdit.value) {
    const card = await storage.getCard(route.params.id as string)
    if (card) {
      form.title = card.title
      // Extract text from Tiptap JSON
      if (typeof card.content === 'object' && card.content?.content) {
        form.content_text = card.content.content.map((p: any) =>
          p.content?.map((t: any) => t.text).join('') || ''
        ).join('\n')
      } else if (typeof card.content === 'string') {
        form.content_text = card.content
      }
      form.tags = [...card.tags]
      form.status = card.status
      form.priority = card.priority
      form.due_date_local = card.due_date ? card.due_date.substring(0, 10) : ''
      form.reminder_date_local = card.reminder_date ? card.reminder_date.substring(0, 16) : ''
      if (card.cover_image) {
        form.cover_image = card.cover_image
        coverPreview.value = URL.createObjectURL(card.cover_image)
      }
    }
  }
})
</script>
