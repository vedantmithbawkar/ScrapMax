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

export const storeLocationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const activeStoreLocationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -40],
  shadowSize: [48, 48]
});

export const doorstepLocationIcon = typeof window !== 'undefined'
  ? L.divIcon({
      className: 'custom-doorstep-marker',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#136B3B;border:3px solid #ffffff;border-radius:50%;box-shadow:0 4px 14px rgba(19,107,59,0.5);color:white;font-size:20px;">🏠</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    })
  : ({} as L.DivIcon);

export const collectorTruckIcon = typeof window !== 'undefined'
  ? L.divIcon({
      className: 'custom-collector-truck-marker',
      html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:46px;height:46px;background:#0284C7;border:3px solid #ffffff;border-radius:50%;box-shadow:0 6px 18px rgba(2,132,199,0.55);color:white;font-size:22px;"><span style="position:absolute;inset:-6px;border-radius:50%;border:2px solid #0284C7;animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;opacity:0.75;"></span>🚚</div>`,
      iconSize: [46, 46],
      iconAnchor: [23, 23],
      popupAnchor: [0, -24],
    })
  : ({} as L.DivIcon);

export const collectorOriginIcon = typeof window !== 'undefined'
  ? L.divIcon({
      className: 'custom-collector-origin-marker',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;background:#4F46E5;border:3px solid #ffffff;border-radius:50%;box-shadow:0 4px 14px rgba(79,70,229,0.5);color:white;font-size:18px;">🏢</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -19],
    })
  : ({} as L.DivIcon);


