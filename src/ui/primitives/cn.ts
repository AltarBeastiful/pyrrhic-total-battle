/** Join class names, dropping anything falsy. Deliberately tiny: no `clsx`, no `tailwind-merge`. */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
