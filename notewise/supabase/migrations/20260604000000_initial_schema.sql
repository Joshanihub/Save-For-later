-- ============================================================
-- Notewise Database Schema — Run in Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Collections ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_parent ON collections(parent_collection_id);

-- ─── Notes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_collection_id ON notes(collection_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON notes(is_archived);
CREATE INDEX IF NOT EXISTS idx_notes_full_text ON notes USING GIN(to_tsvector('english', content));

-- ─── Tags ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- ─── Note-Tag Junction ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_tags (
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY(note_id, tag_id)
);

-- ─── Tasks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_tasks_note_id ON tasks(note_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- ─── Reminders ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  next_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_snoozed BOOLEAN DEFAULT FALSE,
  snooze_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_next_due_at ON reminders(next_due_at);

-- ─── Pomodoro Sessions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER DEFAULT 25,
  breaks_taken INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_completed_at ON pomodoro_sessions(completed_at DESC);

-- ─── Reading List ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reading_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_reading_list_user_id ON reading_list(user_id);

-- ─── Share Links ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_share_links_access_token ON share_links(access_token);
CREATE INDEX IF NOT EXISTS idx_share_links_creator ON share_links(creator_user_id);

-- ─── Comments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_note_id ON comments(note_id);

-- ─── User Preferences ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
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

-- ─── Sync Queue ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced_at ON sync_queue(synced_at);

-- ─── User Streaks ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Row-Level Security (RLS)
-- ============================================================

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- ─── Notes RLS ────────────────────────────────────────────────
CREATE POLICY "users_can_read_own_notes" ON notes
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM share_links WHERE share_links.note_id = notes.id)
  );
CREATE POLICY "users_can_create_notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_can_delete_own_notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Collections RLS ─────────────────────────────────────────
CREATE POLICY "users_can_read_own_collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_create_collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_can_delete_own_collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Tags RLS ─────────────────────────────────────────────────
CREATE POLICY "users_can_read_own_tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_create_tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_can_delete_own_tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Note Tags RLS ───────────────────────────────────────────
CREATE POLICY "users_can_read_own_note_tags" ON note_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
  );
CREATE POLICY "users_can_create_note_tags" ON note_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
  );
CREATE POLICY "users_can_delete_note_tags" ON note_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
  );

-- ─── Tasks RLS ────────────────────────────────────────────────
CREATE POLICY "users_can_read_own_tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_create_tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_can_delete_own_tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Reminders RLS ───────────────────────────────────────────
CREATE POLICY "users_can_read_own_reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_create_reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_can_delete_own_reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Pomodoro Sessions RLS ───────────────────────────────────
CREATE POLICY "users_can_read_own_pomodoro" ON pomodoro_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_create_pomodoro" ON pomodoro_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Reading List RLS ────────────────────────────────────────
CREATE POLICY "users_can_read_own_reading_list" ON reading_list
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_create_reading_list" ON reading_list
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_reading_list" ON reading_list
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_can_delete_own_reading_list" ON reading_list
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Share Links RLS ─────────────────────────────────────────
CREATE POLICY "anyone_can_read_share_links" ON share_links
  FOR SELECT USING (true);
CREATE POLICY "users_can_create_share_links" ON share_links
  FOR INSERT WITH CHECK (auth.uid() = creator_user_id);
CREATE POLICY "users_can_delete_own_share_links" ON share_links
  FOR DELETE USING (auth.uid() = creator_user_id);

-- ─── Comments RLS ────────────────────────────────────────────
CREATE POLICY "users_can_read_note_comments" ON comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM notes WHERE notes.id = comments.note_id AND notes.user_id = auth.uid())
  );
CREATE POLICY "users_can_create_comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_user_id);
CREATE POLICY "users_can_update_own_comments" ON comments
  FOR UPDATE USING (auth.uid() = author_user_id);
CREATE POLICY "users_can_delete_own_comments" ON comments
  FOR DELETE USING (auth.uid() = author_user_id);

-- ─── User Preferences RLS ───────────────────────────────────
CREATE POLICY "users_can_read_own_preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_upsert_preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── Sync Queue RLS ──────────────────────────────────────────
CREATE POLICY "users_can_read_own_sync_queue" ON sync_queue
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_create_sync_queue" ON sync_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_sync_queue" ON sync_queue
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_can_delete_own_sync_queue" ON sync_queue
  FOR DELETE USING (auth.uid() = user_id);

-- ─── User Streaks RLS ───────────────────────────────────────
CREATE POLICY "users_can_read_own_streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_upsert_streaks" ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_streaks" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);
