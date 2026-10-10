import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AppFrame, IconButton } from '../../components';

export function useProfileNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const index = Number(window.history.state?.idx ?? 0);
  const trail = (location.state as { profileTrail?: { path: string; index: number }[] } | null)?.profileTrail ?? [];
  return (path: string, back = false) => {
    if (back) {
      const canonical = (value: string) => value === '/profile' ? '/profile/profile' : value;
      const target = [...trail].reverse().find(entry => canonical(entry.path) === canonical(path) && entry.index < index);
      if (target) { navigate(target.index - index); return; }
      navigate(path, { replace: true, state: { direction: -1 } });
      return;
    }
    if (path === location.pathname) return;
    navigate(path, { state: { profileTrail: [...trail, { path: location.pathname, index }].slice(-64) } });
  };
}
export function Art({ name, label = '' }: { name: string; label?: string }) {
  return <img className="profile-art" src={'/assets/profile/' + name + '.svg'} alt={label} />;
}
export function Heading({ title, children }: { title: string; children?: ReactNode }) {
  return <header className="profile-heading"><h1 className="text-heading-large">{title}</h1>{children && <p className="text-body-regular profile-secondary">{children}</p>}</header>;
}
export function Frame({ children, back, footer, className = '' }: { children: ReactNode; back?: string; footer?: ReactNode; className?: string }) {
  const go = useProfileNavigation();
  return <AppFrame className={'profile-frame ' + className} footer={footer}><main className="profile-content">{back && <div className="profile-topbar"><IconButton icon="Back" onClick={() => go(back, true)} /></div>}{children}</main></AppFrame>;
}
export type RowData = { title: string; icon: string; value?: string; to?: string; danger?: boolean };
export function RowList({ rows, label }: { rows: RowData[]; label: string }) {
  const go = useProfileNavigation();
  return <div className="profile-list profile-panel" aria-label={label}>{rows.map(row => {
    const content = <><span className={'profile-row-icon' + (row.danger ? ' profile-row-icon--danger' : '')}><Art name={row.icon} /></span><span className="profile-row-title text-body-strong">{row.title}</span>{row.value && <span className="text-body-small profile-secondary">{row.value}</span>}<Art name="chevron" /></>;
    return row.to ? <button key={row.title} type="button" className="profile-row" onClick={() => go(row.to!)}>{content}</button> : <div key={row.title} className={'profile-row' + (row.danger ? ' profile-danger' : '')}>{content}</div>;
  })}</div>;
}
export function Chart({ name, height, label }: { name: string; height: number; label: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => setScale(element.clientWidth / 348);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} className="profile-chart" style={{ aspectRatio: `348 / ${height}` }}><div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}><Art name={name} label={label} /></div></div>;
}
