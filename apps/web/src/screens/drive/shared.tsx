import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AppFrame, Button, IconButton } from '../../components';
import { currentAssets, currentAssetAliases } from './currentAssets';

export const asset = (name: string) => {
  const current = currentAssetAliases[name] ?? name;
  return currentAssets.has(current) ? `/assets/drive-current/${current}` : `/assets/drive/${name}`;
};
export function Art({ name, className = '', alt = '' }: { name: string; className?: string; alt?: string }) {
  return <img src={asset(name)} alt={alt} className={`drive-art ${className}`} />;
}
export function Glyph({ name, size = 20 }: { name: string; size?: number }) {
  return <span className="drive-glyph" style={{ width: size, height: size }}><Art name={name} /></span>;
}
export function useDriveNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const index = Number(window.history.state?.idx ?? 0);
  const trail = (location.state as { driveTrail?: { path: string; index: number }[] } | null)?.driveTrail ?? [];
  return (path: string, back = false) => {
    if (back) {
      const target = [...trail].reverse().find(entry => entry.path === path && entry.index < index);
      if (target) { navigate(target.index - index); return; }
      navigate(path, { replace: true, state: { direction: -1 } });
      return;
    }
    if (path === location.pathname) return;
    navigate(path, { state: { driveTrail: [...trail, { path: location.pathname, index }].slice(-64) } });
  };
}
export function DriveFrame({ children, footer, dark = false, className = '' }: { children: ReactNode; footer?: ReactNode; dark?: boolean; className?: string }) {
  return <AppFrame theme={dark ? 'Dark' : 'Light'} footer={footer} className={`drive-frame ${className}`}>{children}</AppFrame>;
}
export function Back({ to, dark = false, close = false }: { to: string; dark?: boolean; close?: boolean }) {
  const go = useDriveNavigation();
  return <IconButton icon={close ? 'Close' : 'Back'} theme={dark ? 'Dark' : 'Light'} onClick={() => go(to, true)} />;
}
export function Steps({ step, dark = false }: { step: number; dark?: boolean }) {
  return <div className={`drive-steps ${dark ? 'drive-steps--dark' : ''}`}><div className="drive-steps__bars">{[1, 2, 3].map(n => <span key={n} className={n <= step ? 'complete' : ''} />)}</div><p className="text-label-small">Before you drive · {step} of 3</p></div>;
}
export function Heading({ title, children, dark = false }: { title: string; children?: ReactNode; dark?: boolean }) {
  return <header className={`drive-heading ${dark ? 'drive-heading--dark' : ''}`}><h1 className="text-heading-large">{title}</h1>{children && <p className="text-body-regular">{children}</p>}</header>;
}
export function TripBar({ status, duration, alarm = false, warning = false, alarmStatus='Alarm on', controls }: { status: string; duration?: string; alarm?: boolean; warning?: boolean; alarmStatus?:string; controls?:string }) {
  return <div className="drive-trip-bar"><div className="drive-trip-status"><Art name={warning ? '6cb7a.svg' : 'd0a0b.svg'} /><p className="text-body-small-strong">{status}</p></div>{controls?<div className="drive-alarm-status"><img src="/assets/drive-current/eaad6.svg" width="18" height="18" alt=""/><p className="text-body-small">{controls}</p></div>:alarm ? <div className="drive-alarm-status"><Glyph name="b3b52.svg" size={18} /><p className="text-body-small">{alarmStatus}</p></div> : <p className="text-body-small drive-secondary">{duration}</p>}</div>;
}
export function Gauge({ mode, title, detail }: { mode: 'check' | 'alert' | 'tired'; title: string; detail: string }) {
  return <div className={`drive-gauge drive-gauge--${mode}`} role="img" aria-label={`${title}. ${detail}`}><Art name={mode === 'alert' ? 'fe148.svg' : 'd663f.svg'} className="drive-gauge__track" /><Art name={mode === 'alert' ? '46c58.svg' : mode === 'tired' ? '24551.svg' : 'a4bc7.svg'} className="drive-gauge__level" /><Art name={mode === 'alert' ? '5c642.svg' : 'b7757.svg'} className="drive-gauge__eyes" /><p className={`drive-gauge__title ${mode === 'check' ? 'text-heading-large' : 'text-heading-display'}`}>{title}</p><p className="drive-gauge__detail text-body-small">{detail}</p></div>;
}
export function SpokenPrompt({ children }: { children: ReactNode }) {
  return <div className="drive-spoken"><Glyph name="8342e.svg" /><p className="text-body-small">{children}</p></div>;
}
export function RestStopCard({ title, detail, alarm = false }: { title: string; detail: string; alarm?: boolean }) {
  const go = useDriveNavigation();
  return <section className={`drive-rest-card ${alarm ? 'drive-rest-card--alarm' : ''}`}><div className="drive-rest-card__heading"><div className="drive-rest-card__icon"><Glyph name={alarm ? 'dad67.svg' : 'f04f3.svg'} size={24} /></div><div><h2 className="text-title-medium">{title}</h2><p className="text-body-small">{detail}</p></div></div><Button label="Go to rest stop" onClick={() => go('/drive/trip-summary')} /><div className="drive-maps-hint"><Glyph name="43460.svg" size={14} /><p className="text-label-small">Opens in Waze · your saved places stay there</p></div></section>;
}
