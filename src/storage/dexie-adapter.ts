import { db } from './dexie-schema'
import type { StorageAdapter } from './interface'
import type { Card, Tag, TimelineEntry, ImageAttachment, CardFilter, SearchResult } from '../types'
import { v4 as uuid } from '../utils/uuid'

function nowISO() {
  return new Date().toISOString()
}

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

export class DexieStorageAdapter implements StorageAdapter {
  // ===== Card =====
  async getCard(id: string): Promise<Card | null> {
    return (await db.cards.get(id)) || null
  }

  async getAllCards(filter?: CardFilter): Promise<Card[]> {
    let collection = db.cards.toCollection()

    if (filter?.status && filter.status.length > 0) {
      collection = collection.filter(c => filter.status!.includes(c.status))
    }
    if (filter?.tagIds && filter.tagIds.length > 0) {
      collection = collection.filter(c =>
        c.tags.some(t => filter.tagIds!.includes(t))
      )
    }
    if (filter?.priority && filter.priority.length > 0) {
      collection = collection.filter(c => filter.priority!.includes(c.priority))
    }

    const cards = await collection.toArray()
    return cards.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }

  async saveCard(card: any): Promise<string> {
    const id = card.id || uuid()
    const now = nowISO()
    const full: Card = {
      id,
      title: card.title,
      content: card.content || null,
      cover_image: card.cover_image || null,
      status: card.status || 'pending',
      priority: card.priority || 'medium',
      tags: card.tags || [],
      reminder_date: card.reminder_date || null,
      due_date: card.due_date || null,
      created_at: card.created_at || now,
      updated_at: now,
      owner_id: card.owner_id || 'me',
      visibility: card.visibility || 'private',
    }
    await db.cards.put(full)

    // Update search index
    await this.updateSearchIndex('card', id, `${full.title} ${tiptapToText(full.content)}`)

    return id
  }

  async updateCard(id: string, patch: Partial<Card>): Promise<void> {
    const now = nowISO()
    await db.cards.update(id, { ...patch, updated_at: now })
    const card = await db.cards.get(id)
    if (card) {
      await this.updateSearchIndex('card', id, `${card.title} ${tiptapToText(card.content)}`)
    }
  }

  async deleteCard(id: string): Promise<void> {
    await db.cards.delete(id)
    await db.timeline.where('card_id').equals(id).delete()
    await db.attachments.where('card_id').equals(id).delete()
    await db.search_index.where({ entity_type: 'card', entity_id: id }).delete()
    await db.search_index.where({ entity_type: 'timeline', entity_id: id }).delete()
  }

  // ===== Tag =====
  async getTag(id: string): Promise<Tag | null> {
    return (await db.tags.get(id)) || null
  }

  async getAllTags(): Promise<Tag[]> {
    return db.tags.orderBy('name').toArray()
  }

  async saveTag(tag: any): Promise<string> {
    const id = tag.id || uuid()
    const full: Tag = {
      id,
      name: tag.name,
      color: tag.color || '#6b7280',
      icon: tag.icon || null,
    }
    await db.tags.put(full)
    await this.updateSearchIndex('tag', id, full.name)
    return id
  }

  async deleteTag(id: string): Promise<void> {
    await db.tags.delete(id)
    // Remove tag from all cards
    const cards = await db.cards.toArray()
    for (const card of cards) {
      if (card.tags.includes(id)) {
        card.tags = card.tags.filter(t => t !== id)
        await this.updateCard(card.id, { tags: card.tags })
      }
    }
    await db.search_index.where({ entity_type: 'tag', entity_id: id }).delete()
  }

  // ===== Timeline =====
  async getTimeline(cardId: string): Promise<TimelineEntry[]> {
    return db.timeline.where('card_id').equals(cardId).reverse().sortBy('created_at')
  }

  async saveTimelineEntry(entry: any): Promise<string> {
    const id = entry.id || uuid()
    const now = nowISO()
    const full: TimelineEntry = {
      id,
      card_id: entry.card_id,
      content: entry.content,
      mood: entry.mood || null,
      created_at: entry.created_at || now,
    }
    await db.timeline.put(full)

    // Update card's updated_at
    await db.cards.update(entry.card_id, { updated_at: now })

    await this.updateSearchIndex('timeline', id, full.content)
    return id
  }

  async deleteTimelineEntry(id: string): Promise<void> {
    const entry = await db.timeline.get(id)
    if (entry) {
      await db.timeline.delete(id)
      await db.search_index.where({ entity_type: 'timeline', entity_id: id }).delete()
      await db.cards.update(entry.card_id, { updated_at: nowISO() })
    }
  }

  // ===== Attachments =====
  async getAttachments(cardId: string): Promise<ImageAttachment[]> {
    return db.attachments.where('card_id').equals(cardId).reverse().sortBy('created_at')
  }

  async saveAttachment(att: any): Promise<string> {
    const id = att.id || uuid()
    const now = nowISO()
    const full: ImageAttachment = {
      id,
      card_id: att.card_id,
      blob: att.blob,
      caption: att.caption || null,
      created_at: att.created_at || now,
    }
    await db.attachments.put(full)
    await db.cards.update(att.card_id, { updated_at: now })
    return id
  }

  async deleteAttachment(id: string): Promise<void> {
    const att = await db.attachments.get(id)
    if (att) {
      await db.attachments.delete(id)
      await db.cards.update(att.card_id, { updated_at: nowISO() })
    }
  }

  // ===== Search =====
  async search(query: string): Promise<SearchResult[]> {
    const q = query.toLowerCase().trim()
    if (!q) return []

    const results: SearchResult[] = []

    // Search cards
    const cards = await db.cards.toArray()
    for (const card of cards) {
      const titleMatch = card.title.toLowerCase().includes(q)
      const contentText = tiptapToText(card.content).toLowerCase()
      const contentMatch = contentText.includes(q)
      if (titleMatch || contentMatch) {
        results.push({
          entity_type: 'card',
          entity_id: card.id,
          title: card.title,
          snippet: titleMatch ? card.title : contentText.substring(Math.max(0, contentText.indexOf(q) - 20), 80),
        })
      }
    }

    // Search timeline
    const timeline = await db.timeline.toArray()
    for (const entry of timeline) {
      if (entry.content.toLowerCase().includes(q)) {
        const card = await db.cards.get(entry.card_id)
        results.push({
          entity_type: 'timeline',
          entity_id: entry.id,
          title: card?.title || '(未知卡片)',
          snippet: entry.content.substring(Math.max(0, entry.content.toLowerCase().indexOf(q) - 20), 80),
        })
      }
    }

    // Search tags
    const tags = await db.tags.toArray()
    for (const tag of tags) {
      if (tag.name.toLowerCase().includes(q)) {
        results.push({
          entity_type: 'tag',
          entity_id: tag.id,
          title: `🏷️ ${tag.name}`,
        })
      }
    }

    return results
  }

  // ===== Backup =====
  async exportAll(): Promise<any> {
    return {
      version: 1,
      exported_at: nowISO(),
      cards: await db.cards.toArray(),
      tags: await db.tags.toArray(),
      timeline: await db.timeline.toArray(),
      attachments: await db.attachments.toArray(),
    }
  }

  async importAll(data: any): Promise<void> {
    await db.transaction('rw', [db.cards, db.tags, db.timeline, db.attachments, db.search_index], async () => {
      await db.cards.clear()
      await db.tags.clear()
      await db.timeline.clear()
      await db.attachments.clear()
      await db.search_index.clear()

      if (data.tags) await db.tags.bulkPut(data.tags)
      if (data.cards) await db.cards.bulkPut(data.cards)
      if (data.timeline) await db.timeline.bulkPut(data.timeline)
      if (data.attachments) await db.attachments.bulkPut(data.attachments)

      // Rebuild search index
      for (const card of data.cards || []) {
        await this.updateSearchIndex('card', card.id, `${card.title} ${tiptapToText(card.content)}`)
      }
      for (const tl of data.timeline || []) {
        await this.updateSearchIndex('timeline', tl.id, tl.content)
      }
      for (const tag of data.tags || []) {
        await this.updateSearchIndex('tag', tag.id, tag.name)
      }
    })
  }

  // ===== Internal =====
  private async updateSearchIndex(entityType: 'card' | 'timeline' | 'tag', entityId: string, text: string) {
    const id = `${entityType}:${entityId}`
    await db.search_index.put({
      id,
      entity_type: entityType,
      entity_id: entityId,
      content_text: text.toLowerCase(),
    })
  }
}

export const storage = new DexieStorageAdapter()
