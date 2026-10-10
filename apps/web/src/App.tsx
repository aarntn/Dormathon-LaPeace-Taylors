import { useLayoutEffect, useRef } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation, useNavigationType, type Location } from 'react-router';
import { PageTransition, type TransitionContext } from './components';
import { metadataFor } from './routing/routeMetadata';
import { navigationDirection } from './routing/transitions';
import { Components } from './screens/Components';
import { ComponentsCanvas } from './screens/ComponentsCanvas';
import { TransitionPreview } from './screens/TransitionPreview';
import { SheetPreview } from './screens/SheetPreview';
import { driveRoutes } from './screens/drive/routes';
import { DemoProvider } from './screens/drive/DemoPanel';
import { onboardingRoutes } from './screens/onboarding/routes';
import { OnboardingProvider } from './screens/onboarding/draft';
import { PeroduaMyviSheet } from './screens/onboarding/PeroduaMyviSheet';
import { carRoutes } from './screens/car/routes';
import { CarProvider } from './screens/car/session';
import { PhotoWalkAround } from './screens/car/PhotoWalkAround';
import { tripsRoutes } from './screens/trips/routes';
import { TripsProvider } from './screens/trips/session';
import { profileRoutes } from './screens/profile/routes';
import { EyeWatchProvider } from './eyewatch/useEyeWatch';
import { TestEyes } from './eyewatch/TestEyes';
import { AppDataProvider } from './integration/AppData';
import { DriveProvider } from './screens/drive/session';

export function App() {
  const location = useLocation();
  const action = useNavigationType();
  const reducedMotion = Boolean(useReducedMotion());
  const index = Number(window.history.state?.idx ?? 0);
  const previous = useRef({ index, metadata: metadataFor(location.pathname) });
  const scrollPositions = useRef(new Map<string, number>());
  const background = (location.state as { backgroundLocation?: Location } | null)?.backgroundLocation;
  const mainLocation = background ?? location;
  const explicitBack = action !== 'POP' && (location.state as { direction?: number } | null)?.direction === -1;
  const direction = explicitBack ? -1 : navigationDirection(previous.current.index, index, action);
  const destinationKind = metadataFor(location.pathname).transition;
  const kind = explicitBack ? 'push' : direction === -1
    ? previous.current.metadata.transition === 'fade' && destinationKind === 'fade' ? 'fade'
      : previous.current.metadata.transition === 'tab' && destinationKind === 'tab' ? 'tab'
      : previous.current.metadata.transition === 'sheet' ? 'sheet' : 'push'
    : destinationKind;
  const context: TransitionContext = { kind: kind === 'sheet' ? 'push' : kind, direction, reducedMotion };
  const isSheet = metadataFor(location.pathname).transition === 'sheet';

  useLayoutEffect(() => { previous.current = { index, metadata: metadataFor(location.pathname) }; }, [index, location.pathname]);
  useLayoutEffect(() => {
    window.scrollTo(0, scrollPositions.current.get(mainLocation.key) ?? 0);
    return () => { scrollPositions.current.set(mainLocation.key, window.scrollY); };
  }, [mainLocation.key]);

  return <AppDataProvider><EyeWatchProvider><DriveProvider><DemoProvider><OnboardingProvider><CarProvider><TripsProvider>
    <div className="route-stack"><AnimatePresence initial={false} custom={context}>
      <PageTransition key={mainLocation.key} context={context}>
        <Routes location={mainLocation}>
          {driveRoutes.map(({ path, Screen }) => <Route key={path} path={path} element={<Screen />} />)}
          {onboardingRoutes.map(({ path, Screen }) => <Route key={path} path={path} element={<Screen />} />)}
          {carRoutes.map(({ path, Screen }) => <Route key={path} path={path} element={<Screen />} />)}
          {tripsRoutes.map(({ path, Screen }) => <Route key={path} path={path} element={<Screen />} />)}
          {profileRoutes.map(({ path, Screen }) => <Route key={path} path={path} element={<Screen />} />)}
          <Route path="/" element={<Navigate to="/drive/home" replace />} />
          <Route path="/components" element={<Components />} />
          <Route path="/test-eyes" element={<TestEyes />} />
          <Route path="/components/canvas" element={<ComponentsCanvas />} />
          <Route path="/components/preview/sheet" element={<Components />} />
          <Route path="/components/preview/:kind" element={<TransitionPreview />} />
          <Route path="*" element={<Navigate to="/components" replace />} />
        </Routes>
      </PageTransition>
    </AnimatePresence></div>
    <AnimatePresence custom={location.pathname==='/car/engine-sound-check'&&direction===1?'push':'sheet'}>{isSheet && (location.pathname === '/onboarding/perodua-myvi-sheet' ? <PeroduaMyviSheet key="car-sheet" /> : location.pathname === '/car/photo-walk-around' ? <PhotoWalkAround key="car-camera" /> : <SheetPreview key="sheet" />)}</AnimatePresence>
  </TripsProvider></CarProvider></OnboardingProvider></DemoProvider></DriveProvider></EyeWatchProvider></AppDataProvider>;
}
