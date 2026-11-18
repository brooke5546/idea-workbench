import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '../storage/dexie-adapter'
import type { Card, CardFilter } from '../types'

export const useCardsStore = defineStore('cards', () => {
  const cards = ref<Card[]>([])
  const loading = ref(false)

  async function fetchCards(filter?: CardFilter) {
    loading.value = true
    try {
      cards.value = await storage.getAllCards(filter)
    } finally {
      loading.value = false
    }
  }

  async function fetchCard(id: string): Promise<Card | null> {
    return storage.getCard(id)
  }

  async function createCard(data: Partial<Card>): Promise<string> {
    const id = await storage.saveCard(data as any)
    await fetchCards()
    return id
  }

  async function updateCard(id: string, patch: Partial<Card>) {
    await storage.updateCard(id, patch)
    const idx = cards.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      cards.value[idx] = { ...cards.value[idx], ...patch, updated_at: new Date().toISOString() }
    }
  }

  async function deleteCard(id: string) {
    await storage.deleteCard(id)
    cards.value = cards.value.filter(c => c.id !== id)
  }

  return { cards, loading, fetchCards, fetchCard, createCard, updateCard, deleteCard }
})
