import { useState, type ButtonHTMLAttributes } from 'react';
import check from '../assets/figma/option-check.svg';

export type OptionState = 'Default' | 'Selected';
export type OptionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'onChange'> & {
  title?: string; description?: string; state?: OptionState; onChange?: (state: OptionState) => void;
};

export function Option({ title = 'Title', description = 'Description', state = 'Default', onChange, onClick, className = '', ...props }: OptionProps) {
  const [localState, setLocalState] = useState(state);
  const currentState = onChange ? state : localState;
  const selected = currentState === 'Selected';
  return <button {...props} type="button" aria-pressed={selected} className={`option ${selected ? 'option--selected' : ''} ${className}`} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const nextState = selected ? 'Default' : 'Selected';
    setLocalState(nextState); onChange?.(nextState);
  }}>
    <span className="option__text"><span className="text-body-strong">{title}</span><span className="text-body-small text-text-secondary">{description}</span></span>
    <span className="option__indicator">{selected && <img src={check} alt="" width="14" height="14" />}</span>
  </button>;
}
