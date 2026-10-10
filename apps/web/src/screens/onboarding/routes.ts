import { Splash } from './Splash';
import { Loading } from './Loading';
import { Welcome } from './Welcome';
import { SignUp } from './SignUp';
import { WhatsYourCar } from './WhatsYourCar';
import { CarDetails } from './CarDetails';
import { ServiceAndCondition } from './ServiceAndCondition';
import { HowYouDrive } from './HowYouDrive';
import { WhichMapsApp } from './WhichMapsApp';
import { FaceScanIntro } from './FaceScanIntro';
import { FaceScan } from './FaceScan';
import { AllSet } from './AllSet';
export const onboardingRoutes = [
  { path:'/onboarding/splash',Screen:Splash },{path:'/onboarding/loading',Screen:Loading},
  {path:'/onboarding/welcome',Screen:Welcome},{path:'/onboarding/sign-up',Screen:SignUp},
  {path:'/onboarding/whats-your-car',Screen:WhatsYourCar},{path:'/onboarding/perodua-myvi-sheet',Screen:WhatsYourCar},
  {path:'/onboarding/car-details',Screen:CarDetails},{path:'/onboarding/service-and-condition',Screen:ServiceAndCondition},
  {path:'/onboarding/how-you-drive',Screen:HowYouDrive},{path:'/onboarding/which-maps-app',Screen:WhichMapsApp},
  {path:'/onboarding/face-scan-intro',Screen:FaceScanIntro},{path:'/onboarding/face-scan',Screen:FaceScan},
  {path:'/onboarding/all-set',Screen:AllSet},
];
