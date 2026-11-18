import type { Card, Tag, TimelineEntry, ImageAttachment, CardFilter, SearchResult } from '../types'

export interface StorageAdapter {
  // Card
  getCard(id: string): Promise<Card | null>
  getAllCards(filter?: CardFilter): Promise<Card[]>
  saveCard(card: Omit<Card, 'created_at' | 'updated_at' | 'owner_id' | 'visibility'> & Partial<Pick<Card, 'created_at' | 'updated_at' | 'owner_id' | 'visibility'>>): Promise<string>
  updateCard(id: string, patch: Partial<Card>): Promise<void>
  deleteCard(id: string): Promise<void>

  // Tag
  getTag(id: string): Promise<Tag | null>
  getAllTags(): Promise<Tag[]>
  saveTag(tag: Omit<Tag, 'id'> & { id?: string }): Promise<string>
  deleteTag(id: string): Promise<void>

  // Timeline
  getTimeline(cardId: string): Promise<TimelineEntry[]>
  saveTimelineEntry(entry: Omit<TimelineEntry, 'id' | 'created_at'> & { id?: string; created_at?: string }): Promise<string>
  deleteTimelineEntry(id: string): Promise<void>

  // Attachments
  getAttachments(cardId: string): Promise<ImageAttachment[]>
  saveAttachment(att: Omit<ImageAttachment, 'id' | 'created_at'> & { id?: string; created_at?: string }): Promise<string>
  deleteAttachment(id: string): Promise<void>

  // Search
  search(query: string): Promise<SearchResult[]>

  // Backup
  exportAll(): Promise<any>
  importAll(data: any): Promise<void>
}
