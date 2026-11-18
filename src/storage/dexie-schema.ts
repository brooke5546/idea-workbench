import Dexie, { type Table } from 'dexie'
import type { Card, Tag, TimelineEntry, ImageAttachment } from '../types'

export class AppDatabase extends Dexie {
  cards!: Table<Card, string>
  tags!: Table<Tag, string>
  timeline!: Table<TimelineEntry, string>
  attachments!: Table<ImageAttachment, string>
  search_index!: Table<{
    id: string
    entity_type: 'card' | 'timeline' | 'tag'
    entity_id: string
    content_text: string
  }, string>

  constructor() {
    super('idea-workbench')
    this.version(1).stores({
      cards: 'id, status, priority, created_at, updated_at, reminder_date',
      tags: 'id, name',
      timeline: 'id, card_id, created_at',
      attachments: 'id, card_id, created_at',
      search_index: 'id, entity_type, entity_id, content_text',
    })
  }
}

export const db = new AppDatabase()
