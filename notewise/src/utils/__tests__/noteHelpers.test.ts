import {
  createEmptyNote,
  computeNoteStats,
  toSnakeCaseNote,
  formatRelativeDate,
  truncate,
} from '../noteHelpers';

describe('noteHelpers', () => {
  describe('createEmptyNote', () => {
    it('should create a note with correct defaults', () => {
      const note = createEmptyNote('user-1');
      expect(note.userId).toBe('user-1');
      expect(note.title).toBe('Untitled');
      expect(note.content).toBe('');
      expect(note.wordCount).toBe(0);
      expect(note.charCount).toBe(0);
      expect(note.readingTimeMinutes).toBe(0);
      expect(note.isArchived).toBe(false);
      expect(note.isSoftDeleted).toBe(false);
      expect(note.deletedAt).toBeNull();
      expect(note.collectionId).toBeNull();
      expect(note.id).toBeDefined();
      expect(note.createdAt).toBeDefined();
      expect(note.updatedAt).toBeDefined();
      expect(note.syncedAt).toBeDefined();
    });

    it('should accept a collectionId', () => {
      const note = createEmptyNote('user-1', 'col-42');
      expect(note.collectionId).toBe('col-42');
    });

    it('should generate unique ids', () => {
      const note1 = createEmptyNote('user-1');
      const note2 = createEmptyNote('user-1');
      expect(note1.id).not.toBe(note2.id);
    });
  });

  describe('computeNoteStats', () => {
    it('should return zeros for empty content', () => {
      const stats = computeNoteStats('');
      expect(stats.wordCount).toBe(0);
      expect(stats.charCount).toBe(0);
      expect(stats.readingTimeMinutes).toBe(1); // minimum 1
    });

    it('should count words and chars', () => {
      const stats = computeNoteStats('Hello world foo bar');
      expect(stats.wordCount).toBe(4);
      expect(stats.charCount).toBe(19);
    });

    it('should strip markdown formatting', () => {
      const stats = computeNoteStats('# Hello **world**');
      // after stripping # and **, we get "Hello world"
      expect(stats.wordCount).toBe(2);
    });

    it('should compute reading time (200 wpm, minimum 1)', () => {
      // 600 words ~ 3 minutes
      const longText = Array(600).fill('word').join(' ');
      const stats = computeNoteStats(longText);
      expect(stats.readingTimeMinutes).toBe(3);
    });

    it('should return minimum reading time of 1 for short text', () => {
      const stats = computeNoteStats('short');
      expect(stats.readingTimeMinutes).toBe(1);
    });
  });

  describe('toSnakeCaseNote', () => {
    it('should map all camelCase fields to snake_case', () => {
      const note = createEmptyNote('user-1', 'col-1');
      const result = toSnakeCaseNote(note);
      expect(result.user_id).toBe('user-1');
      expect(result.collection_id).toBe('col-1');
      expect(result.word_count).toBe(0);
      expect(result.char_count).toBe(0);
      expect(result.reading_time_minutes).toBe(0);
      expect(result.is_archived).toBe(false);
      expect(result.is_soft_deleted).toBe(false);
      expect(result.deleted_at).toBeNull();
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
      expect(result.synced_at).toBeDefined();
    });
  });

  describe('formatRelativeDate', () => {
    it('should return "Just now" for recent dates', () => {
      const now = new Date();
      expect(formatRelativeDate(now.toISOString())).toBe('Just now');
    });

    it('should return minutes ago', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeDate(fiveMinAgo.toISOString())).toBe('5m ago');
    });

    it('should return hours ago', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(formatRelativeDate(threeHoursAgo.toISOString())).toBe('3h ago');
    });

    it('should return days ago for recent days', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(twoDaysAgo.toISOString())).toBe('2d ago');
    });

    it('should return formatted date for older dates', () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = formatRelativeDate(oldDate.toISOString());
      // Should be a formatted date string like "May 5" or "May 5, 2025"
      expect(result).toBeDefined();
      expect(result).not.toContain('ago');
    });
  });

  describe('truncate', () => {
    it('should return text as-is if shorter than maxLength', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should return text as-is if exactly maxLength', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should truncate text longer than maxLength', () => {
      expect(truncate('Hello World', 5)).toBe('Hello…');
    });

    it('should trim trailing whitespace before adding ellipsis', () => {
      expect(truncate('Hello World', 6)).toBe('Hello…');
    });
  });
});
