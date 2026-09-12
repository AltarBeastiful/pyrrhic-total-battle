/** Dates in the sync panel and the conflict dialog: short, local, and the same in both. */
export function formatWhen(at: number | undefined): string {
  if (at === undefined) return '—';
  return new Date(at).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
