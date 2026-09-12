/**
 * Two small rules that keep the styling rules of `src/ui/kit/README.md` honest.
 *
 * Both only look at *string literals* handed to a `className` attribute — `className="a b c"` and
 * `className={'a b c'}`, plus the quoted chunks of a template literal. A class list built by `tv()`
 * or `cn()` is a function call, not a literal, so the component layer is free and only hand-written
 * utility strings are judged.
 */

/** The literal nodes inside a JSX attribute value, if any. */
function classNameLiterals(attribute) {
  const value = attribute.value;
  if (!value) return [];
  if (value.type === 'Literal') return typeof value.value === 'string' ? [value] : [];
  if (value.type !== 'JSXExpressionContainer') return [];

  const expression = value.expression;
  if (expression.type === 'Literal') {
    return typeof expression.value === 'string' ? [expression] : [];
  }
  if (expression.type === 'TemplateLiteral') return expression.quasis;
  return [];
}

/** The text of a literal or template chunk. */
function text(node) {
  return node.type === 'TemplateElement' ? node.value.raw : String(node.value);
}

function isClassName(attribute) {
  return attribute.name?.type === 'JSXIdentifier' && attribute.name.name === 'className';
}

const ARBITRARY = /\[[^\]]*\]/;

/**
 * Rule 3 of the kit contract: tokens only. `top-[13px]`, `bg-[#f8f3e9]` and friends put a value in a
 * component that belongs in `src/index.css`.
 */
export const noArbitraryTailwind = {
  meta: {
    type: 'problem',
    docs: {
      description: "Ban Tailwind's arbitrary-value syntax in className; use a token instead.",
    },
    schema: [],
    messages: {
      arbitrary:
        'Arbitrary Tailwind value in className ("{{value}}"). Values live in src/index.css as tokens; use a token utility.',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (!isClassName(node)) return;
        for (const literal of classNameLiterals(node)) {
          const value = text(literal);
          if (!ARBITRARY.test(value)) continue;
          context.report({ node: literal, messageId: 'arbitrary', data: { value: value.trim() } });
        }
      },
    };
  },
};

/**
 * Rule 4 of the kit contract: sections compose, they do not style. A handful of utilities is the
 * allowance; past that the styling belongs in a kit, layout or domain component.
 */
export const maxClassNameUtilities = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Limit how many utilities a className string literal may carry outside the kit.',
    },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: {
      tooMany:
        '{{count}} utilities in one className (max {{max}}). Sections compose; move the styling into a kit, layout or domain component.',
    },
  },
  create(context) {
    const max = context.options[0]?.max ?? 4;
    return {
      JSXAttribute(node) {
        if (!isClassName(node)) return;
        for (const literal of classNameLiterals(node)) {
          const utilities = text(literal).split(/\s+/).filter(Boolean);
          if (utilities.length <= max) continue;
          context.report({
            node: literal,
            messageId: 'tooMany',
            data: { count: String(utilities.length), max: String(max) },
          });
        }
      },
    };
  },
};

export default {
  rules: { 'no-arbitrary-tailwind': noArbitraryTailwind, 'max-classname-utilities': maxClassNameUtilities },
};
