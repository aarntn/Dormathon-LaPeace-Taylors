import { Trips } from './Trips';
import { WhenYouGetTired } from './WhenYouGetTired';
import { LateDriveHeadsUp } from './LateDriveHeadsUp';

export const tripsRoutes = [
  { path: '/trips', Screen: Trips },
  { path: '/trips/trips', Screen: Trips },
  { path: '/trips/when-you-get-tired', Screen: WhenYouGetTired },
  { path: '/trips/late-drive-heads-up', Screen: LateDriveHeadsUp },
];
