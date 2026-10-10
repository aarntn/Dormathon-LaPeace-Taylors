import source from './design/figma-tokens.json' with { type: 'json' };
import { tokenName } from './scripts/token-values.mjs';

const collection = source.collections.find(item => item.name === 'Dormathon');
const colours = Object.fromEntries(source.variables.filter(item => item.collection === collection.id)
  .map(item => [tokenName(item.name), `var(--${tokenName(item.name)})`]));
const fontSize = Object.fromEntries(source.textStyles.filter(item => item.fontName.family === 'Inter')
  .map(item => { const name = tokenName(item.name); return [name, [`var(--${name}-font-size)`, {
    lineHeight: `var(--${name}-line-height)`, letterSpacing: `var(--${name}-letter-spacing)`, fontWeight: `var(--${name}-font-weight)`,
  }]]; }));

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: colours, fontFamily: { sans: ['Inter', 'sans-serif'] }, fontSize } },
  plugins: [],
};
