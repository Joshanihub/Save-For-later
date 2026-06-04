import type { Note } from '../types';

/** Generate a new empty Note with defaults */
export function createEmptyNote(userId: string, collectionId?: string): Note {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    userId,
    collectionId: collectionId ?? null,
    title: 'Untitled',
    content: '',
    wordCount: 0,
    charCount: 0,
    readingTimeMinutes: 0,
    isArchived: false,
    isSoftDeleted: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    syncedAt: now,
  };
}

/** Compute word/char count and reading time */
export function computeNoteStats(content: string): {
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
} {
  // Strip simple markdown formatting
  const plainText = content
    .replace(/[#*`_~>\[\]\(\)]/g, '')
    .trim();
    
  const charCount = plainText.length;
  // Match contiguous non-whitespace sequences
  const wordCount = plainText === '' ? 0 : (plainText.match(/\S+/g) || []).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, charCount, readingTimeMinutes };
}

/** Map Note type to Supabase DB schema (snake_case) */
export function toSnakeCaseNote(note: Note): Record<string, any> {
  return {
    id: note.id,
    user_id: note.userId,
    collection_id: note.collectionId,
    title: note.title,
    content: note.content,
    word_count: note.wordCount,
    char_count: note.charCount,
    reading_time_minutes: note.readingTimeMinutes,
    is_archived: note.isArchived,
    is_soft_deleted: note.isSoftDeleted,
    is_public: note.isPublic,
    public_slug: note.publicSlug,
    deleted_at: note.deletedAt,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    synced_at: note.syncedAt,
  };
}

/** Format a date into a relative human string */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}
