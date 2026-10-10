import { Home } from './Home';
import { MountYourPhone } from './MountYourPhone';
import { LineUpYourFace } from './LineUpYourFace';
import { QuickEyeCheck } from './QuickEyeCheck';
import { Driving } from './Driving';
import { CantSeeYourEyes } from './CantSeeYourEyes';
import { GettingTired } from './GettingTired';
import { MicrosleepAlarm } from './MicrosleepAlarm';
import { TripSummary } from './TripSummary';
import { WazeOpenStillWatching } from './WazeOpenStillWatching';
import { TiredWhileWazeIsOpen } from './TiredWhileWazeIsOpen';
import {BeforeYouDrive,FaceReading,TapTest,WorkingOutResult,CheckResult,PickYourRoute} from './PreDrive';
import {NoResponse,ContactAlerted,PassengerMode} from './Emergency';

export const driveRoutes = [
  {path:'/drive/no-response',Screen:NoResponse},{path:'/drive/contact-alerted',Screen:ContactAlerted},{path:'/drive/passenger-mode',Screen:PassengerMode},
  ...Object.entries({'before-you-drive':BeforeYouDrive,'face-reading':FaceReading,'tap-test':TapTest,'working-out-your-result':WorkingOutResult,'check-result':CheckResult,'pick-your-route':PickYourRoute}).map(([name,Screen])=>({path:'/drive/'+name,Screen})),
  { path: '/drive/home', Screen: Home },
  { path: '/drive/mount-your-phone', Screen: MountYourPhone },
  { path: '/drive/line-up-your-face', Screen: LineUpYourFace },
  { path: '/drive/quick-eye-check', Screen: QuickEyeCheck },
  { path: '/drive/driving', Screen: Driving },
  { path: '/drive/cant-see-your-eyes', Screen: CantSeeYourEyes },
  { path: '/drive/getting-tired', Screen: GettingTired },
  { path: '/drive/microsleep-alarm', Screen: MicrosleepAlarm },
  { path: '/drive/trip-summary', Screen: TripSummary },
  { path: '/drive/waze-open-still-watching', Screen: WazeOpenStillWatching },
  { path: '/drive/tired-while-waze-is-open', Screen: TiredWhileWazeIsOpen },
];
