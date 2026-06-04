import React, { useState } from 'react';
import { useComments } from '../../hooks/useComments';
import { MessageSquare, Trash2, Send } from 'lucide-react';
import { formatRelativeDate } from '../../utils/noteHelpers';

interface CommentPaneProps {
  noteId: string;
}

export function CommentPane({ noteId }: CommentPaneProps) {
  const { comments, addComment, isAdding, deleteComment } = useComments(noteId);
  const [content, setContent] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment({ noteId, content: content.trim() });
    setContent('');
  };

  return (
    <div className="flex flex-col h-full bg-surface-1 border-l border-edge w-72 shrink-0 overflow-hidden">
      <div className="p-3 border-b border-edge bg-surface-0 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-txt-tertiary flex items-center gap-2">
          <MessageSquare size={14} /> Comments
        </h3>
        <span className="text-2xs bg-surface-2 px-1.5 rounded-full text-txt-tertiary">
          {comments.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="p-2.5 bg-surface-0 border border-edge rounded-md group relative">
            <p className="text-sm text-txt-primary pr-6 whitespace-pre-wrap">{comment.content}</p>
            <div className="flex items-center gap-1 mt-2 text-2xs text-txt-tertiary">
              <span>{formatRelativeDate(comment.createdAt)}</span>
            </div>
            <button
              onClick={() => deleteComment(comment.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-txt-tertiary hover:text-status-error transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-xs text-txt-tertiary italic text-center mt-4">
            No comments yet.
          </p>
        )}
      </div>

      <div className="p-3 border-t border-edge bg-surface-0">
        <form onSubmit={handleCreate} className="flex flex-col gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            className="input text-sm py-2 px-2.5 w-full resize-none h-20"
            required
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCreate(e);
              }
            }}
          />
          <button type="submit" disabled={!content.trim() || isAdding} className="btn-primary w-full mt-1">
            <Send size={14} /> Comment
          </button>
        </form>
      </div>
    </div>
  );
}
