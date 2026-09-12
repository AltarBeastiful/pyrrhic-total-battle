/**
 * Browser plumbing for export and sharing. Everything here is guarded: an export must never throw
 * because a browser lacks the Web Share API or blocks object URLs.
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

export function toJsonFile(file: ExportedFile): File {
  return new File([file.json], file.filename, { type: 'application/json' });
}

export function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

function canShareFiles(file: File): boolean {
  return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
}

export type ShareOutcome = 'shared' | 'cancelled' | 'unavailable';

/**
 * "Send to another device": hand the JSON export to the OS share sheet when it accepts files
 * (AirDrop, Nearby Share, a messaging app), otherwise share the link itself.
 */
export async function sendToDevice(options: {
  title: string;
  text: string;
  url: string;
  file?: ExportedFile;
}): Promise<ShareOutcome> {
  if (!canShare()) return 'unavailable';
  const file = options.file === undefined ? null : toJsonFile(options.file);
  try {
    if (file && canShareFiles(file)) {
      await navigator.share({ title: options.title, text: options.text, files: [file] });
    } else {
      await navigator.share({ title: options.title, text: options.text, url: options.url });
    }
    return 'shared';
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
    return 'unavailable';
  }
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
