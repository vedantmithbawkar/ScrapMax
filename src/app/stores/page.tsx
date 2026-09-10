'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  DEFAULT_CITY_COORDINATES,
  geocodeLocationInIndia,
  reverseGeocodeCoords,
  fetchLegitStoresForLocation,
  MAJOR_INDIAN_CITIES,
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
  Compass,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function RecyclingStoreMapPage() {
  const [storesData, setStoresData] = useState<RecyclingStore[]>(BASE_RECYCLING_STORES);
  const [locationInput, setLocationInput] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<StoreMaterial[]>([]);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'nearest' | 'highest_rated'>('nearest');
  const [cityFilter, setCityFilter] = useState<'mumbai' | 'bangalore' | 'all'>('mumbai');
  const [userLocation, setUserLocation] = useState<[number, number]>(
    DEFAULT_CITY_COORDINATES.mumbai // Defaults to Mulund West, Mumbai
  );
  const [selectedStore, setSelectedStore] = useState<RecyclingStore | null>(
    BASE_RECYCLING_STORES[0]
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatusText, setLocationStatusText] = useState<string>('Mulund, Mumbai (Default)');
  const [mobileView, setMobileView] = useState<'both' | 'map' | 'list'>('both');

  // Attempt automatic browser GPS detection on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation([latitude, longitude]);
          // Check if detected position is within Mulund / Mumbai eastern suburbs
          if (latitude >= 19.14 && latitude <= 19.22 && longitude >= 72.93 && longitude <= 72.98) {
            setCityFilter('mumbai');
            setLocationStatusText('Your GPS (Mulund, Mumbai)');
          } else {
            try {
              const localityName = await reverseGeocodeCoords(latitude, longitude);
              setLocationStatusText(`Your GPS: ${localityName}`);
              const nearbyStores = await fetchLegitStoresForLocation(latitude, longitude, localityName);
              if (nearbyStores.length > 0) {
                setStoresData(nearbyStores);
                setSelectedStore(nearbyStores[0]);
                setCityFilter('all');
              }
            } catch (err) {
              setLocationStatusText(`Your GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
            }
          }
        },
        () => {
          // Geolocation permission denied or timed out; Mulund, Mumbai remains active default
          setLocationStatusText('Mulund, Mumbai (Default)');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Filtered and sorted stores computed over active storesData
  const filteredStores = useMemo(() => {
    return filterRecyclingStores(storesData, {
      searchQuery,
      selectedMaterials,
      openNowOnly,
      sortBy,
      userLocation,
      city: cityFilter,
    });
  }, [storesData, searchQuery, selectedMaterials, openNowOnly, sortBy, userLocation, cityFilter]);

  // Handle nationwide Indian location search (e.g. Pune, Delhi, Powai, Thane, 411038)
  const handleLocationSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = locationInput.trim();
    if (!query) return;

    setIsSearchingLocation(true);
    try {
      const geoResult = await geocodeLocationInIndia(query);
      if (!geoResult) {
        alert(
          `Could not locate "${query}" in India. Please check the spelling or try searching a nearby city, area or PIN code.`
        );
        setIsSearchingLocation(false);
        return;
      }

      const { name, latitude, longitude } = geoResult;
      setUserLocation([latitude, longitude]);
      setLocationStatusText(name);
      setCityFilter('all');

      // Fetch authentic, legit scrap dealers & recycling centers for this Indian location
      const legitStores = await fetchLegitStoresForLocation(latitude, longitude, name);
      if (legitStores && legitStores.length > 0) {
        setStoresData(legitStores);
        setSelectedStore(legitStores[0]);
      } else {
        setStoresData(BASE_RECYCLING_STORES);
      }
    } catch (err) {
      console.error('Error finding location:', err);
      alert('Could not complete location search. Please try again.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Handle manual GPS detection button click
  const handleGPSDetect = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setCityFilter('all');
        try {
          const localityName = await reverseGeocodeCoords(latitude, longitude);
          setLocationStatusText(`Live GPS: ${localityName}`);
          setLocationInput(localityName);
          const legitStores = await fetchLegitStoresForLocation(latitude, longitude, localityName);
          if (legitStores && legitStores.length > 0) {
            setStoresData(legitStores);
            setSelectedStore(legitStores[0]);
          }
        } catch (err) {
          setLocationStatusText(`Live GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('GPS detection notice:', err);
        alert('Could not retrieve your GPS location. You can search any Indian city or area in the search bar.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Switch City Quick Pill
  const switchCity = async (cityKey: string) => {
    if (cityKey === 'mumbai') {
      setCityFilter('mumbai');
      setUserLocation(DEFAULT_CITY_COORDINATES.mumbai);
      setLocationStatusText('Mulund, Mumbai');
      setLocationInput('');
      setStoresData(BASE_RECYCLING_STORES);
      const firstMum = BASE_RECYCLING_STORES.find((s) => s.city === 'mumbai');
      if (firstMum) setSelectedStore(firstMum);
      return;
    }

    if (cityKey === 'bangalore') {
      setCityFilter('bangalore');
      setUserLocation(DEFAULT_CITY_COORDINATES.bangalore);
      setLocationStatusText('Bangalore City Center');
      setLocationInput('');
      setStoresData(BASE_RECYCLING_STORES);
      const firstBlr = BASE_RECYCLING_STORES.find((s) => s.city === 'bangalore');
      if (firstBlr) setSelectedStore(firstBlr);
      return;
    }

    if (cityKey === 'all') {
      setCityFilter('all');
      setLocationStatusText('All India Verified Centers');
      setStoresData(BASE_RECYCLING_STORES);
      return;
    }

    const preset = MAJOR_INDIAN_CITIES[cityKey];
    if (preset) {
      setIsSearchingLocation(true);
      setCityFilter('all');
      setUserLocation(preset.coords);
      setLocationStatusText(`${preset.name}, ${preset.state}`);
      setLocationInput(preset.name);
      try {
        const stores = await fetchLegitStoresForLocation(preset.coords[0], preset.coords[1], preset.name);
        setStoresData(stores);
        if (stores.length > 0) setSelectedStore(stores[0]);
      } catch (err) {
        console.warn('City switch notice:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }
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
    setLocationInput('');
    setSelectedMaterials([]);
    setOpenNowOnly(false);
    setSortBy('nearest');
    setCityFilter('mumbai');
    setUserLocation(DEFAULT_CITY_COORDINATES.mumbai);
    setLocationStatusText('Mulund, Mumbai (Default)');
    setStoresData(BASE_RECYCLING_STORES);
    setSelectedStore(BASE_RECYCLING_STORES[0]);
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    locationInput.trim().length > 0 ||
    selectedMaterials.length > 0 ||
    openNowOnly ||
    sortBy !== 'nearest' ||
    cityFilter !== 'mumbai';

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
                Recycling Stores & Legit Scrap Dealers
              </h1>
            </div>
            <p className="text-xs text-[#526056] mt-1">
              Locate authorized kabadiwalas, certified digital scale scrap yards, and recycling centers across India.
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
          
          {/* Row 1: Nationwide Location Search Bar + GPS Button */}
          <form onSubmit={handleLocationSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-[#136B3B] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Search any city, area, or PIN code in India (e.g. Pune, Delhi, Powai, Thane, 400080)..."
                className="w-full pl-10 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-[#136B3B] focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={isSearchingLocation || !locationInput.trim()}
                className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                {isSearchingLocation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Find</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleGPSDetect}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#E6F4EA] hover:bg-[#D4EDDC] text-[#136B3B] border border-[#A6D5B8] rounded-xl text-xs font-bold transition flex-shrink-0"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating GPS...' : 'Use My GPS'}</span>
            </button>
          </form>

          {/* Row 2: In-Store Material & Name Filter Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter dealers by shop name, material (e.g. Cardboard, Metal), or street..."
              className="w-full pl-10 pr-10 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-[#136B3B] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* City / Location Quick-Switcher Strip */}
          <div className="pt-2 pb-1 border-t border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">
                Popular Hubs:
              </span>
              <button
                type="button"
                onClick={() => switchCity('mumbai')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  cityFilter === 'mumbai'
                    ? 'bg-[#136B3B] text-white shadow-2xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span>📍</span>
                <span>Mulund / Mumbai</span>
              </button>
              <button
                type="button"
                onClick={() => switchCity('pune')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <span>📍</span>
                <span>Pune</span>
              </button>
              <button
                type="button"
                onClick={() => switchCity('delhi')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <span>📍</span>
                <span>Delhi NCR</span>
              </button>
              <button
                type="button"
                onClick={() => switchCity('bangalore')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  cityFilter === 'bangalore'
                    ? 'bg-[#136B3B] text-white shadow-2xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span>📍</span>
                <span>Bangalore</span>
              </button>
              <button
                type="button"
                onClick={() => switchCity('hyderabad')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <span>📍</span>
                <span>Hyderabad</span>
              </button>
              <button
                type="button"
                onClick={() => switchCity('jaipur')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <span>📍</span>
                <span>Jaipur</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#526056] bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1 rounded-xl self-start lg:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="font-semibold truncate max-w-xs sm:max-w-md">
                Active: {locationStatusText}
              </span>
            </div>
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

                      {/* Highlight Badge & Legitimacy Badges */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {store.pricingBadge && (
                          <div className="text-[10.5px] font-semibold text-[#136B3B] bg-[#E6F4EA]/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <span>🏷️</span>
                            <span>{store.pricingBadge}</span>
                          </div>
                        )}
                        <span className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <span>⚖️</span>
                          <span>Certified Digital Scale</span>
                        </span>
                      </div>

                      {store.notes && (
                        <p className="mt-1.5 text-[11px] text-gray-500 leading-snug line-clamp-2 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                          {store.notes}
                        </p>
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
