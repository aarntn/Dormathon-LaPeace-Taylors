import { useState, type InputHTMLAttributes } from 'react';

export const inputStates = ['Placeholder', 'Filled', 'Focused'] as const;
export type InputProps = InputHTMLAttributes<HTMLInputElement> & { state?: typeof inputStates[number]; text?: string };

export function Input({ state = 'Placeholder', text = 'Value', className = '', defaultValue, placeholder, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  return <input {...props} aria-label={props['aria-label'] ?? text} className={`input text-body-regular ${focused || state === 'Focused' ? 'input--focused' : ''} ${className}`}
    defaultValue={props.value === undefined ? (defaultValue ?? (state === 'Placeholder' ? '' : text)) : undefined}
    placeholder={placeholder ?? text} onFocus={event => { setFocused(true); onFocus?.(event); }} onBlur={event => { setFocused(false); onBlur?.(event); }} />;
}
