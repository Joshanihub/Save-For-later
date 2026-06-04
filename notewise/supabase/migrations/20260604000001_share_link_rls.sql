-- Drop existing restrictive policies
DROP POLICY IF EXISTS "users_can_read_own_share_links" ON share_links;
DROP POLICY IF EXISTS "anyone_can_read_share_links" ON share_links;

-- Create public read policy for share links
CREATE POLICY "anyone_can_read_share_links" ON share_links
  FOR SELECT USING (true);

-- Drop existing restrictive notes policy
DROP POLICY IF EXISTS "users_can_read_own_notes" ON notes;

-- Create policy that allows users to read their own notes, OR anyone to read notes that have a share link
CREATE POLICY "users_can_read_own_notes" ON notes
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM share_links WHERE share_links.note_id = id)
  );
