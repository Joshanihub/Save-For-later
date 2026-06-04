import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, X, Sparkles, Loader2, User, Minimize2, Maximize2 } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  relatedNoteIds?: string[];
}

interface AIChatPanelProps {
  onSelectNote?: (id: string) => void;
}

/**
 * Search the user's local notes for relevance to a query.
 * Returns the most relevant note snippets.
 */
function searchNotes(
  query: string,
  notes: { id: string; title: string; content: string }[],
  maxResults: number = 5
): { noteId: string; title: string; snippet: string; score: number }[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (queryTerms.length === 0) return [];

  const scored = notes.map(note => {
    const text = `${note.title} ${note.content}`.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      const regex = new RegExp(term, 'gi');
      const matches = text.match(regex);
      if (matches) score += matches.length;
      // Bonus for title matches
      if (note.title.toLowerCase().includes(term)) score += 3;
    }
    // Extract a relevant snippet around the first match
    let snippet = note.content.slice(0, 200);
    for (const term of queryTerms) {
      const idx = note.content.toLowerCase().indexOf(term);
      if (idx > -1) {
        const start = Math.max(0, idx - 60);
        const end = Math.min(note.content.length, idx + 140);
        snippet = (start > 0 ? '...' : '') + note.content.slice(start, end) + (end < note.content.length ? '...' : '');
        break;
      }
    }
    return { noteId: note.id, title: note.title, snippet, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Generate a local AI-like response based on search results.
 * This is a client-side implementation that doesn't require an external API.
 */
function generateLocalResponse(query: string, results: ReturnType<typeof searchNotes>): string {
  if (results.length === 0) {
    return "I couldn't find any notes related to your query. Try different keywords or create a new note about this topic!";
  }

  const topResult = results[0];
  let response = `I found **${results.length} note${results.length > 1 ? 's' : ''}** related to "${query}":\n\n`;

  for (const result of results) {
    response += `### 📝 ${result.title}\n`;
    response += `> ${result.snippet.replace(/\n/g, ' ').trim()}\n\n`;
  }

  if (results.length === 1) {
    response += `\nYour note **"${topResult.title}"** seems to be the most relevant. Click on it to view the full content.`;
  } else {
    response += `\nThe most relevant note is **"${topResult.title}"** with ${topResult.score} keyword matches.`;
  }

  return response;
}

export function AIChatPanel({ onSelectNote }: AIChatPanelProps) {
  const { notes } = useNotes();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your Notewise AI assistant. Ask me anything about your notes — I'll search through them locally to find what you need. 🔍\n\nTry asking:\n- *\"What did I write about marketing?\"*\n- *\"Find my meeting notes\"*\n- *\"Show notes about React\"*",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Simulate a small delay
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800));

    const activeNotes = notes.filter(n => !n.isSoftDeleted && !n.isArchived);
    const results = searchNotes(trimmed, activeNotes);
    const responseContent = generateLocalResponse(trimmed, results);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      relatedNoteIds: results.map(r => r.noteId),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsThinking(false);
  }, [input, notes]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
        title="Ask AI about your notes"
        id="ai-chat-toggle"
      >
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 bg-surface-0 border border-edge shadow-xl flex flex-col transition-all ${
        isMinimized
          ? 'bottom-6 right-6 w-72 h-14 rounded-2xl'
          : 'bottom-6 right-6 w-96 h-[32rem] rounded-2xl'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-gradient-to-r from-brand-500/10 to-purple-500/10 rounded-t-2xl shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-txt-primary">AI Assistant</h3>
            {!isMinimized && (
              <p className="text-2xs text-txt-tertiary">Searches your notes locally</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="btn-icon"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="btn-icon">
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-brand-500/10 text-brand-600'
                    : 'bg-gradient-to-br from-brand-500 to-purple-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                  className={`max-w-[80%] text-sm leading-relaxed rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white rounded-br-sm'
                      : 'bg-surface-1 text-txt-primary border border-edge rounded-bl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>')
                      .replace(/### (.+)/g, '<div class="font-semibold mt-2 mb-1">$1</div>')
                      .replace(/> (.+)/g, '<div class="border-l-2 border-brand-300 pl-2 text-txt-secondary text-xs my-1">$1</div>')
                      .replace(/\n/g, '<br/>')
                  }} />
                  {msg.relatedNoteIds && msg.relatedNoteIds.length > 0 && onSelectNote && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-edge/50">
                      {msg.relatedNoteIds.slice(0, 3).map((id) => {
                        const note = notes.find(n => n.id === id);
                        return note ? (
                          <button
                            key={id}
                            onClick={() => onSelectNote(id)}
                            className="text-2xs bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 px-2 py-0.5 rounded transition-colors"
                          >
                            Open: {note.title}
                          </button>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-surface-1 border border-edge rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-brand-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-edge shrink-0">
            <div className="flex items-center gap-2 bg-surface-1 border border-edge rounded-xl px-3 focus-within:border-brand-500 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about your notes..."
                className="flex-1 bg-transparent border-none outline-none text-sm py-2.5 text-txt-primary placeholder:text-txt-tertiary"
                disabled={isThinking}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
