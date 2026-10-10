import type { ReactNode } from 'react';
import { Frame, Heading } from './shared';
import packageInfo from '../../../package.json';

// Plain-language pages for the Privacy and legal and Help rows. They describe how this build behaves,
// and are marked as the demo version until reviewed by the team’s legal adviser.
function Page({ title, children }: { title: string; children: ReactNode }) {
  return <Frame back="/profile/privacy-and-legal" className="profile-info"><Heading title={title} />{children}</Frame>;
}
const Card = ({ title, children }: { title: string; children: ReactNode }) => <section className="profile-info-card profile-panel"><h2 className="text-body-strong">{title}</h2>{children}</section>;
const Draft = () => <p className="profile-info-draft text-body-small">Demo version. This summary describes how BUCKL works today and has not had legal review.</p>;

export function TermsOfService() {
  return <Page title="Terms of service"><Draft />
    <Card title="A driving aid, not a guarantee"><p className="text-body-small">BUCKL helps you notice tiredness and car warning signs. It can miss signs and is not a medical device. You stay responsible for driving safely. If you feel sleepy, stop and rest.</p></Card>
    <Card title="Safety indications"><p className="text-body-small">Results say “possible” or “may”. A readiness result, a warning-light explanation or a battery check is an indication, not a medical or vehicle diagnosis.</p></Card>
    <Card title="Emergency texts"><p className="text-body-small">If you stop responding to the alarm, BUCKL can text your chosen contact. You can cancel during the 10-second countdown. Texts depend on your phone signal and may be delayed.</p></Card>
    <Card title="Your account"><p className="text-body-small">Keep your sign-in details private. You can stop using BUCKL at any time.</p></Card></Page>;
}
export function PrivacyPolicy() {
  return <Page title="Privacy policy"><Draft />
    <Card title="Face video"><p className="text-body-small">Video from your camera is processed on your phone. It is never stored or uploaded. Only eye measurements, such as blinks, are used to assess your trip.</p></Card>
    <Card title="Audio and photos"><p className="text-body-small">Audio is recorded only while you run the start-up battery check. A dashboard photo is uploaded only when you take it.</p></Card>
    <Card title="Location"><p className="text-body-small">Location is used for your speed and trip summaries. It goes to your emergency contact only after the countdown ends, and keeps updating until you say you are OK.</p></Card>
    <Card title="Your trips"><p className="text-body-small">Your cars, trips, alerts and contacts are saved to your account so you can see them again. Only you can see them.</p></Card></Page>;
}
const licences: [string, string][] = [['React and React DOM', 'MIT'], ['React Router', 'MIT'], ['Framer Motion', 'MIT'], ['MediaPipe Tasks Vision', 'Apache 2.0'], ['Inter typeface', 'SIL Open Font Licence 1.1']];
export function OpenSourceLicences() {
  const packages = Object.entries({ ...packageInfo.dependencies, ...packageInfo.devDependencies });
  return <Page title="Open-source licences">
    <Card title="Used in the app">{licences.map(([name, licence]) => <p key={name} className="profile-info-line text-body-small"><span>{name}</span><strong className="text-body-small-strong">{licence}</strong></p>)}
      <a className="profile-info-link text-body-small-strong" href="/fonts/Inter-LICENSE.txt" target="_blank" rel="noopener noreferrer">Read the Inter licence</a></Card>
    <Card title="Packages in this build">{packages.map(([name, version]) => <p key={name} className="profile-info-line text-body-small"><span>{name}</span><span className="profile-secondary">{String(version).replace(/^[\^~]/, '')}</span></p>)}</Card></Page>;
}
export function HelpAndSupport() {
  return <Frame back="/profile/profile" className="profile-info"><Heading title="Help and support" />
    <Card title="In an emergency"><p className="text-body-small">Call 999. BUCKL’s text to your contact is a back-up and does not replace calling for help.</p></Card>
    <Card title="The alarm keeps sounding"><p className="text-body-small">Tap “I’m OK”, or say “I’m OK”. If you do nothing for 10 seconds, your contact gets a text. You can cancel the countdown at any time.</p></Card>
    <Card title="The camera can’t see my eyes"><p className="text-body-small">Move the phone so it faces you, with a light in front of you rather than a window behind. Glasses are fine, sunglasses are not.</p></Card>
    <Card title="I’m a passenger"><p className="text-body-small">Choose Passenger mode before the drive. BUCKL won’t watch faces or sound alarms.</p></Card>
    <Card title="Something looks wrong"><p className="text-body-small">Check the Privacy and legal page for how your data is used. For anything else, tell the BUCKL team who gave you this app.</p></Card></Frame>;
}
