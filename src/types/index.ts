// ===== Types =====

export type CardStatus = 'pending' | 'doing' | 'done' | 'archived'
export type CardPriority = 'low' | 'medium' | 'high'
export type Visibility = 'private' | 'public' | 'shared'

export interface Card {
  id: string
  title: string
  content: any // Tiptap JSON
  cover_image?: Blob | null
  status: CardStatus
  priority: CardPriority
  tags: string[] // tag ids
  reminder_date?: string | null
  due_date?: string | null
  created_at: string
  updated_at: string
  owner_id: string
  visibility: Visibility
}

export interface Tag {
  id: string
  name: string
  color: string
  icon?: string | null
}

export interface TimelineEntry {
  id: string
  card_id: string
  content: string
  mood?: string | null
  created_at: string
}

export interface ImageAttachment {
  id: string
  card_id: string
  blob: Blob
  caption?: string | null
  created_at: string
}

export interface CardFilter {
  status?: CardStatus[]
  tagIds?: string[]
  priority?: CardPriority[]
  dueFrom?: string
  dueTo?: string
}

export interface SearchResult {
  entity_type: 'card' | 'timeline' | 'tag'
  entity_id: string
  title: string
  snippet?: string
  score?: number
}
