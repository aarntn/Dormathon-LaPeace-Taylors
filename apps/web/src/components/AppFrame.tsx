import type { ReactNode } from 'react';

export type AppFrameProps = { children: ReactNode; footer?: ReactNode; theme?: 'Light' | 'Dark'; className?: string };
export function AppFrame({ children, footer, theme = 'Light', className = '' }: AppFrameProps) {
  return <div className={`app-frame app-frame--${theme.toLowerCase()} ${className}`}>
    <div className={`app-frame__content ${footer ? 'app-frame__content--with-footer' : ''}`}>{children}</div>
    {footer && <footer className="app-frame__footer">{footer}</footer>}
  </div>;
}
