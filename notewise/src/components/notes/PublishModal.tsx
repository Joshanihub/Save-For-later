import { useState, useEffect } from 'react';
import { useNotes } from '../../hooks/useNotes';
import useToastStore from '../../store/toastStore';
import { Globe, Copy, X, ExternalLink, RefreshCw } from 'lucide-react';

interface PublishModalProps {
  noteId: string;
  onClose: () => void;
}

function generateRandomSlug() {
  return Math.random().toString(36).substring(2, 10);
}

export function PublishModal({ noteId, onClose }: PublishModalProps) {
  const { notes, updateNote, isUpdating } = useNotes();
  const showToast = useToastStore((state) => state.showToast);
  
  const note = notes.find((n) => n.id === noteId);
  
  const [isPublic, setIsPublic] = useState(note?.isPublic ?? false);
  const [slug, setSlug] = useState(note?.publicSlug ?? '');

  useEffect(() => {
    if (note) {
      setIsPublic(note.isPublic ?? false);
      setSlug(note.publicSlug ?? '');
    }
  }, [note]);

  const handleTogglePublic = () => {
    const newIsPublic = !isPublic;
    setIsPublic(newIsPublic);
    
    let newSlug = slug;
    if (newIsPublic && !slug) {
      newSlug = generateRandomSlug();
      setSlug(newSlug);
    }
    
    updateNote({
      id: noteId,
      updates: {
        isPublic: newIsPublic,
        publicSlug: newIsPublic ? newSlug : null
      }
    });
  };

  const handleUpdateSlug = () => {
    if (!slug.trim()) {
      showToast('Slug cannot be empty', 'error');
      return;
    }
    updateNote({
      id: noteId,
      updates: { publicSlug: slug.trim() }
    });
    showToast('Public link updated', 'success');
  };

  const getPublicUrl = () => {
    return `${window.location.origin}/p/${slug}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getPublicUrl());
      showToast('Public link copied!', 'success');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (!note) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-surface-0 w-full max-w-md rounded-xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between bg-surface-1">
          <h2 className="text-lg font-display font-semibold text-txt-primary flex items-center gap-2">
            <Globe size={18} className="text-brand-500" /> Publish to Web
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-txt-primary">Enable Public Access</h3>
              <p className="text-xs text-txt-tertiary">Allow anyone with the link to view this note.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isPublic}
                onChange={handleTogglePublic}
                disabled={isUpdating}
              />
              <div className="w-11 h-6 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>

          {isPublic && (
            <div className="space-y-4 pt-4 border-t border-edge animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs font-medium text-txt-primary">Custom Slug</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-surface-1 border border-edge rounded-lg px-3 overflow-hidden focus-within:border-brand-500">
                    <span className="text-txt-tertiary text-sm select-none shrink-0">notewise.app/p/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                      className="bg-transparent border-none outline-none text-sm text-txt-primary w-full py-2 min-w-0"
                      placeholder="my-awesome-note"
                    />
                  </div>
                  <button 
                    onClick={handleUpdateSlug}
                    disabled={isUpdating || slug === note.publicSlug}
                    className="btn-primary px-3"
                    title="Save custom slug"
                  >
                    <RefreshCw size={16} className={isUpdating ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3 flex items-center justify-between gap-3">
                <span className="text-sm font-mono text-brand-600 truncate flex-1 select-all">
                  {getPublicUrl()}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={copyToClipboard} className="btn-icon text-brand-600 hover:bg-brand-500/20">
                    <Copy size={16} />
                  </button>
                  <a href={getPublicUrl()} target="_blank" rel="noopener noreferrer" className="btn-icon text-brand-600 hover:bg-brand-500/20">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
