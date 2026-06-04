import useNotesStore from '../notesStore';
import type { Note } from '../../types';

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  userId: 'user-1',
  collectionId: null,
  title: 'Test Note',
  content: 'Hello world',
  wordCount: 2,
  charCount: 11,
  readingTimeMinutes: 1,
  isArchived: false,
  isSoftDeleted: false,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  syncedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('notesStore', () => {
  beforeEach(() => {
    useNotesStore.setState({
      notes: [],
      selectedNoteId: null,
      syncQueue: [],
    });
  });

  describe('Notes CRUD', () => {
    it('should start with empty notes', () => {
      expect(useNotesStore.getState().notes).toEqual([]);
    });

    it('should set notes', () => {
      const notes = [makeNote(), makeNote({ id: 'note-2' })];
      useNotesStore.getState().setNotes(notes);
      expect(useNotesStore.getState().notes).toHaveLength(2);
    });

    it('should add a note (prepend)', () => {
      useNotesStore.getState().addNote(makeNote({ id: 'note-1' }));
      useNotesStore.getState().addNote(makeNote({ id: 'note-2' }));
      expect(useNotesStore.getState().notes[0].id).toBe('note-2');
    });

    it('should update a note', () => {
      useNotesStore.getState().addNote(makeNote());
      useNotesStore.getState().updateNote('note-1', { title: 'Updated Title' });
      expect(useNotesStore.getState().notes[0].title).toBe('Updated Title');
      expect(useNotesStore.getState().notes[0].updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('should not update a non-existent note', () => {
      useNotesStore.getState().addNote(makeNote());
      useNotesStore.getState().updateNote('non-existent', { title: 'Nope' });
      expect(useNotesStore.getState().notes[0].title).toBe('Test Note');
    });

    it('should remove a note', () => {
      useNotesStore.getState().addNote(makeNote());
      useNotesStore.getState().removeNote('note-1');
      expect(useNotesStore.getState().notes).toHaveLength(0);
    });

    it('should clear selectedNoteId when removing the selected note', () => {
      useNotesStore.getState().addNote(makeNote());
      useNotesStore.getState().setSelectedNoteId('note-1');
      useNotesStore.getState().removeNote('note-1');
      expect(useNotesStore.getState().selectedNoteId).toBeNull();
    });

    it('should preserve selectedNoteId when removing a different note', () => {
      useNotesStore.getState().addNote(makeNote({ id: 'note-1' }));
      useNotesStore.getState().addNote(makeNote({ id: 'note-2' }));
      useNotesStore.getState().setSelectedNoteId('note-1');
      useNotesStore.getState().removeNote('note-2');
      expect(useNotesStore.getState().selectedNoteId).toBe('note-1');
    });

    it('should set selectedNoteId', () => {
      useNotesStore.getState().setSelectedNoteId('note-99');
      expect(useNotesStore.getState().selectedNoteId).toBe('note-99');
    });
  });

  describe('Sync Queue', () => {
    it('should add items to sync queue', () => {
      useNotesStore.getState().addToSyncQueue({
        action: 'create',
        resourceType: 'note',
        payload: { title: 'New Note' },
      });
      const queue = useNotesStore.getState().syncQueue;
      expect(queue).toHaveLength(1);
      expect(queue[0].action).toBe('create');
      expect(queue[0].status).toBe('pending');
      expect(queue[0].retryCount).toBe(0);
    });

    it('should update sync item status', () => {
      useNotesStore.getState().addToSyncQueue({
        action: 'create',
        resourceType: 'note',
        payload: {},
      });
      const id = useNotesStore.getState().syncQueue[0].id;

      useNotesStore.getState().updateSyncItemStatus(id, 'synced');
      expect(useNotesStore.getState().syncQueue[0].status).toBe('synced');
    });

    it('should increment retryCount on failure', () => {
      useNotesStore.getState().addToSyncQueue({
        action: 'create',
        resourceType: 'note',
        payload: {},
      });
      const id = useNotesStore.getState().syncQueue[0].id;

      useNotesStore.getState().updateSyncItemStatus(id, 'failed', 'Network error');
      expect(useNotesStore.getState().syncQueue[0].retryCount).toBe(1);
      expect(useNotesStore.getState().syncQueue[0].lastError).toBe('Network error');
    });

    it('should not increment retryCount on non-failure status', () => {
      useNotesStore.getState().addToSyncQueue({
        action: 'create',
        resourceType: 'note',
        payload: {},
      });
      const id = useNotesStore.getState().syncQueue[0].id;

      useNotesStore.getState().updateSyncItemStatus(id, 'syncing');
      expect(useNotesStore.getState().syncQueue[0].retryCount).toBe(0);
    });

    it('should remove sync items by ids', () => {
      useNotesStore.getState().addToSyncQueue({
        action: 'create',
        resourceType: 'note',
        payload: {},
      });
      useNotesStore.getState().addToSyncQueue({
        action: 'update',
        resourceType: 'note',
        payload: {},
      });
      const ids = useNotesStore.getState().syncQueue.map((i) => i.id);

      useNotesStore.getState().removeSyncItems([ids[0]]);
      expect(useNotesStore.getState().syncQueue).toHaveLength(1);
      expect(useNotesStore.getState().syncQueue[0].id).toBe(ids[1]);
    });

    it('should clear synced items only', () => {
      useNotesStore.getState().addToSyncQueue({
        action: 'create',
        resourceType: 'note',
        payload: {},
      });
      useNotesStore.getState().addToSyncQueue({
        action: 'update',
        resourceType: 'note',
        payload: {},
      });
      const id1 = useNotesStore.getState().syncQueue[0].id;
      useNotesStore.getState().updateSyncItemStatus(id1, 'synced');

      useNotesStore.getState().clearSyncedItems();
      expect(useNotesStore.getState().syncQueue).toHaveLength(1);
      expect(useNotesStore.getState().syncQueue[0].status).toBe('pending');
    });

    it('should get pending sync queue count', () => {
      useNotesStore.getState().addToSyncQueue({
        action: 'create',
        resourceType: 'note',
        payload: {},
      });
      useNotesStore.getState().addToSyncQueue({
        action: 'update',
        resourceType: 'note',
        payload: {},
      });
      const id1 = useNotesStore.getState().syncQueue[0].id;
      useNotesStore.getState().updateSyncItemStatus(id1, 'synced');

      expect(useNotesStore.getState().getSyncQueueCount()).toBe(1);
    });
  });
});
