/**
 * `src/index.css` declares the palettes on `:root` (light) and on `:root[data-theme='dark']`, because
 * the app only ever flips the whole document. The kit page shows both themes at once, so a nested
 * `data-theme` wrapper needs those same custom properties on itself.
 *
 * Rather than copying the values — which would go stale the moment a token changes — the two rules
 * are read back out of the live stylesheet and re-inserted with the `:root` part of the selector
 * dropped, so `[data-theme='light']` and `[data-theme='dark']` work on any element. One source of
 * truth stays in `index.css`; this is dev-only and never reaches a production bundle.
 */

const LIGHT_ROOT = /^:root$/;
const DARK_ROOT = /^:root\[data-theme\s*=\s*["']?dark["']?\]$/;

const MARKER = 'data-kit-theme-mirror';

/** Copy the root palettes onto attribute selectors. Safe to call more than once. */
export function mirrorThemeTokens(doc: Document = document): void {
  if (doc.querySelector(`style[${MARKER}]`)) return;

  const blocks: string[] = [];
  for (const sheet of Array.from(doc.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // A stylesheet from another origin cannot be read; there are none of ours there.
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) continue;
      const selector = rule.selectorText.trim();
      if (LIGHT_ROOT.test(selector)) {
        blocks.push(rule.cssText.replace(selector, "[data-theme='light']"));
      } else if (DARK_ROOT.test(selector)) {
        blocks.push(rule.cssText.replace(selector, "[data-theme='dark']"));
      }
    }
  }

  if (blocks.length === 0) return;

  const style = doc.createElement('style');
  style.setAttribute(MARKER, '');
  style.textContent = blocks.join('\n');
  doc.head.append(style);
}
