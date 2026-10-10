import { CarCheck } from './CarCheck';
import { EngineSoundCheck, CheckingTheSound } from './EngineSoundCheck';
import { CarReport } from './CarReport';
import { BrakeCheck } from './BrakeCheck';
import { WorkshopsNearYou } from './WorkshopsNearYou';
import { WarningLightResult, CouldntReadTheLight, DidntHearTheEngine } from './Results';

export const carRoutes=[
  {path:'/car',Screen:CarCheck},
  {path:'/car/car-check',Screen:CarCheck},
  // The camera and its loading card are sheets rendered by App; direct entry gets Car check underneath.
  {path:'/car/scan-a-warning-light',Screen:CarCheck},
  {path:'/car/reading-the-light',Screen:CarCheck},
  {path:'/car/warning-light-result',Screen:WarningLightResult},
  {path:'/car/couldnt-read-the-light',Screen:CouldntReadTheLight},
  {path:'/car/engine-sound-check',Screen:EngineSoundCheck},
  {path:'/car/checking-the-sound',Screen:CheckingTheSound},
  {path:'/car/didnt-hear-the-engine',Screen:DidntHearTheEngine},
  {path:'/car/car-report',Screen:CarReport},
  {path:'/car/brake-check',Screen:BrakeCheck},
  {path:'/car/workshops-near-you',Screen:WorkshopsNearYou},
];
