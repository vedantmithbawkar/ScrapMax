'use client';

import React, { useState } from 'react';
import MapContainer from './MapContainer';
import { Navigation, Search, MapPin, Check } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  defaultLat?: number;
  defaultLng?: number;
  defaultAddress?: string;
}

export default function LocationPicker({
  onLocationSelect,
  defaultLat = 12.9716, // Default Bangalore / Jakarta center
  defaultLng = 77.5946,
  defaultAddress = '',
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([defaultLat, defaultLng]);
  const [address, setAddress] = useState<string>(defaultAddress);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Free OpenStreetMap Nominatim reverse geocoding
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        onLocationSelect(lat, lng, data.display_name);
      } else {
        const fallbackStr = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        setAddress(fallbackStr);
        onLocationSelect(lat, lng, fallbackStr);
      }
    } catch {
      const fallbackStr = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      setAddress(fallbackStr);
      onLocationSelect(lat, lng, fallbackStr);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    fetchAddress(lat, lng);
  };

  // Browser HTML5 Geolocation API (Zero API key)
  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        fetchAddress(latitude, longitude);
        setIsLocating(false);
      },
      (err) => {
        console.error('GPS error:', err);
        alert('Could not retrieve GPS location. Please click on the map to set your address.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Nominatim Address Search
  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        setPosition([lat, lng]);
        setAddress(first.display_name);
        onLocationSelect(lat, lng, first.display_name);
      } else {
        alert('No location results found for that address.');
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar & GPS Auto-Locate Button */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
              placeholder="Search area, landmark, or street name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold border border-slate-700 transition"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleGPSDetect}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-sm font-semibold transition"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'Use My Live GPS'}</span>
        </button>
      </div>

      {/* Interactive Leaflet Map */}
      <MapContainer
        center={position}
        selectedPos={position}
        onSelectPos={handleMapClick}
        zoom={15}
        className="h-[320px] w-full"
      />

      {/* Selected Address Box */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3">
        <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Confirmed Pickup Address</p>
          <p className="text-sm font-semibold text-slate-100 mt-0.5">
            {address || 'Click on the map or use GPS to select your pickup location'}
          </p>
        </div>
        {address && (
          <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full">
            <Check className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );
}
