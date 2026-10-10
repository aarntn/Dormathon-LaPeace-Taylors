import { CarCheck } from './CarCheck';
import { FirstCheck } from './FirstCheck';
import { EngineSoundCheck } from './EngineSoundCheck';
import { CarReport } from './CarReport';
import { ScratchDetail } from './ScratchDetail';
import { BeltSquealTrend } from './BeltSquealTrend';

export const carRoutes=[
  {path:'/car',Screen:CarCheck},
  {path:'/car/car-check',Screen:CarCheck},
  {path:'/car/first-check',Screen:FirstCheck},
  // The camera is rendered as a sheet by App; direct entry gets an overview underneath.
  {path:'/car/photo-walk-around',Screen:CarCheck},
  {path:'/car/engine-sound-check',Screen:EngineSoundCheck},
  {path:'/car/car-report',Screen:CarReport},
  {path:'/car/scratch-detail',Screen:ScratchDetail},
  {path:'/car/belt-squeal-trend',Screen:BeltSquealTrend},
];
