import type { TransitionKind } from './transitions';

export type RouteMetadata = { path: string; transition: TransitionKind };
export const routeMetadata: RouteMetadata[] = [
  { path: '/onboarding/perodua-myvi-sheet', transition: 'sheet' },
  { path: '/car/car-check', transition: 'tab' },
  { path: '/car/photo-walk-around', transition: 'sheet' },
  { path: '/drive/home', transition: 'tab' },
  { path: '/drive/mount-your-phone', transition: 'push' },
  { path: '/drive/line-up-your-face', transition: 'push' },
  { path: '/drive/quick-eye-check', transition: 'fade' },
  { path: '/drive/driving', transition: 'fade' },
  { path: '/drive/cant-see-your-eyes', transition: 'fade' },
  { path: '/drive/getting-tired', transition: 'fade' },
  { path: '/drive/microsleep-alarm', transition: 'fade' },
  { path: '/drive/trip-summary', transition: 'push' },
  { path: '/drive/waze-open-still-watching', transition: 'fade' },
  { path: '/drive/tired-while-waze-is-open', transition: 'fade' },
  { path: '/trips', transition: 'tab' },
  { path: '/trips/trips', transition: 'tab' },
  { path: '/car', transition: 'tab' },
  { path: '/profile', transition: 'tab' },
  { path: '/profile/profile', transition: 'tab' },
  { path: '/components', transition: 'push' },
  { path: '/components/canvas', transition: 'push' },
  { path: '/components/preview/push', transition: 'push' },
  { path: '/components/preview/sheet', transition: 'sheet' },
  { path: '/components/preview/fade', transition: 'fade' },
  { path: '/components/preview/tab', transition: 'tab' },
];
export function metadataFor(pathname: string): RouteMetadata {
  return routeMetadata.find(route => route.path === pathname) ?? { path: pathname, transition: 'push' };
}
