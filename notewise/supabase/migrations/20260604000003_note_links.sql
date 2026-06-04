-- Bi-directional note links table
CREATE TABLE IF NOT EXISTS note_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_note_id, target_note_id)
);

-- RLS policies
ALTER TABLE note_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own note links."
ON note_links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own note links."
ON note_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own note links."
ON note_links FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_note_links_source ON note_links(source_note_id);
CREATE INDEX idx_note_links_target ON note_links(target_note_id);
