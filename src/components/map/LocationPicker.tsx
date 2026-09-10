'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import MapContainer from './MapContainer';
import { fetchNearbyKabadiwalas } from '@/lib/kabadiwala-service';
import { NearbyKabadiwala } from '@/types';
import { Navigation, Search, MapPin, Check, Truck, Phone, Star, Loader2, Compass, ExternalLink } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  defaultLat?: number;
  defaultLng?: number;
  defaultAddress?: string;
}

export default function LocationPicker({
  onLocationSelect,
  defaultLat = 19.0760,
  defaultLng = 72.8777,
  defaultAddress = '',
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([defaultLat, defaultLng]);
  const [address, setAddress] = useState<string>(defaultAddress);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Nearby Kabadiwalas state & material filter
  const [nearbyKabadiwalas, setNearbyKabadiwalas] = useState<NearbyKabadiwala[]>([]);
  const [isLoadingKabadi, setIsLoadingKabadi] = useState<boolean>(false);
  const [showKabadiwalas, setShowKabadiwalas] = useState<boolean>(false);
  const [selectedKabadi, setSelectedKabadi] = useState<NearbyKabadiwala | null>(null);
  const [materialFilter, setMaterialFilter] = useState<string>('All');

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
        loadNearbyKabadiwalas(lat, lng, data.display_name);
      } else {
        const fallbackStr = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        setAddress(fallbackStr);
        onLocationSelect(lat, lng, fallbackStr);
        loadNearbyKabadiwalas(lat, lng, fallbackStr);
      }
    } catch {
      const fallbackStr = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      setAddress(fallbackStr);
      onLocationSelect(lat, lng, fallbackStr);
      loadNearbyKabadiwalas(lat, lng, fallbackStr);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    fetchAddress(lat, lng);
  };

  // Browser HTML5 Geolocation API
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
        console.warn('GPS notice:', err);
        alert('Could not retrieve GPS location. Please search your area or click on the map.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Nominatim Address Search for ANY locality across India
  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', India'
        )}&countrycodes=in&limit=1`,
        { headers: { 'User-Agent': 'ScrapMax-India-App/1.0' } }
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        setPosition([lat, lng]);
        setAddress(first.display_name);
        onLocationSelect(lat, lng, first.display_name);
        // Automatically load and display scrap dealers for this searched location
        loadNearbyKabadiwalas(lat, lng, first.display_name);
      } else {
        alert('No location results found for that area in India. Please check the spelling.');
      }
    } catch (err) {
      console.warn('Search notice:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch nearby authentic scrap dealers dynamically tailored to current location
  const loadNearbyKabadiwalas = async (
    lat = position[0],
    lng = position[1],
    addrHint = address
  ) => {
    setIsLoadingKabadi(true);
    setShowKabadiwalas(true);
    try {
      const results = await fetchNearbyKabadiwalas(lat, lng, 5000, addrHint);
      setNearbyKabadiwalas(results);
      if (results.length > 0) {
        setSelectedKabadi(results[0]);
      }
    } catch (err) {
      console.warn('Kabadiwala search notice:', err);
    } finally {
      setIsLoadingKabadi(false);
    }
  };

  const handleSelectDealer = (dealer: NearbyKabadiwala) => {
    setSelectedKabadi(dealer);
    setPosition([dealer.latitude, dealer.longitude]);
  };

  return (
    <div className="space-y-3.5">
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleGPSDetect}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
        </button>
      </div>

      {/* Action Strip: Find Nearby Kabadiwalas Toggle */}
      <div className="flex items-center justify-between p-2.5 bg-[#F4FAF6] border border-[#A6D5B8] rounded-xl text-xs">
        <div className="flex items-center gap-2 text-[#136B3B] font-bold">
          <Truck className="w-4 h-4" />
          <span>Nearby Kabadiwalas & Scrap Centers</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!showKabadiwalas) {
              loadNearbyKabadiwalas(position[0], position[1], address);
            } else {
              setShowKabadiwalas(false);
            }
          }}
          disabled={isLoadingKabadi}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] active:bg-[#0C4425] text-white font-bold rounded-lg transition shadow-2xs"
        >
          {isLoadingKabadi ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning OSM...</span>
            </>
          ) : showKabadiwalas ? (
            <>
              <span>Hide Dealers</span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5" />
              <span>Find Nearby</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Leaflet Map with Kabadiwala Pins */}
      <MapContainer
        center={position}
        selectedPos={position}
        onSelectPos={handleMapClick}
        nearbyKabadiwalas={showKabadiwalas ? nearbyKabadiwalas : []}
        onSelectKabadiwala={handleSelectDealer}
        zoom={14}
        className="h-[320px] w-full"
      />

      {/* Nearby Kabadiwalas Section (When Active) */}
      {showKabadiwalas && (
        <div className="space-y-2.5 pt-1 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#191C1E] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              Nearby Scrap Centers (within 5 km)
            </span>
            <Link
              href="/stores"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#136B3B] hover:underline"
            >
              <span>Full Store Map</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Quick Material Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
            {['All', 'Paper', 'Plastic', 'Metal', 'E-Waste', 'Batteries'].map((mat) => (
              <button
                key={mat}
                type="button"
                onClick={() => setMaterialFilter(mat)}
                className={`px-2.5 py-1 rounded-lg border transition flex-shrink-0 ${
                  materialFilter === mat
                    ? 'bg-[#136B3B] text-white border-[#136B3B]'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {mat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-0.5">
            {nearbyKabadiwalas
              .filter((d) => {
                if (materialFilter === 'All') return true;
                const matLower = materialFilter.toLowerCase();
                return d.acceptedMaterials?.some((m) => m.toLowerCase().includes(matLower));
              })
              .map((dealer) => {
                const isSelected = selectedKabadi?.id === dealer.id;
                return (
                  <div
                    key={dealer.id}
                    onClick={() => handleSelectDealer(dealer)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-50/70 border-[#136B3B] shadow-2xs ring-1 ring-[#136B3B]'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="font-extrabold text-xs text-[#191C1E] leading-tight">
                            {dealer.name}
                          </h5>
                          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-[#136B3B] bg-[#E6F4EA] px-1.5 py-0.2 rounded">
                            🛡️ Verified
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] mt-1 leading-snug">
                          {dealer.address}
                        </p>
                      </div>
                      {dealer.distanceKm !== undefined && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-[#136B3B] flex-shrink-0">
                          {dealer.distanceKm} km
                        </span>
                      )}
                    </div>

                    {/* Materials tags if available */}
                    {dealer.acceptedMaterials && dealer.acceptedMaterials.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {dealer.acceptedMaterials.slice(0, 3).map((m, mIdx) => (
                          <span
                            key={mIdx}
                            className="text-[9.5px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-gray-100 text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold text-amber-600">
                        <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                        <span>{dealer.rating || 4.8}</span>
                        <span className="text-gray-400 font-normal text-[10px]">⚖️ Digital Scale</span>
                      </div>

                      {dealer.phone && (
                        <a
                          href={`tel:${dealer.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#136B3B] hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call Dealer</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Selected Address Box */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-3">
        <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Confirmed Pickup Address
          </p>
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
