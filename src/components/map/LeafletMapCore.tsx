'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import {
  fixLeafletIcon,
  householdLocationIcon,
  collectorLocationIcon,
  kabadiwalaLocationIcon,
} from '@/lib/leaflet/icon-fix';
import { PickupRequest, NearbyKabadiwala } from '@/types';

interface MapCoreProps {
  center: [number, number];
  zoom?: number;
  selectedPos?: [number, number] | null;
  onSelectPos?: (lat: number, lng: number) => void;
  requests?: PickupRequest[];
  onSelectRequest?: (req: PickupRequest) => void;
  collectorPos?: [number, number] | null;
  nearbyKabadiwalas?: NearbyKabadiwala[];
  onSelectKabadiwala?: (k: NearbyKabadiwala) => void;
  className?: string;
}

function ClickHandler({ onSelectPos }: { onSelectPos?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onSelectPos) {
        onSelectPos(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapViewController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (map && map.getContainer()) {
      try {
        // Use animate: false to prevent PosAnimation race conditions on unmount
        map.setView(center, map.getZoom(), { animate: false });
      } catch {
        // Suppress teardown errors
      }
    }
  }, [center, map]);
  return null;
}

export default function LeafletMapCore({
  center,
  zoom = 13,
  selectedPos,
  onSelectPos,
  requests = [],
  onSelectRequest,
  collectorPos,
  nearbyKabadiwalas = [],
  onSelectKabadiwala,
  className = 'h-[400px] w-full',
}: MapCoreProps) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-inner border border-slate-800 ${className}`}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
        {/* Free OpenStreetMap Tiles - No API Key Required */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController center={center} />
        <ClickHandler onSelectPos={onSelectPos} />

        {/* Selected Marker for Household Location Pickup selection */}
        {selectedPos && (
          <Marker position={selectedPos} icon={householdLocationIcon}>
            <Popup autoPan={false}>
              <div className="text-xs font-semibold p-1">
                📌 Your Pickup Pin<br />
                Lat: {selectedPos[0].toFixed(4)}, Lng: {selectedPos[1].toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Collector Live Position Marker */}
        {collectorPos && (
          <Marker position={collectorPos} icon={collectorLocationIcon}>
            <Popup autoPan={false}>
              <div className="text-xs font-semibold p-1 text-blue-600">
                🚚 Collector Live Location
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Kabadiwalas & Scrap Centers Markers */}
        {nearbyKabadiwalas.map((kabadi) => (
          <Marker
            key={kabadi.id}
            position={[kabadi.latitude, kabadi.longitude]}
            icon={kabadiwalaLocationIcon}
            eventHandlers={{
              click: () => onSelectKabadiwala && onSelectKabadiwala(kabadi),
            }}
          >
            <Popup autoPan={false}>
              <div className="text-xs p-1.5 space-y-1.5 min-w-[180px]">
                <div className="flex items-start justify-between gap-1">
                  <p className="font-bold text-[#191C1E] text-xs leading-snug">{kabadi.name}</p>
                  {kabadi.distanceKm !== undefined && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {kabadi.distanceKm} km
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#526056] leading-tight">{kabadi.address}</p>
                {kabadi.rating && (
                  <p className="text-[11px] font-bold text-amber-600">★ {kabadi.rating} Rated Dealer</p>
                )}
                {kabadi.acceptedMaterials && kabadi.acceptedMaterials.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {kabadi.acceptedMaterials.slice(0, 3).map((mat, mIdx) => (
                      <span
                        key={mIdx}
                        className="text-[9.5px] bg-[#EAF5EE] text-[#136B3B] px-1.5 py-0.5 rounded font-semibold"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                )}
                {kabadi.phone && (
                  <a
                    href={`tel:${kabadi.phone}`}
                    className="mt-1 inline-flex items-center justify-center gap-1 w-full py-1 bg-[#136B3B] hover:bg-[#0F5730] text-white text-[10px] font-bold rounded-lg transition"
                  >
                    📞 Call {kabadi.phone}
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Multiple Request Markers for Collector Map View */}
        {requests.map((req) => (
          <Marker
            key={req.id}
            position={[req.latitude, req.longitude]}
            icon={householdLocationIcon}
            eventHandlers={{
              click: () => onSelectRequest && onSelectRequest(req),
            }}
          >
            <Popup autoPan={false}>
              <div className="text-xs p-1 space-y-1">
                <p className="font-bold text-slate-900">{req.address}</p>
                <p className="text-emerald-600 font-semibold">Status: {req.status.toUpperCase()}</p>
                <p className="text-slate-600">Est Weight: {req.total_estimated_weight_kg || 5} kg</p>
                {onSelectRequest && (
                  <button
                    onClick={() => onSelectRequest(req)}
                    className="mt-1 px-2 py-1 bg-emerald-600 text-white rounded font-bold w-full text-center"
                  >
                    View Pickup Details
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
