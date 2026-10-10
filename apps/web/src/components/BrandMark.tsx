import navy from '../assets/figma/brand-navy.svg?raw';
import white from '../assets/figma/brand-white.svg?raw';
import onLight from '../assets/figma/logo-on-light.svg?raw';
import onDark from '../assets/figma/logo-on-dark.svg?raw';
import mono from '../assets/figma/logo-mono.svg?raw';

export type BrandMarkProps = { theme?: 'Navy' | 'White'; version?: 'On light' | 'On dark' | 'Mono'; className?: string };

export function BrandMark({ theme = 'Navy', version, className = '' }: BrandMarkProps) {
  const markup = version ? { 'On light': onLight, 'On dark': onDark, Mono: mono }[version] : theme === 'White' ? white : navy;
  // Only trusted, checked-in SVG exports are inserted; preserve their source geometry.
  return <span role="img" aria-label="Dormathon" className={`brand-mark ${className}`} dangerouslySetInnerHTML={{ __html: markup }} />;
}
