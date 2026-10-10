import type { ButtonHTMLAttributes } from 'react';

export const buttonStyles = ['Primary', 'Secondary', 'Light', 'Outline', 'Drive'] as const;
export type ButtonStyle = typeof buttonStyles[number];
export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'children'> & {
  label?: string;
  style?: ButtonStyle;
};

export function Button({ label = 'Button', style = 'Primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button {...props} type={type} className={`button text-button button--${style.toLowerCase()} ${className}`}>{label}</button>;
}
