import { useState } from 'react';
import { useReadingList } from '../../hooks/useReadingList';
import useToastStore from '../../store/toastStore';
import { BookOpen, Plus, CheckCircle, Circle, Trash2, ExternalLink } from 'lucide-react';
import { formatRelativeDate } from '../../utils/noteHelpers';

export function ReadingListView() {
  const { readingList, addUrl, isAdding, toggleReadStatus, deleteItem } = useReadingList();
  const [url, setUrl] = useState('');
  const showToast = useToastStore((state) => state.showToast);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      new URL(url); // validate URL
      addUrl(url);
      setUrl('');
    } catch (err) {
      showToast("Please enter a valid URL.", 'error');
    }
  };

  const unreadItems = readingList.filter(i => !i.isRead);
  const readItems = readingList.filter(i => i.isRead);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-0">
      <header className="px-8 py-6 border-b border-edge">
        <h1 className="text-2xl font-display font-bold text-txt-primary flex items-center gap-2 mb-4">
          <BookOpen size={24} className="text-brand-500" />
          Reading List
        </h1>
        
        <form onSubmit={handleAdd} className="flex max-w-2xl gap-2">
          <input
            type="url"
            placeholder="https://example.com/article"
            className="input flex-1"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" disabled={isAdding || !url} className="btn-primary">
            {isAdding ? 'Adding...' : <><Plus size={16} /> Save</>}
          </button>
        </form>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
        <div>
          <h2 className="text-sm font-semibold text-txt-secondary uppercase tracking-wider mb-4">
            Unread ({unreadItems.length})
          </h2>
          <div className="space-y-3 max-w-4xl">
            {unreadItems.map((item) => (
              <div key={item.id} className="card p-4 flex gap-4 group">
                <button
                  onClick={() => toggleReadStatus({ id: item.id, isRead: true })}
                  className="mt-1 text-txt-tertiary hover:text-brand-500 transition-colors"
                >
                  <Circle size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-txt-primary hover:text-brand-500 hover:underline flex items-center gap-2">
                    {item.title || item.url} <ExternalLink size={14} className="text-txt-tertiary" />
                  </a>
                  <p className="text-sm text-txt-tertiary truncate mt-1">{item.url}</p>
                  <div className="text-xs text-txt-tertiary mt-2">
                    Saved {formatRelativeDate(item.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-txt-tertiary hover:text-status-error transition-opacity p-2 self-start"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {unreadItems.length === 0 && (
              <p className="text-txt-tertiary text-sm">No unread items. You're all caught up!</p>
            )}
          </div>
        </div>

        {readItems.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-txt-secondary uppercase tracking-wider mb-4">
              Archive ({readItems.length})
            </h2>
            <div className="space-y-3 max-w-4xl opacity-70">
              {readItems.map((item) => (
                <div key={item.id} className="card p-4 flex gap-4 group bg-surface-1">
                  <button
                    onClick={() => toggleReadStatus({ id: item.id, isRead: false })}
                    className="mt-1 text-brand-500 hover:text-brand-600 transition-colors"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-txt-primary line-through hover:text-brand-500 flex items-center gap-2">
                      {item.title || item.url}
                    </a>
                    <div className="text-xs text-txt-tertiary mt-2">
                      Read {formatRelativeDate(item.readAt || item.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-txt-tertiary hover:text-status-error transition-opacity p-2 self-start"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
