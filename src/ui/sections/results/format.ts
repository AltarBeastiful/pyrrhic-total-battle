/**
 * Number, money and duration formatting for the march sections (Enemy, Housing, Results).
 *
 * Everything the calculator shows is a game figure, so the rules are the game's: whole numbers with
 * thousands separators, ratios with two decimals while they are small, and durations written the way a
 * training queue writes them ("5d 23h").
 */
const NUMBER = new Intl.NumberFormat('en-US');

/** A whole number: unit counts, damage, silver, gold, dragon coins. */
export function amount(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return NUMBER.format(Math.round(value));
}

const COMPACT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });

/**
 * The same figure with the digits a glance needs: "1.67M", "890K". Only for places where the line
 * has to stay short — the app bar's answer — never where a number is read off and typed into the game.
 */
export function compact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return COMPACT.format(Math.round(value));
}

/** A ratio such as damage per silver: two decimals while it is small, whole numbers above 100. */
export function ratio(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  return Math.abs(value) >= 100 ? amount(value) : value.toFixed(2);
}

/** A percentage as entered (5 → "5%", 2.5 → "2.5%"). */
export function percent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${Number.isInteger(value) ? String(value) : value.toFixed(1)}%`;
}

/** "5d 23h", "21h 40m", "12m" — the way the game writes a training queue. */
export function duration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total === 0) return '—';
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  if (days > 0) return `${String(days)}d ${String(hours)}h`;
  if (hours > 0) return `${String(hours)}h ${String(minutes)}m`;
  if (minutes > 0) return `${String(minutes)}m`;
  return `${String(total)}s`;
}

/** A difference against the generated result: "+240", "-1,150", "0". */
export function delta(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value);
  if (rounded === 0) return '0';
  return `${rounded > 0 ? '+' : '-'}${amount(Math.abs(rounded))}`;
}

/** A difference in a ratio metric, same sign rules with two decimals. */
export function deltaRatio(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) < 0.005) return '0';
  return `${value > 0 ? '+' : '-'}${ratio(Math.abs(value))}`;
}

const RELATIVE = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 5],
  ['month', 12],
];

/** "just now", "5 minutes ago", "yesterday" — how long ago a cached result was generated. */
export function relativeTime(at: number, now: number = Date.now()): string {
  const seconds = Math.round((at - now) / 1000);
  if (Math.abs(seconds) < 45) return 'just now';
  let value = seconds;
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(value) < size) return RELATIVE.format(Math.round(value), unit);
    value /= size;
  }
  return RELATIVE.format(Math.round(value), 'year');
}
