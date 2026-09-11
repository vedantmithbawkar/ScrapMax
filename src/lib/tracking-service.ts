import {
  triggerCollectorAcceptedNotification,
  triggerCollectorNearNotification,
  triggerPickupCompletedNotification,
  triggerPaymentReceivedNotification,
} from './notification-service';

export interface LiveTrackingState {
  requestId: string;
  collectorPos: [number, number];
  householdPos: [number, number];
  routeCoordinates: [number, number][];
  distanceMeters: number;
  etaMinutes: number;
  isNearDoorstep: boolean;
  hasArrived: boolean;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  lastUpdated: string;
  collectorName: string;
  collectorPhone: string;
  householdName: string;
  householdPhone: string;
  householdAddress: string;
  householdLandmark?: string;
  pickupPin: string;
  payment?: any;
}

const STORAGE_PREFIX = 'scrapmax_tracking_';
const CHANNEL_NAME = 'scrapmax_tracking_sync_channel';

// Active in-memory simulation timers
const activeSimulations = new Map<string, NodeJS.Timeout>();

/**
 * Calculates Haversine distance in meters between two lat/lng pairs.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats distance in readable meters or kilometers.
 */
export function formatDistance(meters: number): string {
  if (meters < 100) return 'At Doorstep';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Estimates driving ETA in minutes assuming 22 km/h city average speed.
 */
export function estimateEtaMinutes(meters: number, avgSpeedKmh = 22): number {
  if (meters <= 60) return 0;
  const speedMps = (avgSpeedKmh * 1000) / 3600;
  const seconds = meters / speedMps;
  return Math.max(1, Math.ceil(seconds / 60));
}

/**
 * Generates realistic curved road coordinates between two points as a fallback.
 */
export function generateCurvedRoute(
  from: [number, number],
  to: [number, number],
  numPoints = 24
): [number, number][] {
  const points: [number, number][] = [];
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  // Midpoint with slight perpendicular displacement to simulate road curves
  const midLat = (lat1 + lat2) / 2 + (lng2 - lng1) * 0.15;
  const midLng = (lng1 + lng2) / 2 - (lat2 - lat1) * 0.15;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic Bezier curve
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * midLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * midLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
}

/**
 * Fetches real street driving route from OSRM with bezier fallback.
 */
export async function fetchDrivingRoute(
  from: [number, number],
  to: [number, number]
): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0 && data.routes[0].geometry?.coordinates) {
        return data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        );
      }
    }
  } catch {
    // Network timeout or offline - seamlessly fall back to curve
  }
  return generateCurvedRoute(from, to);
}

/**
 * Retrieves the current live tracking state for a request.
 */
export function getTrackingState(requestId: string): LiveTrackingState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${requestId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/**
 * Persists and broadcasts tracking updates across tabs and listeners.
 */
export function saveTrackingState(state: LiveTrackingState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${state.requestId}`, JSON.stringify(state));

    // 1. BroadcastChannel API for multi-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: 'TRACKING_UPDATE', state });
      bc.close();
    }

    // 2. Window Custom Event for in-page instant sync
    window.dispatchEvent(
      new CustomEvent('scrapmax:tracking_update', { detail: state })
    );
  } catch (err) {
    console.warn('Error saving tracking state:', err);
  }
}

/**
 * Initializes or gets the tracking state for a request.
 */
export async function initializeTrackingState(params: {
  requestId: string;
  householdPos: [number, number];
  collectorPos?: [number, number];
  householdName?: string;
  householdPhone?: string;
  householdAddress?: string;
  householdLandmark?: string;
  collectorName?: string;
  collectorPhone?: string;
}): Promise<LiveTrackingState> {
  const existing = getTrackingState(params.requestId);
  if (existing) return existing;

  // Default collector starting position ~1.8km away if not provided
  const collectorPos: [number, number] = params.collectorPos || [
    params.householdPos[0] + 0.012,
    params.householdPos[1] - 0.014,
  ];

  const routeCoordinates = await fetchDrivingRoute(collectorPos, params.householdPos);
  const distanceMeters = calculateDistanceMeters(
    collectorPos[0],
    collectorPos[1],
    params.householdPos[0],
    params.householdPos[1]
  );
  const etaMinutes = estimateEtaMinutes(distanceMeters);

  // Generate a consistent 4-digit pickup PIN for safety verification
  const pickupPin = String(
    (Math.abs(
      params.requestId
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 1000)
    ) %
      9000) +
      1000
  );

  const newState: LiveTrackingState = {
    requestId: params.requestId,
    collectorPos,
    householdPos: params.householdPos,
    routeCoordinates,
    distanceMeters,
    etaMinutes,
    isNearDoorstep: distanceMeters <= 300,
    hasArrived: distanceMeters <= 40,
    status: 'accepted',
    lastUpdated: new Date().toISOString(),
    collectorName: params.collectorName || 'Ramesh Kumar (Verified Kabadiwala)',
    collectorPhone: params.collectorPhone || '+91 98201 45892',
    householdName: params.householdName || 'Aarav Sharma',
    householdPhone: params.householdPhone || '+91 98201 54321',
    householdAddress: params.householdAddress || 'Main Market Road, Near City Center',
    householdLandmark: params.householdLandmark || 'Opposite Green Park Gate #2',
    pickupPin,
  };

  saveTrackingState(newState);
  return newState;
}

/**
 * Returns the 4-digit doorstep safety OTP for a request.
 */
export function getPickupOtp(requestId: string): string {
  const existing = getTrackingState(requestId);
  if (existing?.pickupPin) return existing.pickupPin;
  return String(
    (Math.abs(
      requestId
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 1000)
    ) %
      9000) +
      1000
  );
}

/**
 * Marks request as accepted in tracking service and synchronizes across all tabs.
 */
export function acceptPickupInTracking(
  requestId: string,
  collectorObj?: { full_name?: string; phone?: string }
): LiveTrackingState {
  const existing = getTrackingState(requestId);
  const collectorName = collectorObj?.full_name || 'Ramesh Kumar (Verified Kabadiwala)';
  const collectorPhone = collectorObj?.phone || '+91 98201 45892';

  let updated: LiveTrackingState;
  if (existing) {
    updated = {
      ...existing,
      status: 'accepted',
      collectorName,
      collectorPhone,
      lastUpdated: new Date().toISOString(),
    };
  } else {
    const householdPos: [number, number] = [19.076, 72.8777];
    const collectorPos: [number, number] = [19.076 + 0.012, 72.8777 - 0.014];
    const distanceMeters = calculateDistanceMeters(
      collectorPos[0],
      collectorPos[1],
      householdPos[0],
      householdPos[1]
    );
    updated = {
      requestId,
      collectorPos,
      householdPos,
      routeCoordinates: generateCurvedRoute(collectorPos, householdPos),
      distanceMeters,
      etaMinutes: estimateEtaMinutes(distanceMeters),
      isNearDoorstep: false,
      hasArrived: false,
      status: 'accepted',
      lastUpdated: new Date().toISOString(),
      collectorName,
      collectorPhone,
      householdName: 'Aarav Sharma',
      householdPhone: '+91 98201 54321',
      householdAddress: 'Flat 402, Green Heights, Main Market Road',
      pickupPin: getPickupOtp(requestId),
    };
  }

  saveTrackingState(updated);

  // Sync to local_pickup_requests in localStorage
  try {
    const raw = localStorage.getItem('local_pickup_requests');
    if (raw) {
      const list = JSON.parse(raw);
      const idx = list.findIndex((r: any) => r.id === requestId);
      if (idx >= 0) {
        list[idx].status = 'accepted';
        list[idx].collector_id = 'collector-c201';
        list[idx].collector = {
          id: 'collector-c201',
          full_name: collectorName,
          phone: collectorPhone,
          role: 'collector',
          rating: 4.9,
          completed_pickups: 126,
        };
        localStorage.setItem('local_pickup_requests', JSON.stringify(list));
      }
    }
  } catch {}

  triggerCollectorAcceptedNotification(collectorName);
  return updated;
}

/**
 * Subscribes to live tracking state updates across all tabs.
 */
export function subscribeToTracking(
  requestId: string,
  callback: (state: LiveTrackingState) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // CustomEvent listener
  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<LiveTrackingState>;
    if (customEvent.detail && customEvent.detail.requestId === requestId) {
      callback(customEvent.detail);
    }
  };
  window.addEventListener('scrapmax:tracking_update', handleCustomEvent);

  // Storage listener for cross-tab sync
  const handleStorage = (e: StorageEvent) => {
    if (e.key === `${STORAGE_PREFIX}${requestId}` && e.newValue) {
      try {
        const state = JSON.parse(e.newValue);
        callback(state);
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorage);

  // BroadcastChannel listener
  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (event) => {
      if (event.data?.type === 'TRACKING_UPDATE' && event.data.state?.requestId === requestId) {
        callback(event.data.state);
      }
    };
  }

  return () => {
    window.removeEventListener('scrapmax:tracking_update', handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
    if (bc) bc.close();
  };
}

/**
 * Starts continuous realistic route drive simulation towards the household.
 */
export function startRouteSimulation(
  requestId: string,
  options?: {
    speedMs?: number;
    onUpdate?: (state: LiveTrackingState) => void;
    onArrived?: (state: LiveTrackingState) => void;
  }
): void {
  stopRouteSimulation(requestId);

  const state = getTrackingState(requestId);
  if (!state) return;

  const route = state.routeCoordinates;
  if (!route || route.length < 2) return;

  // Find current closest index on the route
  let currentIndex = 0;
  let minDistance = Infinity;
  for (let i = 0; i < route.length; i++) {
    const d = calculateDistanceMeters(
      state.collectorPos[0],
      state.collectorPos[1],
      route[i][0],
      route[i][1]
    );
    if (d < minDistance) {
      minDistance = d;
      currentIndex = i;
    }
  }

  // If already at the end, restart from beginning
  if (currentIndex >= route.length - 1) {
    currentIndex = 0;
  }

  let wasNearNotified = state.isNearDoorstep;
  const intervalMs = options?.speedMs || 1500;

  const timer = setInterval(() => {
    currentIndex++;

    if (currentIndex >= route.length) {
      // Reached doorstep!
      stopRouteSimulation(requestId);
      const finalPos = route[route.length - 1];
      const updated: LiveTrackingState = {
        ...state,
        collectorPos: finalPos,
        distanceMeters: 0,
        etaMinutes: 0,
        isNearDoorstep: true,
        hasArrived: true,
        status: 'in_progress',
        lastUpdated: new Date().toISOString(),
      };
      saveTrackingState(updated);
      triggerCollectorNearNotification(0);
      options?.onUpdate?.(updated);
      options?.onArrived?.(updated);
      return;
    }

    const nextPos = route[currentIndex];
    const dist = calculateDistanceMeters(
      nextPos[0],
      nextPos[1],
      state.householdPos[0],
      state.householdPos[1]
    );
    const eta = estimateEtaMinutes(dist);
    const isNear = dist <= 300;

    // Trigger Doorstep Notification on crossing the 300m threshold
    if (isNear && !wasNearNotified) {
      wasNearNotified = true;
      triggerCollectorNearNotification(dist);
    }

    const updated: LiveTrackingState = {
      ...state,
      collectorPos: nextPos,
      distanceMeters: dist,
      etaMinutes: eta,
      isNearDoorstep: isNear,
      hasArrived: dist <= 40,
      status: 'in_progress',
      lastUpdated: new Date().toISOString(),
    };

    saveTrackingState(updated);
    options?.onUpdate?.(updated);
  }, intervalMs);

  activeSimulations.set(requestId, timer);
}

/**
 * Stops any running simulation for this request.
 */
export function stopRouteSimulation(requestId: string): void {
  const timer = activeSimulations.get(requestId);
  if (timer) {
    clearInterval(timer);
    activeSimulations.delete(requestId);
  }
}

/**
 * Checks if a simulation is running.
 */
export function isSimulationRunning(requestId: string): boolean {
  return activeSimulations.has(requestId);
}

/**
 * Marks that the collector has physically arrived at the household doorstep.
 */
export function markArrivedAtDoorstep(requestId: string): LiveTrackingState | null {
  stopRouteSimulation(requestId);
  const state = getTrackingState(requestId);
  if (!state) return null;

  const updated: LiveTrackingState = {
    ...state,
    collectorPos: state.householdPos,
    distanceMeters: 0,
    etaMinutes: 0,
    isNearDoorstep: true,
    hasArrived: true,
    status: 'in_progress',
    lastUpdated: new Date().toISOString(),
  };

  saveTrackingState(updated);
  triggerCollectorNearNotification(0);
  return updated;
}

/**
 * Marks the deal and payment as successfully completed.
 * Synchronizes status across collector and household.
 */
export function completeTrackingPayment(
  requestId: string,
  paymentDetails: any
): LiveTrackingState | null {
  stopRouteSimulation(requestId);
  const state = getTrackingState(requestId);
  if (!state) return null;

  const updated: LiveTrackingState = {
    ...state,
    status: 'completed',
    payment: paymentDetails,
    hasArrived: true,
    lastUpdated: new Date().toISOString(),
  };

  saveTrackingState(updated);

  // Sync to local_pickup_requests
  try {
    const raw = localStorage.getItem('local_pickup_requests');
    if (raw) {
      const list = JSON.parse(raw);
      const idx = list.findIndex((r: any) => r.id === requestId);
      if (idx >= 0) {
        list[idx].status = 'completed';
        list[idx].payment = paymentDetails;
        localStorage.setItem('local_pickup_requests', JSON.stringify(list));
      }
    }
  } catch {}

  // Trigger audio chime & notifications
  if (paymentDetails) {
    triggerPaymentReceivedNotification(
      paymentDetails.totalAmount || 0,
      paymentDetails.method?.toUpperCase() || 'UPI'
    );
  }
  triggerPickupCompletedNotification();

  return updated;
}
