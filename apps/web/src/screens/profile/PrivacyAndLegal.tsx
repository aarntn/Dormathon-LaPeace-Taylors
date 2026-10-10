import { useState } from 'react';
import { Art, Frame, Heading, RowList } from './shared';
import { useAppData } from '../../integration/AppData';

const details: Record<string, string> = {
  'Location sharing': 'Location is used for your speed and trip summaries. It goes to your emergency contact only after the 10-second countdown ends, and is shared until the alert is resolved.',
  'Motion and braking data': 'Motion is used to spot hard braking and is saved as numbers, never video.',
  'How eye tracking works': 'Face video is processed on your phone and never stored or uploaded. Only eye measurements, like blinks, are used to assess your trip.',
  'Download my data': '', 'Delete my data': 'Deleting your data isn’t available in the app yet.',
};
/** P5 Privacy and legal. Rows without their own screen open their explanation underneath. */
export function PrivacyAndLegal() {
  const [open, setOpen] = useState(''); const data = useAppData(); const [saved, setSaved] = useState('');
  const download = () => {
    if (!data.session) { setSaved('Sign in to download your data.'); return; }
    // Built on this phone from what is already loaded; nothing is requested from anywhere else.
    const file = JSON.stringify({ exportedAt: new Date().toISOString(), account: { email: data.session.user.email, name: data.session.user.user_metadata?.name }, cars: data.cars, emergencyContacts: data.contacts, trips: data.trips }, null, 2);
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([file], { type: 'application/json' })); link.download = 'buckl-my-data.json'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setSaved('Saved your cars, contacts and trips to buckl-my-data.json.');
  };
  const row = (title: string, icon: string, extra: { value?: string; to?: string; danger?: boolean } = {}) => ({ title, icon, ...extra, ...(extra.to ? {} : { onSelect: () => setOpen(current => current === title ? '' : title) }) });
  const note = open && <p role="status" className="profile-row-note text-body-small">{details[open]}</p>;
  return <Frame back="/profile/profile" className="profile-privacy">
    <Heading title="Privacy and legal" />
    <aside className="profile-notice"><Art name="info" /><div><h2 className="text-body-strong">BUCKL is a driving aid</h2><p className="text-body-small profile-secondary">It helps you notice tiredness, but it can miss signs and isn’t a medical device. If you feel sleepy, stop and rest.</p></div></aside>
    <section className="profile-group"><h2 className="text-body-small-strong profile-secondary">Safety features</h2>
      <RowList label="Safety features" rows={[row('Emergency texts', 'shield-check', { value: 'Only if needed', to: '/profile/emergency-contact' }), row('Location sharing', 'pin'), row('Motion and braking data', 'motion')]} />
      <p className="text-body-small profile-secondary">We text your contact only after 10 seconds with no response, and you can cancel. Location is used for your speed and shared only in an emergency. Motion is saved as numbers, never video.</p></section>
    <section className="profile-group"><h2 className="text-body-small-strong profile-secondary">Your data</h2>
      <RowList label="Your data" rows={[row('How eye tracking works', 'eye', { value: 'On your phone' }), { title: 'Download my data', icon: 'download', onSelect: download }, row('Delete my data', 'trash', { danger: true })]} /></section>
    <section className="profile-group"><h2 className="text-body-small-strong profile-secondary">Legal</h2>
      <RowList label="Legal" rows={[row('Terms of service', 'document', { to: '/profile/terms-of-service' }), row('Privacy policy', 'shield', { to: '/profile/privacy-policy' }), row('Open-source licences', 'code', { to: '/profile/open-source-licences' })]} /></section>
    {note}{saved && <p role="status" className="profile-row-note text-body-small">{saved}</p>}
    <p className="profile-version text-label-small profile-tertiary">Version 1.0.0</p>
  </Frame>;
}
