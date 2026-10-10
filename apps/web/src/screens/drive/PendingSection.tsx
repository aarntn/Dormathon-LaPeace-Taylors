import { useLocation } from 'react-router';
import { Button, TabBar } from '../../components';
import { DriveFrame, Heading, useDriveNavigation } from './shared';

// Preserve the prototype destinations at this section's review checkpoint.
// These routes will be replaced by their Figma sections in subsequent steps.
export function PendingSection() {
  const { pathname } = useLocation();
  const title = pathname === '/car' ? 'Car' : pathname === '/trips' ? 'Trips' : 'Profile';
  const go = useDriveNavigation();
  return <DriveFrame footer={<TabBar active={title} onChange={tab => go(tab === 'Home' ? '/drive/home' : `/${tab.toLowerCase()}`)} />}><main className="drive-content drive-pending"><Heading title={title}>This section is next in the build guide.</Heading><Button label="Back to Home" onClick={() => go('/drive/home', true)} /></main></DriveFrame>;
}
