import { MapsView, type MapsViewProps } from './MapsView';
export function TiredWhileWazeIsOpen(props: Omit<MapsViewProps, 'tired'>) { return <MapsView {...props} tired />; }
