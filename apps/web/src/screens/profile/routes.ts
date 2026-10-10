import { Profile } from './Profile';
import { DrivingStats } from './DrivingStats';
import { MyCars } from './MyCars';
import { AddACar } from './AddACar';
import { PrivacyAndLegal } from './PrivacyAndLegal';
import {EmergencyContact} from './EmergencyContact';
import { TermsOfService, PrivacyPolicy, OpenSourceLicences, HelpAndSupport } from './InfoPages';
export const profileRoutes = [
  { path: '/profile/terms-of-service', Screen: TermsOfService },
  { path: '/profile/privacy-policy', Screen: PrivacyPolicy },
  { path: '/profile/open-source-licences', Screen: OpenSourceLicences },
  { path: '/profile/help-and-support', Screen: HelpAndSupport },
  {path:'/profile/emergency-contact',Screen:EmergencyContact},
  { path: '/profile', Screen: Profile },
  { path: '/profile/profile', Screen: Profile },
  { path: '/profile/driving-stats', Screen: DrivingStats },
  { path: '/profile/my-cars', Screen: MyCars },
  { path: '/profile/add-a-car', Screen: AddACar },
  { path: '/profile/privacy-and-legal', Screen: PrivacyAndLegal },
];
