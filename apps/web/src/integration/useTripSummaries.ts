import { useEffect, useState } from 'react';
import type { Trip, TripSummary } from '../api';
import { useAppData } from './AppData';

/** Loads each trip’s own saved summary. A response for a changed account or trip list is discarded; a failed trip is simply missing. */
export function useTripSummaries(trips: Trip[], accountId?: string) {
  const { api } = useAppData(); const [summaries, setSummaries] = useState<Record<string, TripSummary>>({});
  const key = trips.filter(trip => !trip.passenger_mode).map(trip => trip.id).join(',');
  useEffect(() => {
    let current = true; setSummaries({});
    for (const id of key ? key.split(',') : []) void api.summary(id).then(summary => { if (current) setSummaries(previous => ({ ...previous, [id]: summary })); }).catch(() => undefined);
    return () => { current = false; };
  }, [key, accountId, api]);
  return summaries;
}
