# Implementation Guide: Notewise Chrome Extension

## PART 1: PROJECT SETUP & ARCHITECTURE

### Step 1: Repository Structure & Initial Setup

```bash
# Create monorepo structure
mkdir notewise
cd notewise

# Frontend (React + Tailwind)
npx create-react-app frontend --template typescript
cd frontend
npm install -D tailwindcss postcss autoprefixer
npm install zustand @tanstack/react-query axios tweetnacl tweetnacl-util dexie @supabase/supabase-js
npm install -D @types/tweetnacl-util
cd ..

# Backend (Node + Express for local dev, Supabase for production)
mkdir backend
cd backend
npm init -y
npm install express cors dotenv @supabase/supabase-js
npm install -D typescript ts-node @types/express @types/node
cd ..

# Extension manifest & content script
mkdir extension
cat > extension/manifest.json << 'EOF'
{
  "manifest_version": 3,
  "name": "Notewise",
  "version": "0.1.0",
  "description": "Apple-inspired note-taking in your browser",
  "permissions": ["storage", "alarms", "notifications"],
  "action": {
    "default_popup": "index.html",
    "default_title": "Open Notewise"
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
EOF

# Root package.json for scripts
cd ..
npm init -y
```

### Step 2: Supabase Project Setup

```bash
# Create Supabase project at https://supabase.com/dashboard

# Environment variables
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
EOF
```

### Step 3: Database Initialization (Supabase SQL)

```sql
-- Run in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgtrgm";

-- Collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#000000',
  icon_emoji TEXT DEFAULT '📝',
  parent_collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name, parent_collection_id)
);

CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_parent ON collections(parent_collection_id);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  word_count INTEGER DEFAULT 0,
  char_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  is_soft_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_collection_id ON notes(collection_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_is_archived ON notes(is_archived);
CREATE INDEX idx_notes_full_text ON notes USING GIN(to_tsvector('english', content));

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);

-- Note-Tag junction table
CREATE TABLE note_tags (
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY(note_id, tag_id)
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMP WITH TIME ZONE,
  recurrence TEXT,
  next_due_date TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 3,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_note_id ON tasks(note_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Reminders table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  next_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_snoozed BOOLEAN DEFAULT FALSE,
  snooze_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_next_due_at ON reminders(next_due_at);

-- Pomodoro sessions
CREATE TABLE pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER DEFAULT 25,
  breaks_taken INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pomodoro_user_id ON pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_completed_at ON pomodoro_sessions(completed_at DESC);

-- Reading list
CREATE TABLE reading_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content_preview TEXT,
  reading_time_minutes INTEGER DEFAULT 5,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, url)
);

CREATE INDEX idx_reading_list_user_id ON reading_list(user_id);

-- Share links
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  access_token TEXT UNIQUE NOT NULL,
  access_type TEXT DEFAULT 'read_only',
  expires_at TIMESTAMP WITH TIME ZONE,
  password_protected BOOLEAN DEFAULT FALSE,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_share_links_access_token ON share_links(access_token);
CREATE INDEX idx_share_links_creator ON share_links(creator_user_id);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_note_id ON comments(note_id);

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'auto',
  font_pair TEXT DEFAULT 'sf-pro',
  sidebar_width INTEGER DEFAULT 280,
  default_sort TEXT DEFAULT 'newest',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  weekly_digest_enabled BOOLEAN DEFAULT TRUE,
  daily_prompt_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync queue for offline changes
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_synced_at ON sync_queue(synced_at);

-- User streaks
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "users_can_read_own_notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables...
```

---

## PART 2: FRONTEND IMPLEMENTATION

### Core Hook: useNotes.ts

```typescript
// src/hooks/useNotes.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import useNotesStore from '../store/notesStore';

export function useNotes(filters?: {
  collectionId?: string;
  tags?: string[];
  archived?: boolean;
}) {
  const supabase = useSupabaseClient();
  const { addToSyncQueue } = useNotesStore();

  const queryKey = ['notes', filters];

  // Fetch notes
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('notes')
        .select('*')
        .eq('is_soft_deleted', false);

      if (filters?.collectionId) {
        query = query.eq('collection_id', filters.collectionId);
      }
      if (filters?.archived !== undefined) {
        query = query.eq('is_archived', filters.archived);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Create note mutation
  const { mutate: createNote, isPending: isCreating } = useMutation({
    mutationFn: async (noteData: Partial<Note>) => {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          ...noteData,
          user_id: supabase.auth.user()?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newNote) => {
      // Optimistic update
      useNotesStore.setState((state) => ({
        notes: [newNote as Note, ...state.notes]
      }));

      // Queue for offline sync
      await addToSyncQueue({
        action: 'create',
        resourceType: 'note',
        payload: newNote
      });
    },
    onSuccess: () => {
      // Invalidate and refetch
      // queryClient.invalidateQueries(queryKey);
    }
  });

  // Update note mutation
  const { mutate: updateNote, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Note> }) => {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: ({ id, updates }) => {
      useNotesStore.setState((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
      }));
    }
  });

  // Delete note mutation
  const { mutate: deleteNote } = useMutation({
    mutationFn: async ({ id, soft = true }: { id: string; soft?: boolean }) => {
      if (soft) {
        await supabase
          .from('notes')
          .update({ is_soft_deleted: true, deleted_at: new Date().toISOString() })
          .eq('id', id);
      } else {
        await supabase
          .from('notes')
          .delete()
          .eq('id', id);
      }
    },
    onMutate: ({ id }) => {
      useNotesStore.setState((state) => ({
        notes: state.notes.filter(n => n.id !== id)
      }));
    }
  });

  return {
    notes,
    isLoading,
    error,
    createNote,
    isCreating,
    updateNote,
    isUpdating,
    deleteNote
  };
}
```

### Core Hook: useOfflineSync.ts

```typescript
// src/hooks/useOfflineSync.ts
import { useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import useNotesStore from '../store/notesStore';

export function useOfflineSync() {
  const supabase = useSupabaseClient();
  const { syncQueue, clearSyncQueue } = useNotesStore();

  const syncPending = useCallback(async () => {
    if (!navigator.onLine) {
      console.log('Offline: Not syncing');
      return;
    }

    for (const item of syncQueue) {
      try {
        if (item.action === 'create') {
          await supabase.from(item.resourceType + 's').insert([item.payload]);
        } else if (item.action === 'update') {
          await supabase
            .from(item.resourceType + 's')
            .update(item.payload)
            .eq('id', item.resourceId);
        } else if (item.action === 'delete') {
          await supabase
            .from(item.resourceType + 's')
            .delete()
            .eq('id', item.resourceId);
        }

        // Mark as synced
        useNotesStore.setState((state) => ({
          syncQueue: state.syncQueue.filter(q => q.id !== item.id)
        }));
      } catch (error) {
        console.error(`Sync failed for ${item.id}:`, error);
        // Keep in queue for retry
      }
    }
  }, [supabase, syncQueue]);

  // Listen for online/offline events
  useEffect(() => {
    window.addEventListener('online', syncPending);
    window.addEventListener('offline', () => {
      console.log('App is now offline');
    });

    return () => {
      window.removeEventListener('online', syncPending);
      window.removeEventListener('offline', () => {});
    };
  }, [syncPending]);

  return { syncPending, isPending: syncQueue.length > 0 };
}
```

### Encryption Hook: useEncryption.ts

```typescript
// src/hooks/useEncryption.ts
import nacl from 'tweetnacl';
import utils from 'tweetnacl-util';
import { useCallback, useEffect, useState } from 'react';

export function useEncryption(password: string) {
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [salt, setSalt] = useState<string>('');

  // Derive key from password using Argon2 (or Scrypt)
  const deriveKey = useCallback(async (pwd: string, saltValue?: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    
    // Simple PBKDF2 for demo (use Argon2 in production)
    const key = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, [
      'deriveBits'
    ]);
    
    const salt_ = saltValue || 
      utils.encodeBase64(nacl.randomBytes(16));
    
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: utils.decodeBase64(salt_), iterations: 100000, hash: 'SHA-256' },
      key,
      256
    );
    
    setSalt(salt_);
    setEncryptionKey(new Uint8Array(bits));
  }, []);

  const encrypt = useCallback((plaintext: string): {
    ciphertext: string;
    nonce: string;
  } => {
    if (!encryptionKey) throw new Error('Encryption key not initialized');

    const nonce = nacl.randomBytes(24);
    const box = nacl.secretbox(
      utils.decodeUTF8(plaintext),
      nonce,
      encryptionKey
    );

    return {
      ciphertext: utils.encodeBase64(box),
      nonce: utils.encodeBase64(nonce)
    };
  }, [encryptionKey]);

  const decrypt = useCallback((ciphertext: string, nonce: string): string => {
    if (!encryptionKey) throw new Error('Encryption key not initialized');

    const decrypted = nacl.secretbox.open(
      utils.decodeBase64(ciphertext),
      utils.decodeBase64(nonce),
      encryptionKey
    );

    if (!decrypted) throw new Error('Decryption failed');
    return utils.encodeUTF8(decrypted);
  }, [encryptionKey]);

  return {
    deriveKey,
    encrypt,
    decrypt,
    encryptionKey,
    salt,
    isInitialized: encryptionKey !== null
  };
}
```

### Zustand Store: notesStore.ts

```typescript
// src/store/notesStore.ts
import create from 'zustand';
import { Note, SyncQueueItem } from '../types';

interface NotesStoreState {
  notes: Note[];
  selectedNoteId: string | null;
  syncQueue: SyncQueueItem[];
  // Setters
  setNotes: (notes: Note[]) => void;
  setSelectedNoteId: (id: string | null) => void;
  addToSyncQueue: (item: Omit<SyncQueueItem, 'id' | 'createdAt'>) => void;
  clearSyncQueue: (ids: string[]) => void;
  addNote: (note: Note) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
}

const useNotesStore = create<NotesStoreState>((set) => ({
  notes: [],
  selectedNoteId: null,
  syncQueue: [],
  
  setNotes: (notes) => set({ notes }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  
  addToSyncQueue: (item) => set((state) => ({
    syncQueue: [
      ...state.syncQueue,
      {
        id: crypto.randomUUID(),
        ...item,
        createdAt: new Date()
      }
    ]
  })),
  
  clearSyncQueue: (ids) => set((state) => ({
    syncQueue: state.syncQueue.filter(q => !ids.includes(q.id))
  })),
  
  addNote: (note) => set((state) => ({
    notes: [note, ...state.notes]
  })),
  
  removeNote: (id) => set((state) => ({
    notes: state.notes.filter(n => n.id !== id)
  })),
  
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
  }))
}));

export default useNotesStore;
```

---

## PART 3: KEY COMPONENTS

### NoteEditor.tsx (Rich Text Editor)

```typescript
// src/components/notes/NoteEditor.tsx
import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import MDEditor from '@uiw/react-md-editor';
import { useNotes } from '../../hooks/useNotes';

interface NoteEditorProps {
  noteId: string;
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [debouncedContent] = useDebounce(content, 1000);
  const { updateNote } = useNotes();

  useEffect(() => {
    // Auto-save on debounced change
    if (debouncedContent !== content) {
      const wordCount = content.split(/\s+/).length;
      updateNote({
        id: noteId,
        updates: {
          content,
          title: title || 'Untitled',
          word_count: wordCount,
          char_count: content.length
        }
      });
    }
  }, [debouncedContent, noteId, updateNote, content, title]);

  return (
    <div className="flex-1 flex flex-col gap-4 p-6">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a title..."
        className="text-3xl font-bold outline-none bg-transparent"
      />
      
      <MDEditor
        value={content}
        onChange={(val) => setContent(val || '')}
        preview="live"
        hideToolbar={false}
        height={400}
        visibleDragbar={false}
      />
      
      <div className="text-sm text-gray-500">
        {content.split(/\s+/).length} words • {content.length} characters
      </div>
    </div>
  );
}
```

### PluginContainer.tsx (Sandboxed Plugin)

```typescript
// src/components/plugins/PluginContainer.tsx
import React, { useEffect, useRef } from 'react';

interface PluginContainerProps {
  pluginUrl: string;
  pluginId: string;
  onMessage: (message: any) => void;
}

export function PluginContainer({ pluginUrl, pluginId, onMessage }: PluginContainerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(pluginUrl).origin) return;
      
      console.log(`Plugin ${pluginId} sent:`, event.data);
      onMessage(event.data);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pluginId, pluginUrl, onMessage]);

  const sendMessage = (data: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(data, new URL(pluginUrl).origin);
    }
  };

  return (
    <iframe
      ref={iframeRef}
      src={pluginUrl}
      sandbox={{
        allowScripts: true,
        allowSameOrigin: false,
        allowPopups: false,
        allowTopNavigation: false
      }}
      className="w-full h-96 border rounded-lg"
      title={`Plugin: ${pluginId}`}
    />
  );
}
```

---

## PART 4: CHROME EXTENSION SPECIFIC

### manifest.json (Complete)

```json
{
  "manifest_version": 3,
  "name": "Notewise",
  "version": "0.1.0",
  "description": "Apple-inspired minimalist note-taking in your browser",
  
  "permissions": [
    "storage",
    "alarms",
    "notifications",
    "activeTab",
    "scripting"
  ],
  
  "host_permissions": [
    "https://*.supabase.co/*"
  ],
  
  "action": {
    "default_popup": "index.html",
    "default_title": "Open Notewise"
  },
  
  "background": {
    "service_worker": "background.js"
  },
  
  "chrome_url_overrides": {
    "newtab": "index.html"
  },
  
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; frame-src 'self' https://;"
  },
  
  "icons": {
    "16": "images/icon-16.png",
    "48": "images/icon-48.png",
    "128": "images/icon-128.png"
  }
}
```

### background.js (Service Worker)

```javascript
// public/background.js
// Handle alarms for reminders
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('reminder_')) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon-128.png',
      title: 'Reminder',
      message: 'You have a note to review',
      buttons: [{ title: 'View' }, { title: 'Snooze' }]
    });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-quick-capture') {
    chrome.action.openPopup();
  }
});
```

---

## PART 5: TESTING EXAMPLES

### Unit Test: Encryption

```typescript
// src/__tests__/encryption.test.ts
import { renderHook, act } from '@testing-library/react';
import { useEncryption } from '../hooks/useEncryption';

describe('useEncryption', () => {
  it('should encrypt and decrypt text correctly', async () => {
    const { result } = renderHook(() => useEncryption('password123'));

    await act(async () => {
      await result.current.deriveKey('password123');
    });

    const plaintext = 'This is a secret note';
    const { ciphertext, nonce } = result.current.encrypt(plaintext);
    const decrypted = result.current.decrypt(ciphertext, nonce);

    expect(decrypted).toBe(plaintext);
  });

  it('should fail to decrypt with wrong key', async () => {
    const { result: result1 } = renderHook(() => useEncryption('password123'));
    const { result: result2 } = renderHook(() => useEncryption('wrongpassword'));

    await act(async () => {
      await result1.current.deriveKey('password123');
    });

    const { ciphertext, nonce } = result1.current.encrypt('secret');

    await act(async () => {
      await result2.current.deriveKey('wrongpassword');
    });

    expect(() => {
      result2.current.decrypt(ciphertext, nonce);
    }).toThrow('Decryption failed');
  });
});
```

### E2E Test: Create Note Flow

```typescript
// cypress/e2e/create-note.cy.ts
describe('Create Note Flow', () => {
  beforeEach(() => {
    cy.visit('chrome-extension://extension-id/index.html');
    cy.login('test@example.com', 'password123');
  });

  it('should create and save a note offline, then sync online', () => {
    // Go offline
    cy.intercept('POST', '**/rest/v1/notes', { forceNetworkError: true });

    // Create note
    cy.contains('+ New Note').click();
    cy.get('[data-testid="note-title"]').type('Offline Note');
    cy.get('[data-testid="note-content"]').type('This is created offline');

    // Verify offline indicator
    cy.contains('Offline - will sync when online').should('be.visible');

    // Go back online
    cy.intercept('POST', '**/rest/v1/notes', { statusCode: 201, body: { id: 'uuid' } });
    cy.reload();

    // Verify sync
    cy.contains('Synced').should('be.visible');
  });
});
```

---

## PART 6: DEPLOYMENT CHECKLIST

### Pre-Launch
- [ ] All tests passing (>80% coverage)
- [ ] Performance audit: <1.5s load time
- [ ] Security audit: OWASP Top 10 check
- [ ] Accessibility audit: WCAG 2.1 Level AA
- [ ] Encryption key derivation tested with multiple password strengths
- [ ] Offline sync tested in various network conditions
- [ ] Cross-browser testing (Chrome, Edge, Brave)

### Chrome Web Store
- [ ] Screenshot gallery (1280x800px)
- [ ] Icon (128x128px) + banner
- [ ] Privacy policy URL
- [ ] Declare permissions justification
- [ ] Update manifest version

### Post-Launch Monitoring
- [ ] Sentry for error tracking
- [ ] Vercel Analytics for performance
- [ ] Google Analytics 4 for user behavior
- [ ] Weekly data backups
- [ ] Database query optimization

---

## PART 7: QUICK START COMMANDS

```bash
# Setup
git clone <repo>
cd notewise
npm install
cp .env.example .env.local

# Development
npm run dev:frontend
npm run dev:extension

# Testing
npm run test
npm run test:e2e

# Build for production
npm run build:all

# Deploy to Chrome Web Store
npm run deploy:extension

# Deploy backend (Supabase)
# Done automatically via edge functions
```

---

End of Implementation Guide. Ready to execute.
