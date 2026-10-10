/** Prompt 4c contracts. Pass the current Supabase session token; never a service-role key. */
export type Level = 'safe' | 'caution' | 'high';
export type Urgency = 'monitor' | 'soon' | 'stop';
export type Position = { lat: number; lng: number };
export type TripPoint = Position & { at: string; speed_kmh: number | null };
export type PreDriveInput = {
  slept: number; awake: number; taps_ms: number[]; misses: number; hour: number;
  alert_self: 'very_alert' | 'ok' | 'bit_tired' | 'very_tired';
  trip_length: 'under_30' | '30_60' | '1_2h' | 'over_2h';
  face_perclos: number; face_mean_blink_ms: number; face_yawns: number;
};
export type PreDriveResult = { id: string; level: Level; label: 'Safe to drive' | 'Caution' | 'High risk';
  reasons: string[]; plan: string; disclaimer: string; score: number; score_source: 'demo_rule' | 'trained_model'; model?: string; stub: boolean };
export type TripInput = { car_id: string; predrive_id?: string | null; origin?: Position | null; destination?: Position | null;
  passenger_mode?: boolean; route_choice?: 'safer' | 'fastest' };
export type Trip = TripInput & { id: string; user_id: string; started_at: string; ended_at: string | null;
  passenger_mode: boolean; route_choice: 'safer' | 'fastest'; distance_km?: number | null; avg_speed_kmh?: number | null; safety_score?: number | null };
export type TripEventInput = { at: string; kind: 'tired' | 'microsleep' | 'not_responding' | 'lost' | 'yawn' | 'hard_brake';
  lat?: number | null; lng?: number | null; details?: Record<string, unknown> };
export type TripEvent = TripEventInput & { id: string; trip_id: string };
export type TripFeatures = { perclos: number; blink_rate: number; mean_blink_ms: number; yawns: number;
  minutes_driving: number; hour_of_day: number; hard_brakes?: number };
export type FeatureResult = { ignored?: boolean; id?: string; risk: number | null; level: Level | null; stub: boolean };
export type TripSummary = { trip_id: string; passenger_mode: boolean; distance_km: number; duration_seconds: number;
  avg_speed_kmh: number; route_polyline: [number, number][]; events: TripEvent[]; hard_brake_count: number;
  safety_score: number; score_source: 'demo_rule'; trip_risk_lines: string[]; score_explanation: string };
export type DeliveryStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'unknown';
export type EmergencyAlert = Position & { id: string; trip_id: string; contact_id: string; at: string;
  status: Exclude<DeliveryStatus, 'sending'> | 'cancelled'; resolved_at: string | null };
export type ContactInput = { name: string; phone: string; share_live_location?: boolean; text_when_ok?: boolean };
export type Contact = ContactInput & { id: string; user_id: string; share_live_location: boolean; text_when_ok: boolean };
export type CarInput = { make: string; model: string; year: number; plate?: string | null; colour?: string | null;
  gearbox?: string | null; mileage_km?: number | null; last_service_month?: string | null; last_service_km?: number | null;
  battery_changed?: 'under_1y' | '1_2y' | 'over_2y' | null };
export type Car = CarInput & { id: string; user_id: string };
export type Finding = { id?: string; label: string; urgency: Urgency; urgency_label?: string; advice: string;
  confidence: number | null; photo_url: string | null };
export type DashboardResult = { id: string; at?: string; findings: Finding[]; urgency?: Urgency; urgency_label?: string; stub: boolean };
export type StartupResult = { id: string; at?: string; crank_seconds: number | null; verdict: string; urgency: Urgency; urgency_label: string; stub: boolean };
export type BrakeResult = { hard_stops_per_week: number[]; trend_per_week: number; urgency: Urgency;
  urgency_label: string; verdict: string; score_source: 'demo_rule' };
export type CarReport = { car_id: string; dashboard: DashboardResult | null; startup: StartupResult | null; brakes: BrakeResult };
export type Service = 'cooling' | 'battery' | 'brakes' | 'tyres' | 'fuel';
export type Workshop = Position & { osm_id: string; name: string; distance_km: number; opening_hours: string | null;
  phone: string | null; service_match: boolean; waze_url: string; google_maps_url: string };
export type RouteOption = { choice: 'safer' | 'fastest'; distance_km: number; duration_seconds: number;
  route_polyline: [number, number][]; support_count: number; stops: (Position & { name: string })[]; stub: boolean; message?: string };
export type RouteOptions = { fastest: RouteOption; safer: RouteOption; explanation: string; stub: boolean };
export type Patterns = { slots: { from_hour: number; tired_alerts: number }[]; late_night_share: number };

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : `API request failed (${status})`);
    this.name = 'ApiError'; this.status = status; this.detail = detail;
  }
}

export function createApi({ baseUrl = '/api', getAccessToken, fetcher = fetch }: {
  baseUrl?: string; getAccessToken: () => string | null | Promise<string | null>; fetcher?: typeof fetch;
}) {
  const base = baseUrl.replace(/\/$/, '');
  async function request<T>(path: string, method = 'GET', body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
    const token = await getAccessToken();
    if (!token) throw new ApiError(401, 'Sign in before using the API.');
    const headers = new Headers({ Authorization: `Bearer ${token}`, ...extraHeaders });
    const multipart = body instanceof FormData;
    if (body !== undefined && !multipart) headers.set('Content-Type', 'application/json');
    // Emergency calls are deliberately not automatically retried here. The caller
    // owns countdown cancellation and persists a stable retry operation/key.
    const response = await fetcher(base + path, { method, headers, body: body === undefined ? undefined : multipart ? body : JSON.stringify(body) });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, data?.detail ?? response.statusText);
    return data as T;
  }
  const id = encodeURIComponent;
  const query = (values: Record<string, string | number>) => new URLSearchParams(Object.entries(values).map(([k, v]) => [k, String(v)])).toString();
  const upload = (carId: string, field: 'photo' | 'audio', blob: Blob) => {
    const form = new FormData(); form.append('car_id', carId);
    const suffix = ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','audio/wav':'wav','audio/webm':'webm','audio/mp4':'mp4','audio/ogg':'ogg'} as Record<string, string>)[blob.type] ?? 'bin';
    form.append(field, blob, `${field}.${suffix}`); return form;
  };
  return {
    saveProfile: (name: string) => request<{ id: string; name: string }>('/profile', 'PUT', { name }),
    cars: () => request<Car[]>('/cars'),
    createCar: (body: CarInput) => request<Car>('/cars', 'POST', body),
    contacts: () => request<Contact[]>('/emergency-contacts'),
    createContact: (body: ContactInput) => request<Contact>('/emergency-contacts', 'POST', body),
    updateContact: (contactId: string, body: Partial<ContactInput>) => request<Contact>(`/emergency-contacts/${id(contactId)}`, 'PATCH', body),
    predrive: (body: PreDriveInput) => request<PreDriveResult>('/predrive', 'POST', body),
    startTrip: (body: TripInput) => request<Trip>('/trips', 'POST', body),
    trips: () => request<Trip[]>('/trips'),
    endTrip: (tripId: string) => request<TripSummary>(`/trips/${id(tripId)}/end`, 'PATCH'),
    sendPoints: (tripId: string, points: TripPoint[]) => request<{ accepted: number }>(`/trips/${id(tripId)}/points`, 'POST', { points }),
    sendEvent: (tripId: string, event: TripEventInput) => request<TripEvent | { ignored: true; reason: string }>(`/trips/${id(tripId)}/events`, 'POST', event),
    sendFeatures: (tripId: string, features: TripFeatures) => request<FeatureResult>(`/trips/${id(tripId)}/features`, 'POST', features),
    summary: (tripId: string) => request<TripSummary>(`/trips/${id(tripId)}/summary`),
    /** Invoke only after the cancellable emergency countdown has completed. */
    emergency: (tripId: string, location: Position, episodeKey: string) => request<{ alerts: EmergencyAlert[] }>(`/trips/${id(tripId)}/emergency`, 'POST', location, { 'Idempotency-Key': episodeKey }),
    /** Recover IDs after a lost response without sending or retrying a text. */
    emergencyAlerts: (tripId: string, episodeKey: string) => request<{ alerts: EmergencyAlert[] }>(`/trips/${id(tripId)}/emergency?` + query({episode_key:episodeKey})),
    cancelEmergencyEpisode: (tripId: string, location: Position, episodeKey: string) => request<{ alerts: (EmergencyAlert & {ok_text_status?:DeliveryStatus|null})[] }>(`/trips/${id(tripId)}/emergency/cancel`, 'POST', location, {'Idempotency-Key':episodeKey}),
    emergencyLocation: (alertId: string, location: Position & { at: string }) => request<{ saved: boolean; delivery_status: DeliveryStatus | null }>(`/emergency/${id(alertId)}/location`, 'POST', location),
    resolveEmergency: (alertId: string) => request<EmergencyAlert & { ok_text_status: DeliveryStatus | null }>(`/emergency/${id(alertId)}/resolve`, 'POST'),
    testContact: (contactId: string, retryKey: string) => request<{ id: string; status: DeliveryStatus; test: true }>(`/emergency-contacts/${id(contactId)}/test`, 'POST', undefined, { 'Idempotency-Key': retryKey }),
    patterns: () => request<Patterns>('/patterns'),
    brakes: (carId: string) => request<BrakeResult>(`/brakes/${id(carId)}`),
    dashboardCheck: (carId: string, photo: Blob) => request<DashboardResult>('/car-checks/dashboard', 'POST', upload(carId, 'photo', photo)),
    startupCheck: (carId: string, audio: Blob) => request<StartupResult>('/car-checks/startup-audio', 'POST', upload(carId, 'audio', audio)),
    carReport: (carId: string) => request<CarReport>(`/cars/${id(carId)}/report`),
    workshops: (location: Position, service: Service) => request<{ workshops: Workshop[]; stub: boolean; message?: string }>('/workshops?' + query({ ...location, service })),
    restStops: (location: Position) => request<{ rest_stops: (Position & { name: string; waze_url: string; google_maps_url: string })[]; stub: boolean }>('/rest-stops?' + query(location)),
    routeOptions: (from: Position, to: Position) => request<RouteOptions>('/route-options?' + query({ from: `${from.lat},${from.lng}`, to: `${to.lat},${to.lng}` })),
    geocode: (q: string) => request<(Position & {name: string})[]>('/geocode?' + query({q})),
  };
}
export type BucklApi = ReturnType<typeof createApi>;
