import { createEmptyNote } from './noteHelpers';
import type { Note } from '../types';

/**
 * Parsed result from any importer.
 */
export interface ImportedNote {
  title: string;
  content: string;
}

/**
 * Parse frontmatter (YAML-style) from a markdown string.
 * Returns { title, content } with the frontmatter stripped.
 */
function parseFrontmatter(raw: string): { title: string; content: string } {
  const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
  const match = raw.match(fmRegex);
  let title = '';
  let content = raw;

  if (match) {
    const fmBlock = match[1];
    content = raw.slice(match[0].length);
    const titleMatch = fmBlock.match(/^title:\s*(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].replace(/^["']|["']$/g, '').trim();
    }
  }

  // Fallback: use first heading as title
  if (!title) {
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      title = headingMatch[1].trim();
    }
  }

  return { title: title || 'Imported Note', content: content.trim() };
}

/**
 * Parse a single Markdown file string into an ImportedNote.
 */
export function parseMarkdownFile(filename: string, raw: string): ImportedNote {
  const { title, content } = parseFrontmatter(raw);
  const fallbackTitle = filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
  return {
    title: title || fallbackTitle,
    content,
  };
}

/**
 * Read a ZIP file (as ArrayBuffer) containing .md files.
 * Uses the browser's DecompressionStream API for each file entry
 * — but since ZIP is complex, we use a minimal unzip approach.
 *
 * For simplicity, we parse the ZIP manually for stored/deflated entries.
 */
export async function parseZipOfMarkdown(zipBuffer: ArrayBuffer): Promise<ImportedNote[]> {
  const notes: ImportedNote[] = [];
  const view = new DataView(zipBuffer);
  let offset = 0;

  while (offset < zipBuffer.byteLength - 4) {
    const signature = view.getUint32(offset, true);
    if (signature !== 0x04034b50) break; // Not a local file header

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const filenameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);

    const filenameBytes = new Uint8Array(zipBuffer, offset + 30, filenameLen);
    const filename = new TextDecoder().decode(filenameBytes);
    const dataStart = offset + 30 + filenameLen + extraLen;
    const dataBytes = new Uint8Array(zipBuffer, dataStart, compressedSize);

    if (filename.endsWith('.md') && !filename.startsWith('__MACOSX')) {
      let content: string;

      if (compressionMethod === 0) {
        // Stored (no compression)
        content = new TextDecoder('utf-8').decode(dataBytes);
      } else if (compressionMethod === 8) {
        // Deflated — use DecompressionStream
        try {
          const stream = new Blob([dataBytes]).stream().pipeThrough(
            new DecompressionStream('raw')
          );
          const reader = stream.getReader();
          const chunks: Uint8Array[] = [];
          let done = false;
          while (!done) {
            const result = await reader.read();
            if (result.value) chunks.push(result.value);
            done = result.done;
          }
          const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
          const merged = new Uint8Array(totalLen);
          let pos = 0;
          for (const chunk of chunks) {
            merged.set(chunk, pos);
            pos += chunk.length;
          }
          content = new TextDecoder('utf-8').decode(merged);
        } catch {
          // Skip files that fail to decompress
          offset = dataStart + compressedSize;
          continue;
        }
      } else {
        // Unsupported compression — skip
        offset = dataStart + compressedSize;
        continue;
      }

      notes.push(parseMarkdownFile(filename.split('/').pop() || filename, content));
    }

    offset = dataStart + compressedSize;
  }

  return notes;
}

/**
 * Convert Notion HTML export (single file) to markdown-ish content.
 * This is a best-effort plain text extraction.
 */
export function parseNotionHtml(filename: string, html: string): ImportedNote {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract title
  const titleEl = doc.querySelector('h1') || doc.querySelector('title');
  const title = titleEl?.textContent?.trim() || filename.replace(/\.html?$/i, '');

  // Convert body to rough markdown
  const body = doc.body;
  let content = '';

  function walk(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      content += node.textContent || '';
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    switch (tag) {
      case 'h1': content += '\n# '; break;
      case 'h2': content += '\n## '; break;
      case 'h3': content += '\n### '; break;
      case 'p': content += '\n\n'; break;
      case 'li': content += '\n- '; break;
      case 'br': content += '\n'; break;
      case 'strong':
      case 'b': content += '**'; break;
      case 'em':
      case 'i': content += '*'; break;
      case 'code': content += '`'; break;
    }

    for (const child of Array.from(node.childNodes)) {
      walk(child);
    }

    switch (tag) {
      case 'strong':
      case 'b': content += '**'; break;
      case 'em':
      case 'i': content += '*'; break;
      case 'code': content += '`'; break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'p': content += '\n'; break;
    }
  }

  walk(body);

  return {
    title,
    content: content.trim(),
  };
}

/**
 * Convert an array of ImportedNotes into real Note objects ready for the store.
 */
export function importedNotesToNotes(imported: ImportedNote[], userId: string): Note[] {
  return imported.map((imp) => {
    const note = createEmptyNote(userId);
    note.title = imp.title;
    note.content = imp.content;
    return note;
  });
}
