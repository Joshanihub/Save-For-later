import useCollectionsStore from '../collectionsStore';
import type { Collection } from '../../types';

const makeCollection = (overrides: Partial<Collection> = {}): Collection => ({
  id: 'col-1',
  userId: 'user-1',
  name: 'Test Collection',
  description: null,
  color: '#FF0000',
  iconEmoji: '📁',
  parentCollectionId: null,
  isArchived: false,
  position: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('collectionsStore', () => {
  beforeEach(() => {
    useCollectionsStore.setState({
      collections: [],
      selectedCollectionId: null,
    });
  });

  it('should start with empty collections', () => {
    expect(useCollectionsStore.getState().collections).toEqual([]);
    expect(useCollectionsStore.getState().selectedCollectionId).toBeNull();
  });

  it('should set collections', () => {
    const cols = [makeCollection(), makeCollection({ id: 'col-2', name: 'Second' })];
    useCollectionsStore.getState().setCollections(cols);
    expect(useCollectionsStore.getState().collections).toHaveLength(2);
  });

  it('should add a collection', () => {
    useCollectionsStore.getState().addCollection(makeCollection());
    expect(useCollectionsStore.getState().collections).toHaveLength(1);
    expect(useCollectionsStore.getState().collections[0].name).toBe('Test Collection');
  });

  it('should update a collection', () => {
    useCollectionsStore.getState().addCollection(makeCollection());
    useCollectionsStore.getState().updateCollection('col-1', { name: 'Updated' });
    expect(useCollectionsStore.getState().collections[0].name).toBe('Updated');
    // updatedAt should be refreshed
    expect(useCollectionsStore.getState().collections[0].updatedAt).not.toBe('2026-01-01T00:00:00Z');
  });

  it('should not update a non-existent collection', () => {
    useCollectionsStore.getState().addCollection(makeCollection());
    useCollectionsStore.getState().updateCollection('non-existent', { name: 'Nope' });
    expect(useCollectionsStore.getState().collections[0].name).toBe('Test Collection');
  });

  it('should remove a collection', () => {
    useCollectionsStore.getState().addCollection(makeCollection());
    useCollectionsStore.getState().removeCollection('col-1');
    expect(useCollectionsStore.getState().collections).toHaveLength(0);
  });

  it('should clear selectedCollectionId when removing the selected collection', () => {
    useCollectionsStore.getState().addCollection(makeCollection());
    useCollectionsStore.getState().setSelectedCollectionId('col-1');
    useCollectionsStore.getState().removeCollection('col-1');
    expect(useCollectionsStore.getState().selectedCollectionId).toBeNull();
  });

  it('should preserve selectedCollectionId when removing a different collection', () => {
    useCollectionsStore.getState().addCollection(makeCollection());
    useCollectionsStore.getState().addCollection(makeCollection({ id: 'col-2' }));
    useCollectionsStore.getState().setSelectedCollectionId('col-1');
    useCollectionsStore.getState().removeCollection('col-2');
    expect(useCollectionsStore.getState().selectedCollectionId).toBe('col-1');
  });

  it('should set selected collection id', () => {
    useCollectionsStore.getState().setSelectedCollectionId('col-99');
    expect(useCollectionsStore.getState().selectedCollectionId).toBe('col-99');
  });
});
