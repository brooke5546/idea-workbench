import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '../storage/dexie-adapter'
import type { Tag } from '../types'

export const useTagsStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([])
  const loading = ref(false)

  async function fetchTags() {
    loading.value = true
    try {
      tags.value = await storage.getAllTags()
    } finally {
      loading.value = false
    }
  }

  async function createTag(data: Omit<Tag, 'id'>): Promise<string> {
    const id = await storage.saveTag(data)
    await fetchTags()
    return id
  }

  async function updateTag(id: string, patch: Partial<Tag>) {
    const tag = await storage.getTag(id)
    if (tag) {
      await storage.saveTag({ ...tag, ...patch })
      await fetchTags()
    }
  }

  async function deleteTag(id: string) {
    await storage.deleteTag(id)
    tags.value = tags.value.filter(t => t.id !== id)
  }

  function getTagById(id: string): Tag | undefined {
    return tags.value.find(t => t.id === id)
  }

  return { tags, loading, fetchTags, createTag, updateTag, deleteTag, getTagById }
})
