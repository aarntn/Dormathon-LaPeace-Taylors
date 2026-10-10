import type { ReactNode } from 'react';
import { LoadingDots } from '../../components';

/** Loading card from the Figma Motion frame, rendered over the screen that is waiting. */
export function LoadingCard({ title, children, tone = 'dark' }: { title: string; children: ReactNode; tone?: 'dark' | 'light' }) {
  return <div className={`car-loading car-loading--${tone}`} role="status" aria-live="polite">
    <div className="car-loading-card"><LoadingDots tone={tone === 'dark' ? 'Light' : 'Dark'} /><h2 className="text-body-strong">{title}</h2><p className="text-body-small">{children}</p></div>
  </div>;
}
