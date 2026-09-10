'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import {
  fixLeafletIcon,
  collectorLocationIcon,
  storeLocationIcon,
  activeStoreLocationIcon,
} from '@/lib/leaflet/icon-fix';
import { RecyclingStore, isStoreOpenNow } from '@/lib/recycling-store-service';
import { Star, Phone, Navigation, Clock, ShieldCheck } from 'lucide-react';

interface StoreMapCoreProps {
  stores: RecyclingStore[];
  selectedStore: RecyclingStore | null;
  onSelectStore: (store: RecyclingStore) => void;
  userLocation: [number, number];
  zoom?: number;
  className?: string;
}

function MapViewController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (map && map.getContainer()) {
      try {
        map.setView(center, zoom, { animate: true });
      } catch {
        // Suppress teardown errors
      }
    }
  }, [center, zoom, map]);
  return null;
}

export default function StoreMapCore({
  stores,
  selectedStore,
  onSelectStore,
  userLocation,
  zoom = 13,
  className = 'h-full w-full',
}: StoreMapCoreProps) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  const mapCenter: [number, number] = selectedStore
    ? [selectedStore.latitude, selectedStore.longitude]
    : userLocation;

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController center={mapCenter} zoom={selectedStore ? 15 : zoom} />

        {/* User GPS location pin */}
        <Marker position={userLocation} icon={collectorLocationIcon}>
          <Popup autoPan={false}>
            <div className="text-xs p-1">
              <span className="font-bold text-blue-600 flex items-center gap-1">
                📍 Your Location
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Lat: {userLocation[0].toFixed(4)}, Lng: {userLocation[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Recycling Store Markers */}
        {stores.map((store) => {
          const isSelected = selectedStore?.id === store.id;
          const isOpen = isStoreOpenNow(store);

          return (
            <Marker
              key={store.id}
              position={[store.latitude, store.longitude]}
              icon={isSelected ? activeStoreLocationIcon : storeLocationIcon}
              eventHandlers={{
                click: () => onSelectStore(store),
              }}
            >
              <Popup autoPan={false}>
                <div className="text-xs p-1.5 space-y-2 min-w-[210px] max-w-[250px]">
                  
                  {/* Store Header & Badge */}
                  <div className="flex items-start justify-between gap-1.5">
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="font-extrabold text-[#191C1E] text-[13px] leading-snug">
                          {store.name}
                        </h4>
                        {store.verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#136B3B] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-tight line-clamp-2">
                        {store.address}
                      </p>
                    </div>

                    {store.distanceKm !== undefined && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-[#136B3B] flex-shrink-0">
                        {store.distanceKm} km
                      </span>
                    )}
                  </div>

                  {/* Rating & Open Hours Badge */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-1 font-bold text-amber-600">
                      <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                      <span>{store.rating.toFixed(1)}</span>
                      <span className="text-gray-400 font-normal">({store.reviewCount})</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                        isOpen
                          ? 'bg-emerald-50 text-[#136B3B]'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{isOpen ? 'Open Now' : 'Closed'}</span>
                    </span>
                  </div>

                  {/* Accepted Materials Chips */}
                  <div className="flex flex-wrap gap-1">
                    {store.acceptedMaterials.map((mat) => (
                      <span
                        key={mat}
                        className="text-[9.5px] bg-gray-100 text-gray-700 font-semibold px-1.5 py-0.5 rounded"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <a
                      href={`tel:${store.phone}`}
                      className="inline-flex items-center justify-center gap-1 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] text-white text-[10.5px] font-bold rounded-lg transition"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10.5px] font-bold rounded-lg transition"
                    >
                      <Navigation className="w-3 h-3 text-[#136B3B]" />
                      <span>Directions</span>
                    </a>
                  </div>

                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
