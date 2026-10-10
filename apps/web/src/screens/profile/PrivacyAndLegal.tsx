import { useState } from 'react';
import { Art, Frame, Heading, RowList } from './shared';

const unavailable = 'This isn’t available in the app yet.';
const details: Record<string, string> = {
  'Location sharing': 'Location is used for your speed and trip summaries. It goes to your emergency contact only after the 10-second countdown ends, and is shared until the alert is resolved.',
  'Motion and braking data': 'Motion is used to spot hard braking and is saved as numbers, never video.',
  'How eye tracking works': 'Face video is processed on your phone and never stored or uploaded. Only eye measurements, like blinks, are used to assess your trip.',
  'Download my data': unavailable, 'Delete my data': unavailable, 'Terms of service': unavailable, 'Privacy policy': unavailable, 'Open-source licences': unavailable,
};
/** P5 Privacy and legal. Rows without their own screen open their explanation underneath. */
export function PrivacyAndLegal() {
  const [open, setOpen] = useState('');
  const row = (title: string, icon: string, extra: { value?: string; to?: string; danger?: boolean } = {}) => ({ title, icon, ...extra, ...(extra.to ? {} : { onSelect: () => setOpen(current => current === title ? '' : title) }) });
  const note = open && <p role="status" className="profile-row-note text-body-small">{details[open]}</p>;
  return <Frame back="/profile/profile" className="profile-privacy">
    <Heading title="Privacy and legal" />
    <aside className="profile-notice"><Art name="info" /><div><h2 className="text-body-strong">BUCKL is a driving aid</h2><p className="text-body-small profile-secondary">It helps you notice tiredness, but it can miss signs and isn’t a medical device. If you feel sleepy, stop and rest.</p></div></aside>
    <section className="profile-group"><h2 className="text-body-small-strong profile-secondary">Safety features</h2>
      <RowList label="Safety features" rows={[row('Emergency texts', 'shield-check', { value: 'Only if needed', to: '/profile/emergency-contact' }), row('Location sharing', 'pin'), row('Motion and braking data', 'motion')]} />
      <p className="text-body-small profile-secondary">We text your contact only after 10 seconds with no response, and you can cancel. Location is used for your speed and shared only in an emergency. Motion is saved as numbers, never video.</p></section>
    <section className="profile-group"><h2 className="text-body-small-strong profile-secondary">Your data</h2>
      <RowList label="Your data" rows={[row('How eye tracking works', 'eye', { value: 'On your phone' }), row('Download my data', 'download'), row('Delete my data', 'trash', { danger: true })]} /></section>
    <section className="profile-group"><h2 className="text-body-small-strong profile-secondary">Legal</h2>
      <RowList label="Legal" rows={[row('Terms of service', 'document'), row('Privacy policy', 'shield'), row('Open-source licences', 'code')]} /></section>
    {note}
    <p className="profile-version text-label-small profile-tertiary">Version 1.0.0</p>
  </Frame>;
}
