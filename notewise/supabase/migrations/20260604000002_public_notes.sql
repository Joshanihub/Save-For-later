-- Add columns for public publishing
ALTER TABLE notes 
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN public_slug TEXT UNIQUE;

-- Policy to allow anyone to view public notes
CREATE POLICY "Public notes are viewable by everyone." 
ON notes 
FOR SELECT 
USING (is_public = true);
