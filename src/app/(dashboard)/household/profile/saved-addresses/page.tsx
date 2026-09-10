'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { SavedAddress } from '@/types';
import { 
  ArrowLeft, 
  MapPin, 
  Plus, 
  Trash2, 
  Check, 
  Home, 
  Briefcase, 
  Navigation, 
  Edit3, 
  CheckCircle2, 
  X, 
  Loader2 
} from 'lucide-react';

const INITIAL_DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-001',
    label: 'Home',
    flat_building: 'Flat 402, Green Valley Apts',
    area_street: '100ft Road, Indiranagar',
    landmark: 'Near Metro Station',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560038',
    phone: '+91 98765 43210',
    is_default: true,
    latitude: 12.9784,
    longitude: 77.6408,
  },
  {
    id: 'addr-002',
    label: 'Work',
    flat_building: 'Floor 3, EcoTech Business Hub',
    area_street: 'Outer Ring Road, Bellandur',
    landmark: 'Opposite Central Mall',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560103',
    phone: '+91 98765 43210',
    is_default: false,
    latitude: 12.9298,
    longitude: 77.6834,
  },
];

export default function SavedAddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('aicle_saved_addresses');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_DEFAULT_ADDRESSES;
  });
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locatingGPS, setLocatingGPS] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal Form State
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [flatBuilding, setFlatBuilding] = useState('');
  const [areaStreet, setAreaStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [stateName, setStateName] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [isDefault, setIsDefault] = useState(false);

  const saveToStorage = (updatedList: SavedAddress[]) => {
    setAddresses(updatedList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aicle_saved_addresses', JSON.stringify(updatedList));
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map((addr) => ({
      ...addr,
      is_default: addr.id === id,
    }));
    saveToStorage(updated);
    showToast('Default pickup address updated.');
  };

  const handleDelete = (id: string) => {
    if (addresses.length <= 1) {
      alert('You must keep at least one saved address.');
      return;
    }
    const updated = addresses.filter((addr) => addr.id !== id);
    // If we deleted the default one, make the first one default
    if (!updated.some((a) => a.is_default)) {
      updated[0].is_default = true;
    }
    saveToStorage(updated);
    showToast('Address removed.');
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setLabel('Home');
    setFlatBuilding('');
    setAreaStreet('');
    setLandmark('');
    setCity('Bangalore');
    setStateName('Karnataka');
    setPincode('');
    setPhone('+91 98765 43210');
    setIsDefault(addresses.length === 0);
    setShowModal(true);
  };

  const handleOpenEditModal = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setLabel(addr.label);
    setFlatBuilding(addr.flat_building);
    setAreaStreet(addr.area_street);
    setLandmark(addr.landmark || '');
    setCity(addr.city);
    setStateName(addr.state);
    setPincode(addr.pincode);
    setPhone(addr.phone || '+91 98765 43210');
    setIsDefault(addr.is_default);
    setShowModal(true);
  };

  // GPS Auto-fill via HTML5 Geolocation & OpenStreetMap reverse geocoding
  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data && data.address) {
            const addrObj = data.address;
            setAreaStreet(addrObj.road || addrObj.suburb || addrObj.neighbourhood || 'Current Location Area');
            setCity(addrObj.city || addrObj.town || addrObj.county || 'Bangalore');
            setStateName(addrObj.state || 'Karnataka');
            if (addrObj.postcode) setPincode(addrObj.postcode);
            showToast('Address detected from GPS!');
          }
        } catch {
          setAreaStreet(`Near Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
        } finally {
          setLocatingGPS(false);
        }
      },
      () => {
        alert('Could not retrieve GPS location. Please enter manually.');
        setLocatingGPS(false);
      },
      { timeout: 10000 }
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatBuilding.trim() || !areaStreet.trim()) {
      alert('Please fill in Flat/Building and Area details.');
      return;
    }

    if (editingId) {
      // Update existing
      const updated = addresses.map((addr) => {
        if (addr.id === editingId) {
          return {
            ...addr,
            label,
            flat_building: flatBuilding.trim(),
            area_street: areaStreet.trim(),
            landmark: landmark.trim(),
            city: city.trim(),
            state: stateName.trim(),
            pincode: pincode.trim(),
            phone: phone.trim(),
            is_default: isDefault,
          };
        }
        return isDefault ? { ...addr, is_default: false } : addr;
      });
      saveToStorage(updated);
      showToast('Address updated successfully!');
    } else {
      // Add new
      const newAddr: SavedAddress = {
        id: `addr-${Date.now()}`,
        label,
        flat_building: flatBuilding.trim(),
        area_street: areaStreet.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        phone: phone.trim(),
        is_default: isDefault || addresses.length === 0,
      };

      let updated = [...addresses];
      if (newAddr.is_default) {
        updated = updated.map((a) => ({ ...a, is_default: false }));
      }
      updated.push(newAddr);
      saveToStorage(updated);
      showToast('New address saved!');
    }

    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />

      <main className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-3 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between pt-2 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/household/profile')}
              aria-label="Go back to Profile"
              className="p-2 -ml-2 rounded-xl bg-white border border-gray-200 text-[#191C1E] hover:bg-gray-50 transition shadow-2xs"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#191C1E] tracking-tight">Saved Addresses</h1>
              <p className="text-xs text-[#6B7280]">Manage doorstep pickup locations</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white rounded-xl text-xs font-bold transition shadow-xs touch-feedback"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New</span>
          </button>
        </header>

        {/* Notification Toast */}
        {notification && (
          <div className="mb-4 p-3.5 bg-[#E6F4EA] border border-[#A6D5B8] text-[#136B3B] rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-[#136B3B] flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Addresses List */}
        <div className="space-y-3.5 mt-2 flex-1">
          {addresses.map((addr) => {
            const IconComponent = addr.label === 'Home' ? Home : addr.label === 'Work' ? Briefcase : MapPin;
            return (
              <div
                key={addr.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition shadow-2xs relative ${
                  addr.is_default
                    ? 'border-[#A6D5B8] ring-2 ring-[#E6F4EA]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] flex-shrink-0 mt-0.5">
                      <IconComponent className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#191C1E]">{addr.label}</h3>
                        {addr.is_default && (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-[#E6F4EA] text-[#136B3B]">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#191C1E] leading-relaxed">
                        {addr.flat_building}, {addr.area_street}
                      </p>
                      {addr.landmark && (
                        <p className="text-[11.5px] text-[#6B7280]">
                          Landmark: {addr.landmark}
                        </p>
                      )}
                      <p className="text-[11.5px] text-[#6B7280]">
                        {addr.city}, {addr.state} {addr.pincode ? `- ${addr.pincode}` : ''}
                      </p>
                      {addr.phone && (
                        <p className="text-[11px] font-medium text-[#526056] pt-0.5">
                          📞 {addr.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown / Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(addr)}
                      title="Edit address"
                      className="p-1.5 text-gray-500 hover:text-[#136B3B] hover:bg-gray-100 rounded-lg transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      title="Delete address"
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Set Default Toggle Button */}
                {!addr.is_default && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Set as Default Pickup Address</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </main>

      {/* Add / Edit Address Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#191C1E]">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* GPS Auto-fill button */}
            <button
              type="button"
              onClick={handleGPSDetect}
              disabled={locatingGPS}
              className="w-full py-2.5 px-3 bg-[#E6F4EA] hover:bg-[#D8EFE0] text-[#136B3B] rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-[#A6D5B8] transition touch-feedback"
            >
              {locatingGPS ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locating via GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Auto-fill using Current GPS Location</span>
                </>
              )}
            </button>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              
              {/* Address Tag Selector */}
              <div>
                <label className="block text-xs font-bold text-[#191C1E] mb-1.5">Address Label</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setLabel(tag)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        label === tag
                          ? 'bg-[#136B3B] text-white border-[#136B3B]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flat / House */}
              <div>
                <label className="block text-xs font-bold text-[#191C1E] mb-1">House / Flat / Building *</label>
                <input
                  type="text"
                  required
                  value={flatBuilding}
                  onChange={(e) => setFlatBuilding(e.target.value)}
                  placeholder="e.g. Flat 301, Sunshine Heights"
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
                />
              </div>

              {/* Area / Street */}
              <div>
                <label className="block text-xs font-bold text-[#191C1E] mb-1">Street / Area / Colony *</label>
                <input
                  type="text"
                  required
                  value={areaStreet}
                  onChange={(e) => setAreaStreet(e.target.value)}
                  placeholder="e.g. 100 Feet Rd, HAL 2nd Stage"
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-xs font-bold text-[#191C1E] mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Indiranagar BDA Complex"
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
                />
              </div>

              {/* City & Pincode */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#191C1E] mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bangalore"
                    className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#191C1E] mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="560038"
                    className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-[#191C1E] mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
                />
              </div>

              {/* Make Default checkbox */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-[#136B3B] rounded"
                />
                <span className="text-xs font-bold text-[#191C1E]">Set as default pickup address</span>
              </label>

              {/* Actions */}
              <div className="pt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#136B3B] hover:bg-[#0F5730] text-xs font-bold text-white transition shadow-xs"
                >
                  {editingId ? 'Update Address' : 'Save Address'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <BottomNav role="household" />
    </div>
  );
}
