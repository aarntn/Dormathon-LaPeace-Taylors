import { Profile } from './Profile';
import { DrivingStats } from './DrivingStats';
import { MyCars } from './MyCars';
import { AddACar } from './AddACar';
import { PrivacyAndLegal } from './PrivacyAndLegal';
export const profileRoutes = [
  { path: '/profile', Screen: Profile },
  { path: '/profile/profile', Screen: Profile },
  { path: '/profile/driving-stats', Screen: DrivingStats },
  { path: '/profile/my-cars', Screen: MyCars },
  { path: '/profile/add-a-car', Screen: AddACar },
  { path: '/profile/privacy-and-legal', Screen: PrivacyAndLegal },
];
