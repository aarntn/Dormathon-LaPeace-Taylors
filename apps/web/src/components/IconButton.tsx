import type { ButtonHTMLAttributes } from 'react';
import backLight from '../assets/figma/back-light.svg';
import closeLight from '../assets/figma/close-light.svg';
import shareLight from '../assets/figma/share-light.svg';
import backDark from '../assets/figma/back-dark.svg';
import closeDark from '../assets/figma/close-dark.svg';
import shareDark from '../assets/figma/share-dark.svg';

export const icons = ['Back', 'Close', 'Share'] as const;
export const iconThemes = ['Light', 'Dark'] as const;
export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: typeof icons[number]; theme?: typeof iconThemes[number];
};
const artwork = { Light: { Back: backLight, Close: closeLight, Share: shareLight }, Dark: { Back: backDark, Close: closeDark, Share: shareDark } };

export function IconButton({ icon = 'Back', theme = 'Light', className = '', type = 'button', ...props }: IconButtonProps) {
  return <button aria-label={icon} {...props} type={type} className={`icon-button icon-button--${theme.toLowerCase()} ${className}`}>
    <span className="icon-slot"><img src={artwork[theme][icon]} alt="" /></span>
  </button>;
}
