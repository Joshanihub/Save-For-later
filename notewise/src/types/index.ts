// ─── Core Entity Types ──────────────────────────────────────────

export interface Note {
  id: string;
  userId: string;
  collectionId: string | null;
  title: string;
  content: string;
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  isArchived: boolean;
  isSoftDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string;
  note_tags?: { tag_id: string }[];
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  iconEmoji: string;
  parentCollectionId: string | null;
  isArchived: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  isCustom: boolean;
  createdAt: string;
}

export interface NoteTag {
  noteId: string;
  tagId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  noteId: string;
  userId: string;
  title: string;
  isCompleted: boolean;
  dueDate: string | null;
  recurrence: string | null;
  nextDueDate: string | null;
  priority: number;
  position: number;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  noteId: string;
  userId: string;
  message: string;
  nextDueAt: string;
  isSnoozed: boolean;
  snoozeUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Sync Types ─────────────────────────────────────────────────

export type SyncAction = 'create' | 'update' | 'delete';
export type SyncResourceType = 'note' | 'collection' | 'tag' | 'task' | 'reminder';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncQueueItem {
  id: string;
  action: SyncAction;
  resourceType: SyncResourceType;
  resourceId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
}

// ─── UI State Types ─────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'auto';
export type SortOrder = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'updated';
export type ViewMode = 'grid' | 'list';

export interface UserPreferences {
  theme: ThemeMode;
  fontPair: string;
  sidebarWidth: number;
  defaultSort: SortOrder;
  viewMode: ViewMode;
  notificationsEnabled: boolean;
  weeklyDigestEnabled: boolean;
  dailyPromptEnabled: boolean;
}

// ─── Encryption Types ───────────────────────────────────────────

export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
  version: number;
}

// ─── Auth Types ─────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

// ─── API / Filter Types ────────────────────────────────────────

export interface NoteFilters {
  collectionId?: string;
  tags?: string[];
  archived?: boolean;
  searchQuery?: string;
  sortOrder?: SortOrder;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
