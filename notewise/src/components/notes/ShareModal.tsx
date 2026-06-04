import { useState } from 'react';
import { useShareLinks } from '../../hooks/useShareLinks';
import useToastStore from '../../store/toastStore';
import { Share2, Copy, X, Trash2, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  noteId: string;
  onClose: () => void;
}

export function ShareModal({ noteId, onClose }: ShareModalProps) {
  const { shareLinks, createShareLink, isCreating, deleteShareLink } = useShareLinks(noteId);
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const showToast = useToastStore((state) => state.showToast);

  const handleCreate = () => {
    createShareLink({ noteId, expiresInDays: expiresInDays === '' ? undefined : Number(expiresInDays) });
    setExpiresInDays('');
  };

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/share/${token}`;
  };

  const copyToClipboard = async (token: string) => {
    try {
      await navigator.clipboard.writeText(getShareUrl(token));
      showToast('Link copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-surface-0 w-full max-w-md rounded-xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between bg-surface-1">
          <h2 className="text-lg font-display font-semibold text-txt-primary flex items-center gap-2">
            <Share2 size={18} className="text-brand-500" /> Share Note
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Create new link */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-txt-primary">Create Public Link</h3>
            <div className="flex gap-2">
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value === '' ? '' : Number(e.target.value))}
                className="input flex-1"
              >
                <option value="">Never Expires</option>
                <option value="1">Expires in 1 day</option>
                <option value="7">Expires in 7 days</option>
                <option value="30">Expires in 30 days</option>
              </select>
              <button 
                onClick={handleCreate} 
                disabled={isCreating} 
                className="btn-primary whitespace-nowrap"
              >
                {isCreating ? 'Generating...' : 'Generate Link'}
              </button>
            </div>
            <p className="text-xs text-txt-tertiary">
              Anyone with the link can view this note in read-only mode.
            </p>
          </div>

          {/* Existing links */}
          {shareLinks.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-edge">
              <h3 className="text-sm font-medium text-txt-primary">Active Links</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {shareLinks.map((link) => (
                  <div key={link.id} className="flex items-center gap-2 bg-surface-1 p-2 rounded-md border border-edge">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-txt-secondary truncate select-all">
                        {getShareUrl(link.accessToken)}
                      </div>
                      <div className="text-2xs text-txt-tertiary mt-0.5">
                        {link.expiresAt ? `Expires: ${new Date(link.expiresAt).toLocaleDateString()}` : 'Never expires'}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(link.accessToken)}
                      className="btn-icon bg-surface-0 hover:text-brand-500"
                      title="Copy link"
                    >
                      <Copy size={14} />
                    </button>
                    <a
                      href={getShareUrl(link.accessToken)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-icon bg-surface-0 hover:text-brand-500"
                      title="Open link"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => deleteShareLink(link.id)}
                      className="btn-icon bg-surface-0 text-status-error hover:bg-red-50 dark:hover:bg-red-950"
                      title="Revoke link"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
