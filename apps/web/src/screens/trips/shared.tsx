import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AppFrame, IconButton } from '../../components';

export function useTripsNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const index = Number(window.history.state?.idx ?? 0);
  const trail = (location.state as { tripsTrail?: { path: string; index: number }[] } | null)?.tripsTrail ?? [];
  return (path: string, back = false) => {
    if (back) {
      const canonical = (value: string) => value === '/trips' ? '/trips/trips' : value;
      const target = [...trail].reverse().find(entry => canonical(entry.path) === canonical(path) && entry.index < index);
      if (target) { navigate(target.index - index); return; }
      navigate(path, { replace: true, state: { direction: -1 } });
      return;
    }
    if (path === location.pathname) return;
    navigate(path, { state: { tripsTrail: [...trail, { path: location.pathname, index }].slice(-64) } });
  };
}
export function Art({ name, label = '' }: { name: string; label?: string }) {
  return <img className="trips-art" src={'/assets/trips/' + name} alt={label} />;
}
export function Heading({ title, children }: { title: string; children: ReactNode }) {
  return <header className="trips-heading"><h1 className="text-heading-large">{title}</h1><p className="text-body-regular">{children}</p></header>;
}
export function Frame({ children, back, footer, className = '' }: { children: ReactNode; back?: string; footer?: ReactNode; className?: string }) {
  const go = useTripsNavigation();
  return <AppFrame className={'trips-frame ' + className} footer={footer}><main className="trips-content">{back && <div className="trips-topbar"><IconButton icon="Back" onClick={() => go(back, true)} /></div>}{children}</main></AppFrame>;
}
export function Chart({ name, label, height }: { name: string; label: string; height: number }) {
  // Scale the whole original Figma scene, including its labels, on narrow phones.
  // The SVG's intrinsic dimensions and bytes remain unchanged.
  const container = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => setScale(element.clientWidth / 356);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <span ref={container} className="trips-chart" style={{ aspectRatio: `356 / ${height}` }}><span style={{ transform: `scale(${scale})`, transformOrigin: 'top left', display: 'block' }}><Art name={name} label={label} /></span></span>;
}
