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

    // iOS Safari IndexedDB 兼容性修复
    this.on('versionchange', () => {
      console.log('[Dexie] Database version changed, will reload')
    })
  }
}

// 全局错误绑定：捕获 iOS Safari 上可能的 IndexedDB 异常
if (typeof window !== 'undefined') {
  // 监听 IndexedDB 的错误事件
  document.addEventListener('error', (e) => {
    const msg = e.message || ''
    if (msg.includes('IndexedDB') || msg.includes('IDB') || msg.includes('IndexedDatabase')) {
      console.warn('[DB] IndexedDB error detected:', msg)
    }
  })
}

export const db = new AppDatabase()

// 验证数据库可用
export async function verifyDatabase(): Promise<boolean> {
  try {
    await db.open()
    return true
  } catch (e) {
    console.error('[DB] Failed to open database:', e)
    return false
  }
}
