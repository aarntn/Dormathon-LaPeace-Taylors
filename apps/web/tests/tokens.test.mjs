import test from 'node:test';
import assert from 'node:assert/strict';
import { cssColour, cssTypography } from '../scripts/token-values.mjs';

test('Figma percent tracking uses em, not pixels or a full percentage', () => {
  const style = cssTypography({fontName:{family:'Inter',style:'Semi Bold'},fontSize:18,lineHeight:{unit:'AUTO'},letterSpacing:{unit:'PERCENT',value:-0.64}});
  assert.equal(style.letterSpacing, '-0.0064em');
  assert.equal(style.lineHeight, 'normal');
  assert.equal(style.fontWeight, '600');
});

test('Figma percent line heights and translucent colours retain their units', () => {
  assert.equal(cssTypography({fontName:{family:'Inter',style:'Regular'},fontSize:16,lineHeight:{unit:'PERCENT',value:140},letterSpacing:{unit:'PIXELS',value:0.5}}).lineHeight, '1.4');
  assert.equal(cssColour({r:1,g:1,b:1,a:0.14}), 'rgb(255 255 255 / 0.14)');
});
