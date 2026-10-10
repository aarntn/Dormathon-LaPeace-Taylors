export function cssColour(value) {
  if (value.type === 'VARIABLE_ALIAS') throw new Error('Resolve variable aliases before export');
  const channels = ['r', 'g', 'b'].map(channel => Math.round(value[channel] * 255));
  return value.a !== undefined && value.a !== 1
    ? `rgb(${channels.join(' ')} / ${value.a})`
    : `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
}

const stable = value => Number(value.toFixed(6));

export function cssTypography(style) {
  const weights = { Regular: '400', Medium: '500', 'Semi Bold': '600', Bold: '700' };
  return {
    fontFamily: style.fontName.family,
    fontSize: `${style.fontSize}px`,
    fontWeight: weights[style.fontName.style] ?? '400',
    lineHeight: style.lineHeight.unit === 'AUTO' ? 'normal'
      : style.lineHeight.unit === 'PERCENT' ? `${stable(style.lineHeight.value / 100)}`
      : `${stable(style.lineHeight.value)}px`,
    letterSpacing: style.letterSpacing.unit === 'PERCENT'
      ? `${stable(style.letterSpacing.value / 100)}em`
      : `${stable(style.letterSpacing.value)}px`,
  };
}

export const tokenName = name => name.toLowerCase().replace(/[\s/]+/g, '-');
