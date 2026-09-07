'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { fixLeafletIcon, householdLocationIcon, collectorLocationIcon } from '@/lib/leaflet/icon-fix';
import { PickupRequest } from '@/types';

interface MapCoreProps {
  center: [number, number];
  zoom?: number;
  selectedPos?: [number, number] | null;
  onSelectPos?: (lat: number, lng: number) => void;
  requests?: PickupRequest[];
  onSelectRequest?: (req: PickupRequest) => void;
  collectorPos?: [number, number] | null;
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

export default function LeafletMapCore({
  center,
  zoom = 13,
  selectedPos,
  onSelectPos,
  requests = [],
  onSelectRequest,
  collectorPos,
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

        <ClickHandler onSelectPos={onSelectPos} />

        {/* Selected Marker for Household Location Pickup selection */}
        {selectedPos && (
          <Marker position={selectedPos} icon={householdLocationIcon}>
            <Popup>
              <div className="text-xs font-semibold p-1">
                📌 Pickup Location<br />
                Lat: {selectedPos[0].toFixed(4)}, Lng: {selectedPos[1].toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Collector Live Position Marker */}
        {collectorPos && (
          <Marker position={collectorPos} icon={collectorLocationIcon}>
            <Popup>
              <div className="text-xs font-semibold p-1 text-blue-600">
                🚚 Collector Live Location
              </div>
            </Popup>
          </Marker>
        )}

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
            <Popup>
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
