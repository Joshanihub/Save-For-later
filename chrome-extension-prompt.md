# Apple-Inspired Note-Taking Chrome Extension Prompt

## PROJECT VISION

Build **Notewise** — a minimalist, Apple-designed Chrome extension that transforms the new tab page into a powerful productivity hub. Users capture thoughts instantly, organize beautifully, and sync seamlessly with their lives. The extension operates entirely offline (with end-to-end encryption) while syncing in real-time to Supabase when connection returns. Think Apple Notes meets Notion's power, but lightweight and free.

---

## CORE REQUIREMENTS

### 1. ARCHITECTURE STACK
- **Frontend**: React 18+ with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL) + Edge Functions for real-time sync
- **Desktop**: Manifest V3 Chrome Extension
- **State Management**: TanStack Query (React Query) + Zustand for client state
- **Encryption**: TweetNaCl.js for AES-256-GCM encryption (offline storage)
- **Sync Engine**: Custom optimistic update + offline queue (IndexedDB)
- **Plugin System**: iframe-based sandboxed plugin architecture with postMessage API

### 2. DESIGN SYSTEM
**Apple Design Language**:
- Minimalist sans-serif (SF Pro Display for headings, SF Pro Text for body)
- Color palette: Neutral grays (#1D1D1D, #F5F5F7, #FFFFFF), semantic colors only
- Spacing grid: 4px increments (4, 8, 12, 16, 20, 24, 32, 40)
- Shadows: Soft, layered shadows for depth (sm: 0 1px 3px rgba(0,0,0,0.1), md: 0 4px 12px rgba(0,0,0,0.15))
- Motion: Subtle spring animations (duration: 200-300ms, easing: cubic-bezier(0.34, 1.56, 0.64, 1))
- Dark mode: Built-in, respects system preference

---

## FEATURE SET

### A. CORE CRUD + UNIQUE DIFFERENTIATORS

#### 1. **Smart Note Creation** (Unique)
- **Natural input formats**: Markdown support with live preview
- **Voice capture**: Transcribe via browser Speech API (offline fallback)
- **Quick capture modal**: Cmd/Ctrl+Shift+N global hotkey
- **Templates**: Pre-built templates (Daily standup, Meeting notes, Ideas, Todo)
- **Rich content**: Inline code, math (KaTeX), embeds (YouTube, Twitter links)

#### 2. **Hierarchical Organization** (Unique)
- **Smart collections**: Auto-tag notes with AI-suggested tags (on sync)
- **Linked notes**: Bidirectional links like Obsidian [[note-link]]
- **Full-text search**: Real-time search across 10k+ notes (Supabase FTS)
- **Reading time**: Auto-calculated; sort by reading time
- **Smart folders**: Nested collection hierarchy with drag-drop reordering

#### 3. **Note Management**
- **Create**: Support markdown, rich text, voice, templates
- **Read**: Infinite scroll, search, filter by tag/date/collection
- **Update**: Live sync to Supabase, offline queue for sync later
- **Delete**: Soft delete (30-day recovery) with hard delete option
- **Archive**: Archive old notes, exclude from search by default

#### 4. **Sharing & Collaboration** (Unique)
- **Shareable links**: Generate read-only public links with expiry dates
- **Encrypted sharing**: Share encrypted notes without account creation
- **Collection sharing**: Share an entire collection with granular permissions
- **Comment threads**: Add comments to shared notes (non-owner collaboration)

---

### B. OFFLINE-FIRST ARCHITECTURE

#### 1. **Offline Storage**
- **IndexedDB database**: Full note sync to IndexedDB on first load
- **End-to-end encryption**: User's passphrase (derived from password) encrypts all offline data
- **Sync queue**: Offline changes queued in a separate table; synced on reconnect
- **Conflict resolution**: Server-side wins + local conflict flagging for user review
- **Storage quota**: Monitor and alert user when approaching limits (50MB cap)

#### 2. **Encryption Pipeline**
```
User Input
  ↓
Encrypt with TweetNaCl (key derived from user password + salt)
  ↓
Store in IndexedDB (encryptedText, nonce, version)
  ↓
On sync: Decrypt locally, send plain text + metadata to Supabase HTTPS
  ↓
Supabase stores decrypted (user controls encryption at application layer)
```

#### 3. **Real-Time Sync**
- **Supabase Realtime**: WebSocket subscription to notes table
- **Optimistic updates**: UI updates immediately; server confirms
- **Last-write-wins**: Server timestamp comparison for conflict resolution
- **Batch sync**: Debounce offline changes for 5 seconds before syncing
- **Sync indicators**: Toast notifications showing sync status + error messages

---

### C. PRODUCTIVITY WIDGETS (Built-in, Extensible)

#### 1. **Task List Widget**
- Inline checklist within notes
- Quick task creation from note content
- Task statistics: % complete, due date tracking
- Recurring tasks (daily, weekly, monthly)
- Drag-drop priority reordering
- **Real data**: Tasks stored in `tasks` table, linked to notes

#### 2. **Pomodoro Timer Widget**
- 25-min work / 5-min break (customizable)
- Browser notifications on interval complete
- Break recommendations ("Walk 100 steps" / "Hydrate")
- Session history: track productivity patterns
- **Real data**: Store sessions in `pomodoro_sessions` table for stats

#### 3. **Reminders Widget**
- Schedule reminders for notes (1 min to 1 year from now)
- Smart reminder times: morning (8 AM), afternoon (2 PM), evening (6 PM)
- Browser notifications + in-app alerts
- Reminder history: mark as complete, snooze, delete
- **Real data**: Reminders table with next_due_at timestamp

#### 4. **Daily Standup Generator** (Unique)
- Pulls yesterday's completed tasks
- Prompts for today's priorities
- Aggregates blockers from notes tagged #blocker
- Generates shareable standup template
- **Real data**: Analyzes completed tasks + notes from past 24h

#### 5. **Reading List Widget**
- Save articles, tweets, PDFs for later
- Reading time estimate
- Sort by source, date, reading time
- Archive read items
- **Real data**: Reading list table with metadata (url, title, reading_time, read_at)

#### 6. **Analytics Dashboard** (Unique)
- Notes created per day (7-day, 30-day views)
- Busiest time of day
- Most-used tags
- Longest notes (by word/character count)
- Writing streaks (consecutive days with notes)
- **Real data**: All from notes + metadata tables via Supabase aggregations

---

### D. PLUGIN ECOSYSTEM (Free, Sandboxed)

#### 1. **Plugin Architecture**
- **Plugin manifest**: JSON-based (name, version, permissions, entrypoint URL)
- **Plugin types**:
  - **Widget plugins**: Embed in sidebar/dashboard
  - **Command plugins**: Add to context menu / slash commands
  - **Integration plugins**: Connect external APIs (Slack, GitHub, Trello, Notion)
- **Sandboxing**: iframes + postMessage API (no DOM access)
- **Permissions**: User explicitly grants (read, write, sync)

#### 2. **Official Free Plugins** (Built-in)
- **Slack integration**: Share notes to Slack; create notes from Slack messages
- **GitHub issues**: Capture GitHub issues as notes; link to original issue
- **Calendar sync**: Show upcoming events; remind about meetings
- **Weather widget**: Display current weather + forecast for focus
- **Timer integrations**: Pomodoro syncs to Calendar as blocking time
- **Export**: Export notes to PDF, Markdown, Notion

#### 3. **Developer API**
```javascript
// Plugin access to Notewise API
window.notewise = {
  note: {
    create(title, content, tags) → Promise<Note>,
    list(filters) → Promise<Note[]>,
    update(id, updates) → Promise<Note>,
    delete(id, soft=true) → Promise<void>,
    search(query) → Promise<Note[]>
  },
  collections: {
    list() → Promise<Collection[]>,
    create(name) → Promise<Collection>,
    addNote(collectionId, noteId) → Promise<void>
  },
  tags: {
    list() → Promise<Tag[]>,
    create(name) → Promise<Tag>,
    addToNote(noteId, tagId) → Promise<void>
  },
  sync: {
    status() → 'online' | 'offline' | 'syncing',
    onStatusChange(callback) → unsubscribe()
  },
  user: {
    getProfile() → Promise<User>,
    updatePreferences(prefs) → Promise<User>
  }
};
```

---

### E. RETENTION & ENGAGEMENT FEATURES

#### 1. **Streak System**
- Track consecutive days of note creation
- Milestone badges (7-day, 30-day, 100-day streaks)
- Streak lost recovery: Skip 1 day without losing streak
- Leaderboard (friend comparison, optional)
- **Real data**: `user_streaks` table tracking daily creation

#### 2. **Weekly Digest**
- Friday email: Summary of week (notes created, words written, tags used)
- Highlights: Best-performing notes (by engagement, if shared)
- Stats: Writing time, busiest day, focus time (from Pomodoro)
- **Real data**: Generated from notes, pomodoro_sessions, and read_at timestamps

#### 3. **Smart Recommendations** (Unique)
- **Related notes**: Show related notes when viewing a note (by tag, keyword)
- **Resurfacing**: Prompt to review old notes (monthly, by relevance)
- **Daily prompt**: Random writing prompt sent daily (opt-in)
- **Content ideas**: Suggest notes to elaborate on based on length/completeness
- **Trending topics**: Show trending tags across all users (aggregated, anonymized)

#### 4. **Collaboration Features**
- **Shared collections**: Work together on shared note collections
- **Comment threads**: Comment on shared notes (read-only users can comment)
- **Mentions**: Tag @username in notes to notify collaborators
- **Activity feed**: See when collaborators update shared notes
- **Real data**: `share_permissions`, `comments`, `activities` tables

#### 5. **Gamification** (Light-touch)
- **Badges**: Achieve milestones (first note, 100 notes, shared 10 notes, etc.)
- **XP system**: Earn points for daily use, collaborating, sharing (optional opt-in)
- **Leaderboard**: Friend or global leaderboard (optional, privacy-respecting)
- **Achievements**: Hidden achievements for discovering features

#### 6. **Personalization**
- **Theme customization**: Light, dark, auto (system), custom color options
- **Font selection**: 8 font pairings (SF Pro, Inter, Playfair, etc.)
- **Sidebar size**: Collapsible sidebar with width customization
- **Quick actions**: Customize toolbar buttons
- **Note sort order**: Default sort (newest, oldest, title, date modified)
- **Real data**: `user_preferences` table

---

## DATABASE SCHEMA

### Core Tables

```sql
-- Users & Auth (managed by Supabase Auth)
users (id, email, created_at, updated_at)

-- Collections (folders/notebooks)
collections (
  id UUID PK,
  user_id UUID FK,
  name TEXT,
  description TEXT,
  color TEXT (hex),
  icon_emoji TEXT,
  parent_collection_id UUID (nullable, for nesting),
  is_archived BOOLEAN,
  position INTEGER (for ordering),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX: user_id, parent_collection_id
)

-- Notes (core table)
notes (
  id UUID PK,
  user_id UUID FK,
  collection_id UUID FK (nullable),
  title TEXT NOT NULL,
  content TEXT (markdown),
  word_count INTEGER,
  char_count INTEGER,
  reading_time_minutes INTEGER,
  is_archived BOOLEAN,
  is_soft_deleted BOOLEAN,
  deleted_at TIMESTAMP (nullable, for recovery),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  synced_at TIMESTAMP (last successful sync),
  INDEX: user_id, collection_id, created_at, is_archived
)

-- Tags
tags (
  id UUID PK,
  user_id UUID FK,
  name TEXT,
  color TEXT (hex),
  is_custom BOOLEAN,
  created_at TIMESTAMP,
  INDEX: user_id
)

-- Note-Tag Junction (many-to-many)
note_tags (
  note_id UUID FK,
  tag_id UUID FK,
  created_at TIMESTAMP,
  PRIMARY KEY: (note_id, tag_id)
)

-- Linked Notes (bidirectional references)
note_links (
  source_note_id UUID FK,
  target_note_id UUID FK,
  link_type TEXT ('references', 'is_related_to', 'blocks'),
  created_at TIMESTAMP,
  PRIMARY KEY: (source_note_id, target_note_id, link_type)
)

-- Tasks (within notes)
tasks (
  id UUID PK,
  note_id UUID FK,
  title TEXT,
  is_completed BOOLEAN,
  due_date TIMESTAMP (nullable),
  recurrence TEXT (nullable, 'daily', 'weekly', 'monthly'),
  next_due_date TIMESTAMP,
  priority INTEGER (1-5),
  position INTEGER,
  created_at TIMESTAMP,
  completed_at TIMESTAMP (nullable),
  INDEX: note_id, user_id, is_completed
)

-- Reminders
reminders (
  id UUID PK,
  note_id UUID FK,
  user_id UUID FK,
  message TEXT,
  next_due_at TIMESTAMP,
  is_snoozed BOOLEAN,
  snooze_until TIMESTAMP (nullable),
  created_at TIMESTAMP,
  INDEX: user_id, next_due_at
)

-- Pomodoro Sessions
pomodoro_sessions (
  id UUID PK,
  user_id UUID FK,
  duration_minutes INTEGER,
  breaks_taken INTEGER,
  completed_at TIMESTAMP,
  notes_created_during_session UUID[] (array of note IDs),
  created_at TIMESTAMP,
  INDEX: user_id, completed_at
)

-- Reading List
reading_list (
  id UUID PK,
  user_id UUID FK,
  url TEXT,
  title TEXT,
  content_preview TEXT,
  reading_time_minutes INTEGER,
  is_read BOOLEAN,
  read_at TIMESTAMP (nullable),
  created_at TIMESTAMP,
  INDEX: user_id, created_at, is_read
)

-- Sharing & Permissions
share_links (
  id UUID PK,
  creator_user_id UUID FK,
  note_id UUID FK (nullable),
  collection_id UUID FK (nullable),
  access_token TEXT UNIQUE,
  access_type TEXT ('read_only', 'comment', 'edit'),
  expires_at TIMESTAMP (nullable),
  password_protected BOOLEAN,
  is_encrypted BOOLEAN,
  created_at TIMESTAMP,
  INDEX: creator_user_id, access_token
)

share_permissions (
  id UUID PK,
  owner_user_id UUID FK,
  collaborator_user_id UUID FK,
  note_id UUID FK (nullable),
  collection_id UUID FK (nullable),
  permission TEXT ('view', 'comment', 'edit'),
  created_at TIMESTAMP,
  UNIQUE(owner_user_id, collaborator_user_id, note_id, collection_id)
)

-- Comments on shared notes
comments (
  id UUID PK,
  note_id UUID FK,
  author_user_id UUID FK,
  content TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX: note_id, author_user_id
)

-- Activity log
activities (
  id UUID PK,
  user_id UUID FK,
  action TEXT ('created', 'updated', 'deleted', 'shared', 'commented'),
  resource_type TEXT ('note', 'collection', 'comment'),
  resource_id UUID,
  collaborator_user_id UUID (nullable),
  created_at TIMESTAMP,
  INDEX: user_id, created_at
)

-- User Streaks
user_streaks (
  user_id UUID PK FK,
  current_streak INTEGER,
  longest_streak INTEGER,
  last_activity_date DATE,
  updated_at TIMESTAMP
)

-- User Preferences
user_preferences (
  user_id UUID PK FK,
  theme TEXT ('light', 'dark', 'auto'),
  font_pair TEXT ('sf-pro', 'inter', 'playfair', etc),
  sidebar_width INTEGER (200-400),
  default_sort TEXT ('newest', 'oldest', 'title'),
  notifications_enabled BOOLEAN,
  weekly_digest_enabled BOOLEAN,
  daily_prompt_enabled BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Offline Sync Queue (tracks pending changes)
sync_queue (
  id UUID PK,
  user_id UUID FK,
  action TEXT ('create', 'update', 'delete'),
  resource_type TEXT ('note', 'task', 'reminder'),
  resource_id UUID,
  payload JSONB,
  created_at TIMESTAMP,
  synced_at TIMESTAMP (nullable),
  INDEX: user_id, synced_at
)

-- Plugins
plugins (
  id UUID PK,
  name TEXT,
  version TEXT,
  author TEXT,
  description TEXT,
  icon_url TEXT,
  manifest_url TEXT (points to plugin.json),
  created_at TIMESTAMP
)

user_plugins (
  user_id UUID FK,
  plugin_id UUID FK,
  is_enabled BOOLEAN,
  permissions TEXT[] (array of granted permissions),
  created_at TIMESTAMP,
  PRIMARY KEY: (user_id, plugin_id)
)
```

---

## API ENDPOINTS (Supabase Functions + Custom Edge Functions)

### Notes API
```
POST   /api/notes                    → Create note
GET    /api/notes                    → List notes (with filters, search, pagination)
GET    /api/notes/:id                → Get single note
PATCH  /api/notes/:id                → Update note
DELETE /api/notes/:id?soft=true      → Soft delete
DELETE /api/notes/:id?soft=false     → Hard delete
POST   /api/notes/:id/duplicate      → Duplicate note
POST   /api/notes/batch              → Batch create/update (for sync)
```

### Collections API
```
POST   /api/collections              → Create collection
GET    /api/collections              → List collections
GET    /api/collections/:id/notes    → Get notes in collection
PATCH  /api/collections/:id          → Update collection
DELETE /api/collections/:id          → Delete collection
POST   /api/collections/:id/reorder  → Reorder collections/notes
```

### Search & Analytics
```
GET    /api/search?q=query&limit=20  → Full-text search
GET    /api/analytics/stats          → User stats (note count, word count, etc)
GET    /api/analytics/daily          → Daily creation metrics
GET    /api/reading-time             → Estimated reading time by tag/collection
```

### Sharing
```
POST   /api/share/create             → Create share link
GET    /api/share/:token             → Access shared note/collection
DELETE /api/share/:token             → Revoke share link
POST   /api/share/:token/comments    → Add comment to shared note
```

### Sync
```
POST   /api/sync                     → Sync offline queue with server
GET    /api/sync/status              → Get sync status
POST   /api/sync/reset               → Clear local cache (full resync)
```

### Plugins
```
GET    /api/plugins                  → List available plugins
POST   /api/plugins/:id/install      → Install plugin
DELETE /api/plugins/:id/uninstall    → Uninstall plugin
GET    /api/plugins/:id/manifest     → Get plugin manifest
```

---

## CLIENT ARCHITECTURE

### Directory Structure
```
src/
├── components/
│   ├── notes/
│   │   ├── NoteEditor.tsx           (Rich editor with markdown preview)
│   │   ├── NoteCard.tsx             (Note preview card)
│   │   ├── NoteList.tsx             (Virtual scrolling list)
│   │   └── NoteSidebar.tsx          (Collections & tags navigation)
│   ├── widgets/
│   │   ├── TaskWidget.tsx           (Inline task manager)
│   │   ├── PomodoroWidget.tsx       (Timer)
│   │   ├── RemindersWidget.tsx      (Reminders)
│   │   ├── ReadingListWidget.tsx    (Reading list)
│   │   └── AnalyticsDashboard.tsx   (Stats)
│   ├── plugins/
│   │   ├── PluginMarketplace.tsx    (Plugin browser)
│   │   ├── PluginContainer.tsx      (Sandboxed iframe)
│   │   └── PluginAPI.ts             (postMessage bridge)
│   ├── shared/
│   │   ├── Header.tsx
│   │   ├── CommandPalette.tsx       (Cmd/Ctrl+K)
│   │   └── SettingsPanel.tsx
│   └── modals/
│       ├── ShareModal.tsx
│       ├── ExportModal.tsx
│       └── CreateFromTemplateModal.tsx
├── hooks/
│   ├── useNotes.ts                  (Queries, mutations, optimistic updates)
│   ├── useOfflineSync.ts            (Offline queue management)
│   ├── useEncryption.ts             (Encryption/decryption)
│   ├── useLocalStorage.ts           (IndexedDB)
│   ├── useSearch.ts                 (Full-text search)
│   └── usePlugins.ts                (Plugin lifecycle)
├── store/
│   ├── notesStore.ts                (Zustand: note state)
│   ├── uiStore.ts                   (UI state: sidebar, modals)
│   └── preferencesStore.ts          (User preferences)
├── utils/
│   ├── encryption.ts                (TweetNaCl wrapper)
│   ├── sync.ts                      (Offline queue + conflict resolution)
│   ├── analytics.ts                 (Tracking)
│   ├── markdown.ts                  (Markdown parsing + rendering)
│   └── formatters.ts                (Date, time, word count)
├── services/
│   ├── api.ts                       (Supabase client + custom logic)
│   ├── auth.ts                      (Supabase Auth)
│   ├── indexedDB.ts                 (Local database)
│   └── plugins.ts                   (Plugin manager)
├── types/
│   ├── index.ts                     (TypeScript interfaces)
│   └── plugin.ts                    (Plugin types)
├── pages/
│   ├── Dashboard.tsx                (Main app layout)
│   ├── Settings.tsx                 (User settings & theme)
│   ├── PluginMarketplace.tsx        (Plugin store)
│   └── SharedNote.tsx               (Public share view)
├── styles/
│   └── globals.css                  (Tailwind config + custom CSS vars)
├── App.tsx                          (Main component)
└── index.tsx                        (Entry point)
```

### State Management Pattern
```typescript
// Zustand store example (notes)
import create from 'zustand';

interface NotesState {
  notes: Note[];
  selectedNoteId: string | null;
  // Queries
  fetchNotes: () => Promise<void>;
  searchNotes: (query: string) => Promise<void>;
  // Mutations
  createNote: (note: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string, soft?: boolean) => Promise<void>;
  // Offline
  addToSyncQueue: (action, data) => Promise<void>;
  syncPending: () => Promise<void>;
}

const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  selectedNoteId: null,
  fetchNotes: async () => {
    // TanStack Query integration
  },
  // ... other actions
}));
```

---

## OFFLINE-FIRST SYNC FLOW

```
1. User creates note (online)
   ↓
   Optimistic update: Add to UI immediately (orange indicator)
   ↓
   Encrypt with user's key
   ↓
   POST /api/notes + add to sync_queue
   ↓
   Server confirms → green indicator, update synced_at

2. User creates note (offline)
   ↓
   Encrypt with user's key
   ↓
   Store in IndexedDB (local)
   ↓
   Add to sync_queue (action: 'create')
   ↓
   Show sync status: "Offline - will sync when online"

3. Connection restored
   ↓
   Detect online event
   ↓
   Read sync_queue (all pending actions)
   ↓
   POST /api/sync with batch payload
   ↓
   Server processes in order, returns conflicts
   ↓
   Merge results: successful → mark synced_at, failed → flag for user review
   ↓
   Update UI with sync results
```

---

## ENCRYPTION IMPLEMENTATION

```typescript
// Encryption.ts
import nacl from 'tweetnacl';
import utils from 'tweetnacl-util';

export async function deriveKey(password: string, salt: string): Promise<Uint8Array> {
  // Use Argon2 (via WASM) or Scrypt for key derivation
  // Return 32-byte key
}

export function encrypt(plaintext: string, key: Uint8Array): {
  ciphertext: string;
  nonce: string;
  version: number;
} {
  const nonce = nacl.randomBytes(24);
  const box = nacl.secretbox(
    utils.decodeUTF8(plaintext),
    nonce,
    key
  );
  return {
    ciphertext: utils.encodeBase64(box),
    nonce: utils.encodeBase64(nonce),
    version: 1
  };
}

export function decrypt(
  ciphertext: string,
  nonce: string,
  key: Uint8Array
): string {
  const decrypted = nacl.secretbox.open(
    utils.decodeBase64(ciphertext),
    utils.decodeBase64(nonce),
    key
  );
  if (!decrypted) throw new Error('Decryption failed');
  return utils.encodeUTF8(decrypted);
}

// In IndexedDB storage
async function storeNoteEncrypted(note: Note, userKey: Uint8Array) {
  const { ciphertext, nonce } = encrypt(JSON.stringify(note), userKey);
  await db.notes.put({
    id: note.id,
    encryptedContent: ciphertext,
    nonce,
    encrypted: true,
    version: 1,
    stored_at: new Date()
  });
}
```

---

## TESTING STRATEGY

### Unit Tests
- Encryption/decryption (edge cases: empty strings, special chars, large payloads)
- Markdown parsing and rendering
- Conflict resolution logic
- Sync queue ordering
- Tag/collection filtering

### Integration Tests
- Create note → encrypt → store locally → sync to server → verify on server
- Offline change → reconnect → sync without data loss
- Concurrent edits from multiple tabs
- Plugin API surface (create, list, delete via plugin)

### E2E Tests (Cypress)
- User signup → first note creation → offline mode → reconnect → data preserved
- Sharing flow: create note → generate link → access via public link
- Pomodoro timer: start → complete → verify in stats
- Plugin installation: find plugin → install → verify in sidebar

### Performance Tests
- Note list render time (1000+ notes)
- Search latency (<100ms for 10k notes)
- Encryption time (<50ms for 10k character note)
- Offline queue sync (<2s for 100 pending changes)

---

## DEPLOYMENT & ROLLOUT

### Phase 1: MVP (Weeks 1-4)
- Core CRUD + offline sync
- Basic collections & tags
- Task widget only
- Light/dark theme
- Publish to Chrome Web Store

### Phase 2: Enhanced (Weeks 5-8)
- Pomodoro + Reminders widgets
- Sharing & collaboration
- Plugin architecture (basic: Slack, GitHub)
- Reading list widget
- Analytics dashboard

### Phase 3: Advanced (Weeks 9-12)
- Plugin marketplace (community plugins)
- Advanced analytics
- Gamification (streaks, badges)
- Weekly digest emails
- Notion & Obsidian export

### Phase 4: Scale (Weeks 13+)
- Team collaboration (workspaces)
- AI-powered features (auto-tagging, summarization)
- Mobile app
- Self-hosted option (open-source)

---

## SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| DAU | 10k by month 3 | Google Analytics |
| Retention (Day 7) | 40% | Amplitude cohort analysis |
| MAU | 50k by month 6 | Extension API active users |
| Avg notes/user | 50+ | Database query |
| Sync success rate | 99.9% | Backend logs |
| Load time | <1.5s | Chrome DevTools |
| Offline queue failures | <0.1% | Error tracking |
| Plugin installs | 5k+ cumulative | Plugin API metrics |
| Sharing link clicks | 1k+/month | Analytics |

---

## SECURITY CONSIDERATIONS

1. **Authentication**: Supabase Auth (magic link or email/password)
2. **Authorization**: RLS (Row-Level Security) policies on all tables
3. **Encryption**: User-controlled (client-side) for offline data
4. **Rate limiting**: API endpoints rate-limited by user ID
5. **CSRF protection**: Supabase handles for standard requests
6. **XSS prevention**: Sanitize markdown rendering (DOMPurify)
7. **Plugin sandboxing**: Iframe sandbox + CSP + postMessage validation
8. **Data expiration**: Soft-deleted notes purged after 30 days (cron job)

---

## MONETIZATION STRATEGY (OPTIONAL, FUTURE)

Keep free tier generous to maximize adoption:
- **Free tier**: 100 notes, basic widgets, community plugins
- **Pro ($9.99/month)**: Unlimited notes, advanced widgets, sync across devices, early access to features
- **Team ($19.99/month)**: Shared collections, workspaces, team analytics
- No ads, no tracking, no selling data

---

## IMPLEMENTATION CHECKLIST

- [ ] Supabase project setup + schema
- [ ] React app scaffolding + Tailwind config
- [ ] Chrome extension manifest + content script
- [ ] Auth flow (signup, login, password reset)
- [ ] Note CRUD + local storage
- [ ] Offline encryption + sync queue
- [ ] Real-time sync (WebSocket)
- [ ] Collections & tags
- [ ] Task widget
- [ ] Pomodoro widget
- [ ] Reminders widget
- [ ] Search (FTS)
- [ ] Sharing (public links)
- [ ] Plugin system (manifest + sandbox)
- [ ] Settings & preferences
- [ ] Dark mode
- [ ] Weekly digest (email)
- [ ] Analytics dashboard
- [ ] Testing (unit, integration, E2E)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Chrome Web Store submission

---

## BONUS: UNIQUE DIFFERENTIATORS SUMMARY

1. **Offline-first with encryption**: No data loss, privacy by default
2. **Bidirectional links**: Connect ideas like Obsidian
3. **Smart widgets**: Pomodoro + reminders + tasks in one place
4. **Plugin ecosystem**: Extensible without bloating core
5. **Daily standup generator**: AI-powered (future: optional Gemini API)
6. **Reading time calculations**: Know what you're committing to
7. **Streak system**: Gamified without being pushy
8. **Free forever**: Monetize later with Pro tier
9. **Apple design**: Feels native, not like a web app
10. **Zero login friction**: Magic link auth, remember device

---

End of Prompt. Ready to build.
