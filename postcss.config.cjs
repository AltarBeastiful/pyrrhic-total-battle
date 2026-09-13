/* Mantine's documented PostCSS setup: its mixins and the breakpoint variables the CSS modules use
   (`@media (max-width: $mantine-breakpoint-sm)`). Tailwind was removed at M-09; this is the whole
   CSS pipeline now. */
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
