import { motion, type HTMLMotionProps } from 'framer-motion';
import { EASE } from '../routing/transitions';
import { useReducedMotionPreference } from './motion/useReducedMotionPreference';

export const buttonStyles = ['Primary', 'Secondary', 'Light', 'Outline', 'Drive'] as const;
export type ButtonStyle = typeof buttonStyles[number];
export const buttonStates = ['Default', 'Pressed'] as const;
export type ButtonProps = Omit<HTMLMotionProps<'button'>, 'style' | 'children'> & {
  label?: string;
  style?: ButtonStyle;
  state?: typeof buttonStates[number];
};

export function Button({ label = 'Button', style = 'Primary', state = 'Default', className = '', type = 'button', disabled, ...props }: ButtonProps) {
  const reduced = useReducedMotionPreference();
  return <motion.button {...props} type={type} disabled={disabled} data-button-state={state}
    className={`button text-button button--${style.toLowerCase()} ${state === 'Pressed' ? 'button--pressed' : ''} ${className}`}
    whileTap={disabled ? undefined : { backgroundColor: `var(--button-${style.toLowerCase()}-pressed)`, scale: reduced ? 1 : 0.98 }}
    transition={{ duration: 0.12, ease: EASE }}>{label}</motion.button>;
}
