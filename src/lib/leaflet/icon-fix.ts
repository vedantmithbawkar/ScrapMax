import L from 'leaflet';

/**
 * Patches Leaflet DOM utilities and icon defaults to prevent:
 * 1. Missing marker icon 404s in Webpack / Next.js
 * 2. "Cannot read properties of undefined (reading '_leaflet_pos')" during unmount / animations
 */
export function fixLeafletIcon() {
  if (typeof window === 'undefined') return;

  // 1. Fix default marker icon paths
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  // 2. Prevent "Cannot read properties of undefined (reading '_leaflet_pos')"
  if (L.DomUtil) {
    const originalGetPosition = L.DomUtil.getPosition;
    L.DomUtil.getPosition = function (el: HTMLElement) {
      if (!el) {
        return new L.Point(0, 0);
      }
      try {
        return originalGetPosition ? originalGetPosition.call(this, el) : ((el as unknown as { _leaflet_pos?: L.Point })._leaflet_pos || new L.Point(0, 0));
      } catch {
        return new L.Point(0, 0);
      }
    };

    const originalSetPosition = L.DomUtil.setPosition;
    L.DomUtil.setPosition = function (el: HTMLElement, point: L.Point) {
      if (!el) return;
      try {
        if (originalSetPosition) {
          originalSetPosition.call(this, el, point);
        } else {
          (el as unknown as { _leaflet_pos?: L.Point })._leaflet_pos = point;
        }
      } catch {
        // Suppress teardown errors during unmount
      }
    };
  }
}

// Ensure patch is applied immediately on client load
if (typeof window !== 'undefined') {
  fixLeafletIcon();
}

export const householdLocationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const collectorLocationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const kabadiwalaLocationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

