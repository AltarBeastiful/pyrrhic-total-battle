/**
 * One way of writing a figure, everywhere. The number fields write "84 300" (a space every three
 * digits, which is what `NumberInput`'s `thousandSeparator` puts there), so every read-only figure
 * beside them has to match — a comma here and a space there reads as two different numbers.
 */
const GROUPED = new Intl.NumberFormat('en-GB');

export function count(value: number): string {
  return GROUPED.format(value).replace(/,/g, ' ');
}
