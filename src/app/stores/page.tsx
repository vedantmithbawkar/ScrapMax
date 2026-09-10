'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import StoreMapContainer from '@/components/map/StoreMapContainer';
import {
  BASE_RECYCLING_STORES,
  RecyclingStore,
  StoreMaterial,
  MATERIAL_CHIPS,
  filterRecyclingStores,
  isStoreOpenNow,
} from '@/lib/recycling-store-service';
import {
  Search,
  Navigation,
  Star,
  Phone,
  Clock,
  ShieldCheck,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  PlusCircle,
  X,
  ExternalLink,
  Store,
} from 'lucide-react';

export default function RecyclingStoreMapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<StoreMaterial[]>([]);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'nearest' | 'highest_rated'>('nearest');
  const [userLocation, setUserLocation] = useState<[number, number]>([12.9716, 77.5946]); // Bangalore city center
  const [selectedStore, setSelectedStore] = useState<RecyclingStore | null>(
    BASE_RECYCLING_STORES[0]
  );
  const [isLocating, setIsLocating] = useState(false);
  const [mobileView, setMobileView] = useState<'both' | 'map' | 'list'>('both');

  // Filtered and sorted stores
  const filteredStores = useMemo(() => {
    return filterRecyclingStores(BASE_RECYCLING_STORES, {
      searchQuery,
      selectedMaterials,
      openNowOnly,
      sortBy,
      userLocation,
    });
  }, [searchQuery, selectedMaterials, openNowOnly, sortBy, userLocation]);

  // Handle GPS detection
  const handleGPSDetect = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS detection notice:', err);
        alert('Could not retrieve your GPS location. Showing default city center.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Toggle material filter
  const toggleMaterial = (mat: StoreMaterial) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  // Clear all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMaterials([]);
    setOpenNowOnly(false);
    setSortBy('nearest');
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedMaterials.length > 0 ||
    openNowOnly ||
    sortBy !== 'nearest';

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full flex flex-col space-y-4">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
                <Store className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#191C1E] tracking-tight">
                Recycling Stores & Scrap Centers
              </h1>
            </div>
            <p className="text-xs text-[#526056] mt-1">
              Find verified local kabadiwalas, e-waste drop-offs, and circular recycling hubs near you.
            </p>
          </div>

          {/* Quick Book Doorstep Pickup CTA */}
          <Link
            href="/household/request-pickup"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-full shadow-xs transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book Doorstep Pickup</span>
          </Link>
        </div>

        {/* Search, GPS, and Toolbar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          
          {/* Top Row: Search Input + GPS Button */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by store name, landmark, address, or material..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-[#136B3B] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleGPSDetect}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#E6F4EA] hover:bg-[#D4EDDC] text-[#136B3B] border border-[#A6D5B8] rounded-xl text-xs font-bold transition flex-shrink-0"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting GPS...' : 'Use My GPS'}</span>
            </button>
          </div>

          {/* Material Filters Chips */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider px-0.5">
              <span>Filter by Material</span>
              {selectedMaterials.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMaterials([])}
                  className="text-[#136B3B] hover:underline normal-case font-semibold"
                >
                  Clear materials
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedMaterials([])}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex-shrink-0 ${
                  selectedMaterials.length === 0
                    ? 'bg-[#191C1E] text-white border-[#191C1E]'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                All Materials
              </button>

              {MATERIAL_CHIPS.map((chip) => {
                const isActive = selectedMaterials.includes(chip.id);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => toggleMaterial(chip.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition flex-shrink-0 ${
                      isActive
                        ? chip.activeColor
                        : `${chip.color} hover:opacity-90`
                    }`}
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Controls: Open Now Toggle, Sort Selector, and Clear Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-gray-100 text-xs">
            
            <div className="flex items-center gap-2">
              {/* Open Now Toggle */}
              <button
                type="button"
                onClick={() => setOpenNowOnly(!openNowOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition ${
                  openNowOnly
                    ? 'bg-emerald-50 text-[#136B3B] border-emerald-300 shadow-2xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    openNowOnly ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                  }`}
                />
                <span>Open Now</span>
              </button>

              {/* Sort by Nearest / Highest-rated */}
              <div className="inline-flex items-center rounded-xl bg-gray-100 p-0.5 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setSortBy('nearest')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition ${
                    sortBy === 'nearest'
                      ? 'bg-white text-[#191C1E] shadow-2xs font-extrabold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <MapPin className="w-3 h-3 text-[#136B3B]" />
                  <span>Nearest</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('highest_rated')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition ${
                    sortBy === 'highest_rated'
                      ? 'bg-white text-[#191C1E] shadow-2xs font-extrabold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Highest-rated</span>
                </button>
              </div>
            </div>

            {/* Match Counter & Reset */}
            <div className="flex items-center gap-3">
              <span className="text-gray-500 font-medium">
                <span className="font-extrabold text-[#191C1E]">{filteredStores.length}</span>{' '}
                stores found
              </span>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-rose-600 font-bold transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Mobile View Toggle Bar */}
        <div className="sm:hidden flex items-center p-1 bg-gray-200/80 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMobileView('both')}
            className={`flex-1 py-1.5 rounded-lg text-center transition ${
              mobileView === 'both' ? 'bg-white text-[#191C1E] shadow-2xs' : 'text-gray-600'
            }`}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className={`flex-1 py-1.5 rounded-lg text-center transition ${
              mobileView === 'map' ? 'bg-white text-[#191C1E] shadow-2xs' : 'text-gray-600'
            }`}
          >
            Map Only
          </button>
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className={`flex-1 py-1.5 rounded-lg text-center transition ${
              mobileView === 'list' ? 'bg-white text-[#191C1E] shadow-2xs' : 'text-gray-600'
            }`}
          >
            List Only
          </button>
        </div>

        {/* Split Grid: Map View (Left / Top) & Store Cards (Right / Bottom) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[550px]">
          
          {/* Interactive Map Pane (7 cols on desktop) */}
          <div
            className={`lg:col-span-7 bg-white p-2 rounded-2xl border border-gray-200 shadow-xs relative flex flex-col ${
              mobileView === 'list' ? 'hidden sm:flex' : 'flex'
            }`}
          >
            <StoreMapContainer
              stores={filteredStores}
              selectedStore={selectedStore}
              onSelectStore={(st) => setSelectedStore(st)}
              userLocation={userLocation}
              zoom={13}
              className="h-full min-h-[380px] lg:min-h-[520px] w-full rounded-xl"
            />
          </div>

          {/* Store List Pane (5 cols on desktop) */}
          <div
            className={`lg:col-span-5 flex flex-col space-y-3 ${
              mobileView === 'map' ? 'hidden sm:flex' : 'flex'
            }`}
          >
            
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                Verified Stores ({filteredStores.length})
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                Sorted by {sortBy === 'nearest' ? 'Distance' : 'Rating'}
              </span>
            </div>

            {/* Scrollable Store Cards */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[620px] pr-1">
              {filteredStores.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                    <Store className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#191C1E]">No recycling stores found</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Try removing some material filters or increasing your search radius.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                filteredStores.map((store) => {
                  const isSelected = selectedStore?.id === store.id;
                  const isOpen = isStoreOpenNow(store);

                  return (
                    <article
                      key={store.id}
                      onClick={() => setSelectedStore(store)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative ${
                        isSelected
                          ? 'bg-emerald-50/40 border-[#136B3B] shadow-md ring-1 ring-[#136B3B]'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Top Row: Store Name + Distance Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-sm text-[#191C1E] leading-snug">
                              {store.name}
                            </h3>
                            {store.verified && (
                              <span
                                title="Verified ScrapMax Partner"
                                className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-[#136B3B] bg-[#E6F4EA] px-1.5 py-0.5 rounded-md"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {store.address}
                          </p>
                        </div>

                        {store.distanceKm !== undefined && (
                          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-[#136B3B] flex-shrink-0">
                            {store.distanceKm} km
                          </span>
                        )}
                      </div>

                      {/* Middle Row: Rating + Open Hours Status */}
                      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-gray-100 text-xs">
                        <div className="flex items-center gap-1 font-bold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                          <span>{store.rating.toFixed(1)}</span>
                          <span className="text-gray-400 font-normal">({store.reviewCount} reviews)</span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            isOpen
                              ? 'bg-emerald-50 text-[#136B3B]'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {isOpen ? `Open now · Closes ${store.openingHoursText.split('–')[1]?.trim()}` : `Closed · ${store.openingHoursText}`}
                          </span>
                        </span>
                      </div>

                      {/* Material Tags */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {store.acceptedMaterials.map((mat) => {
                          const chip = MATERIAL_CHIPS.find((c) => c.id === mat);
                          return (
                            <span
                              key={mat}
                              className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${
                                chip ? chip.color : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              {chip?.icon} {mat}
                            </span>
                          );
                        })}
                      </div>

                      {/* Highlight Badge */}
                      {store.pricingBadge && (
                        <div className="mt-2 text-[11px] font-semibold text-[#136B3B] bg-[#E6F4EA]/60 px-2.5 py-1 rounded-lg inline-block">
                          🏷️ {store.pricingBadge}
                        </div>
                      )}

                      {/* Bottom Action Buttons */}
                      <div className="mt-3.5 pt-2.5 border-t border-gray-100 grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${store.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center gap-1.5 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl transition shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Dealer</span>
                        </a>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-gray-50 text-[#191C1E] border border-gray-200 text-xs font-bold rounded-xl transition"
                        >
                          <Navigation className="w-3.5 h-3.5 text-[#136B3B]" />
                          <span>Directions</span>
                        </a>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </main>

      <BottomNav role="household" />
    </div>
  );
}
