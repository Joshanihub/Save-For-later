import { useState, useRef } from 'react';
import { Upload, FileText, FileArchive, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseZipOfMarkdown, parseMarkdownFile, parseNotionHtml, importedNotesToNotes } from '../../utils/importParsers';
import { toSnakeCaseNote } from '../../utils/noteHelpers';
import { useAuth } from '../auth/AuthProvider';
import useNotesStore from '../../store/notesStore';
import useToastStore from '../../store/toastStore';

type ImportStatus = 'idle' | 'processing' | 'success' | 'error';

interface ImportResult {
  count: number;
  errors: string[];
}

export function ImportSection() {
  const { session } = useAuth();
  const { addNote, addToSyncQueue } = useNotesStore();
  const showToast = useToastStore((state) => state.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !session) return;

    setStatus('processing');
    setResult(null);
    const errors: string[] = [];
    let totalImported = 0;

    try {
      for (const file of Array.from(files)) {
        try {
          const ext = file.name.toLowerCase();

          if (ext.endsWith('.zip')) {
            const buffer = await file.arrayBuffer();
            const imported = await parseZipOfMarkdown(buffer);
            const notes = importedNotesToNotes(imported, session.user.id);
            for (const note of notes) {
              addNote(note);
              addToSyncQueue({
                action: 'create',
                resourceType: 'note',
                payload: toSnakeCaseNote(note),
              });
            }
            totalImported += notes.length;
          } else if (ext.endsWith('.md') || ext.endsWith('.markdown')) {
            const text = await file.text();
            const imported = parseMarkdownFile(file.name, text);
            const notes = importedNotesToNotes([imported], session.user.id);
            for (const note of notes) {
              addNote(note);
              addToSyncQueue({
                action: 'create',
                resourceType: 'note',
                payload: toSnakeCaseNote(note),
              });
            }
            totalImported += 1;
          } else if (ext.endsWith('.html') || ext.endsWith('.htm')) {
            const html = await file.text();
            const imported = parseNotionHtml(file.name, html);
            const notes = importedNotesToNotes([imported], session.user.id);
            for (const note of notes) {
              addNote(note);
              addToSyncQueue({
                action: 'create',
                resourceType: 'note',
                payload: toSnakeCaseNote(note),
              });
            }
            totalImported += 1;
          } else {
            errors.push(`Skipped unsupported file: ${file.name}`);
          }
        } catch (err) {
          errors.push(`Failed to import ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      setResult({ count: totalImported, errors });
      setStatus(errors.length > 0 && totalImported === 0 ? 'error' : 'success');

      if (totalImported > 0) {
        showToast(`Successfully imported ${totalImported} note${totalImported > 1 ? 's' : ''}!`, 'success');
      }
    } catch (err) {
      setStatus('error');
      setResult({
        count: 0,
        errors: [`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`],
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-txt-secondary uppercase tracking-wider">Import Data</h3>
      <p className="text-xs text-txt-tertiary">
        Import notes from Obsidian, Notion, or plain Markdown files.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={status === 'processing'}
          className="btn-primary text-sm py-2 px-4"
        >
          {status === 'processing' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Importing…
            </>
          ) : (
            <>
              <Upload size={14} />
              Choose Files
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".md,.markdown,.zip,.html,.htm"
        onChange={handleFileSelect}
      />

      <div className="flex flex-wrap gap-2 text-2xs text-txt-tertiary">
        <span className="flex items-center gap-1 bg-surface-1 px-2 py-1 rounded border border-edge">
          <FileText size={10} /> .md
        </span>
        <span className="flex items-center gap-1 bg-surface-1 px-2 py-1 rounded border border-edge">
          <FileArchive size={10} /> .zip (Obsidian vault)
        </span>
        <span className="flex items-center gap-1 bg-surface-1 px-2 py-1 rounded border border-edge">
          <FileText size={10} /> .html (Notion export)
        </span>
      </div>

      {result && (
        <div className={`text-xs p-3 rounded-lg border ${
          status === 'success'
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-1.5 mb-1 font-medium">
            {status === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {result.count > 0
              ? `Imported ${result.count} note${result.count > 1 ? 's' : ''}`
              : 'Import failed'}
          </div>
          {result.errors.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5 opacity-80">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
