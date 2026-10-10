import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { cssColour, cssTypography, tokenName } from './token-values.mjs';

const source = JSON.parse(await readFile(new URL('../design/figma-tokens.json', import.meta.url), 'utf8'));
const collection = source.collections.find(item => item.name === 'Dormathon');
if (!collection) throw new Error('Dormathon collection is missing');
const colours = source.variables.filter(item => item.collection === collection.id);
const styles = source.textStyles.filter(item => item.fontName.family === 'Inter');
const lines = colours.map(item => `  --${tokenName(item.name)}: ${cssColour(item.values[collection.defaultModeId])};`);
for (const style of styles) {
  for (const [property, value] of Object.entries(cssTypography(style))) {
    const cssProperty = property.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
    lines.push(`  --${tokenName(style.name)}-${cssProperty}: ${value};`);
  }
}
await mkdir(new URL('../src/styles/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/styles/tokens.css', import.meta.url), `/* Generated from Figma's Dormathon collection and Inter text styles.\n * Run npm run tokens to regenerate from design/figma-tokens.json. */\n:root {\n${lines.join('\n')}\n}\n`);
console.log(`Generated ${colours.length} colours and ${styles.length} text styles.`);
