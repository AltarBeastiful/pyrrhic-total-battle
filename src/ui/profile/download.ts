/**
 * Browser plumbing for export and sharing. Both are guarded: an export must never throw because a
 * browser blocks object URLs, and a copy must never throw because the clipboard is unavailable.
 *
 * The Web Share "send to another device" hand-off that used to live here went with the Gist sync it
 * belonged to (ADR-0009): a share link and a JSON file are the two ways out, and neither needs it.
 */
import type { ExportedFile } from '@/share/exportImport';

/** Save a JSON file through an object URL; revoked on the next tick so Safari has time to read it. */
export function downloadJson(file: ExportedFile): void {
  const blob = new Blob([file.json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.filename;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

/** Copy to the clipboard, falling back to the legacy command when the API is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the textarea trick */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
