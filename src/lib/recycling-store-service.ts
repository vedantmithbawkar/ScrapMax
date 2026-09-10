import { calculateDistanceKm } from './kabadiwala-service';

export type StoreMaterial =
  | 'Plastic'
  | 'Cardboard'
  | 'Metal'
  | 'E-waste'
  | 'Batteries'
  | 'Paper';

export interface RecyclingStore {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  acceptedMaterials: StoreMaterial[];
  openingHour: number; // e.g. 8.5 for 8:30 AM
  closingHour: number; // e.g. 20 for 8:00 PM
  openingHoursText: string;
  verified: boolean;
  type: 'scrap_dealer' | 'recycling_center' | 'e_waste_hub';
  pricingBadge?: string;
  notes?: string;
}

export interface StoreFilterOptions {
  searchQuery?: string;
  selectedMaterials?: StoreMaterial[];
  openNowOnly?: boolean;
  sortBy?: 'nearest' | 'highest_rated';
  userLocation?: [number, number];
}

// Curated verified network of recycling stores & scrap centers
export const BASE_RECYCLING_STORES: RecyclingStore[] = [
  {
    id: 'store-1',
    name: 'Ramesh Paper & Scrap Mart',
    latitude: 12.9784,
    longitude: 77.6408,
    address: 'Indiranagar 100ft Road, near Metro Pillar #84, Bangalore',
    phone: '+91 98450 12345',
    rating: 4.9,
    reviewCount: 142,
    acceptedMaterials: ['Paper', 'Cardboard', 'Plastic', 'Metal'],
    openingHour: 8.0,
    closingHour: 20.0,
    openingHoursText: '8:00 AM – 8:00 PM',
    verified: true,
    type: 'scrap_dealer',
    pricingBadge: 'Top Rates for Cardboard',
    notes: 'Doorstep weighing scale available. Immediate cash or UPI transfer.',
  },
  {
    id: 'store-2',
    name: 'Om Sai Kabadiwala & Electronics Hub',
    latitude: 12.9345,
    longitude: 77.6242,
    address: '2nd Cross, Koramangala 5th Block, Bangalore',
    phone: '+91 98860 98765',
    rating: 4.8,
    reviewCount: 98,
    acceptedMaterials: ['E-waste', 'Batteries', 'Metal', 'Plastic'],
    openingHour: 9.0,
    closingHour: 19.5,
    openingHoursText: '9:00 AM – 7:30 PM',
    verified: true,
    type: 'e_waste_hub',
    pricingBadge: 'Govt Certified E-Waste Hub',
    notes: 'Authorized computer, battery, and electronic disposal center.',
  },
  {
    id: 'store-3',
    name: 'Green City Circular Scrap Hub',
    latitude: 12.9756,
    longitude: 77.6068,
    address: 'Opposite MG Road Metro Station, Central Bangalore',
    phone: '+91 97410 55432',
    rating: 4.9,
    reviewCount: 215,
    acceptedMaterials: ['Plastic', 'Cardboard', 'Metal', 'E-waste', 'Batteries', 'Paper'],
    openingHour: 7.5,
    closingHour: 21.0,
    openingHoursText: '7:30 AM – 9:00 PM',
    verified: true,
    type: 'recycling_center',
    pricingBadge: 'All Recyclables Accepted',
    notes: 'State of the art automated sorting facility and eco-redemption center.',
  },
  {
    id: 'store-4',
    name: 'Ali Brother Kabadi & Metal Yard',
    latitude: 12.9698,
    longitude: 77.5912,
    address: 'Behind Shanthi Nagar Bus Station, Service Road, Bangalore',
    phone: '+91 99001 22334',
    rating: 4.6,
    reviewCount: 76,
    acceptedMaterials: ['Metal', 'Batteries', 'Cardboard'],
    openingHour: 9.5,
    closingHour: 18.5,
    openingHoursText: '9:30 AM – 6:30 PM',
    verified: true,
    type: 'scrap_dealer',
    pricingBadge: 'Heavy Metal Specialist',
    notes: 'Specializes in copper wires, brass, aluminum, iron, and car batteries.',
  },
  {
    id: 'store-5',
    name: 'EcoRecycle CleanTech Center',
    latitude: 12.9856,
    longitude: 77.6534,
    address: 'Old Airport Road, Kodihalli, HAL 2nd Stage, Bangalore',
    phone: '+91 91234 56789',
    rating: 4.7,
    reviewCount: 64,
    acceptedMaterials: ['Plastic', 'Paper', 'Cardboard', 'Batteries'],
    openingHour: 9.0,
    closingHour: 19.0,
    openingHoursText: '9:00 AM – 7:00 PM',
    verified: true,
    type: 'recycling_center',
    pricingBadge: 'Zero-Landfill Partner',
    notes: 'Partners with FMCG brands for circular PET and paper recycling.',
  },
  {
    id: 'store-6',
    name: 'TechScrap & Battery Drop Zone',
    latitude: 12.9184,
    longitude: 77.6492,
    address: 'Sector 2, HSR Layout, near 27th Main, Bangalore',
    phone: '+91 93456 78901',
    rating: 4.8,
    reviewCount: 112,
    acceptedMaterials: ['E-waste', 'Batteries', 'Metal'],
    openingHour: 10.0,
    closingHour: 20.0,
    openingHoursText: '10:00 AM – 8:00 PM',
    verified: true,
    type: 'e_waste_hub',
    pricingBadge: 'Safe Lithium & Lead Disposal',
    notes: 'Safe recycling certification provided for obsolete laptops and batteries.',
  },
  {
    id: 'store-7',
    name: 'Karnataka Paper & Carton Mart',
    latitude: 12.9912,
    longitude: 77.5684,
    address: '8th Cross, Sampige Road, Malleshwaram, Bangalore',
    phone: '+91 94567 89012',
    rating: 4.5,
    reviewCount: 52,
    acceptedMaterials: ['Paper', 'Cardboard', 'Plastic'],
    openingHour: 8.5,
    closingHour: 18.0,
    openingHoursText: '8:30 AM – 6:00 PM',
    verified: false,
    type: 'scrap_dealer',
    pricingBadge: 'Bulk Carton Buyer',
    notes: 'Accepts bulk packaging materials, books, and cartons.',
  },
  {
    id: 'store-8',
    name: 'Swachh Bharat Plastic Reclamation Hub',
    latitude: 12.9812,
    longitude: 77.7289,
    address: 'ITPL Main Road, Whitefield, Bangalore',
    phone: '+91 95678 90123',
    rating: 4.7,
    reviewCount: 89,
    acceptedMaterials: ['Plastic', 'Cardboard', 'E-waste', 'Paper'],
    openingHour: 8.0,
    closingHour: 20.5,
    openingHoursText: '8:00 AM – 8:30 PM',
    verified: true,
    type: 'recycling_center',
    pricingBadge: 'High Volume Shredding',
    notes: 'Industrial and domestic plastic processing with digital weighing scales.',
  },
];

/**
 * Checks if a recycling store is currently open based on current local time.
 */
export function isStoreOpenNow(store: RecyclingStore): boolean {
  const now = new Date();
  const currentHourDecimal = now.getHours() + now.getMinutes() / 60;
  return currentHourDecimal >= store.openingHour && currentHourDecimal < store.closingHour;
}

/**
 * Filter and sort recycling stores according to search query, material filters,
 * open now toggle, and sort preference (Nearest vs Highest-rated).
 */
export function filterRecyclingStores(
  stores: RecyclingStore[] = BASE_RECYCLING_STORES,
  options: StoreFilterOptions
): RecyclingStore[] {
  const {
    searchQuery = '',
    selectedMaterials = [],
    openNowOnly = false,
    sortBy = 'nearest',
    userLocation = [12.9716, 77.5946],
  } = options;

  // 1. Calculate live distances from user's current GPS location
  const storesWithDistance = stores.map((store) => {
    const dist = calculateDistanceKm(
      userLocation[0],
      userLocation[1],
      store.latitude,
      store.longitude
    );
    return { ...store, distanceKm: dist };
  });

  // 2. Filter by text search query
  const query = searchQuery.trim().toLowerCase();
  let filtered = storesWithDistance.filter((store) => {
    if (!query) return true;
    const matchName = store.name.toLowerCase().includes(query);
    const matchAddress = store.address.toLowerCase().includes(query);
    const matchMaterials = store.acceptedMaterials.some((m) =>
      m.toLowerCase().includes(query)
    );
    const matchNotes = store.notes?.toLowerCase().includes(query) || false;
    return matchName || matchAddress || matchMaterials || matchNotes;
  });

  // 3. Filter by materials (if any materials selected, store must accept at least one selected material)
  if (selectedMaterials.length > 0) {
    filtered = filtered.filter((store) =>
      selectedMaterials.some((mat) => store.acceptedMaterials.includes(mat))
    );
  }

  // 4. Filter by Open Now
  if (openNowOnly) {
    filtered = filtered.filter((store) => isStoreOpenNow(store));
  }

  // 5. Sort
  filtered.sort((a, b) => {
    if (sortBy === 'highest_rated') {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.reviewCount - a.reviewCount;
    }
    // Default: 'nearest'
    return (a.distanceKm || 0) - (b.distanceKm || 0);
  });

  return filtered;
}

/**
 * Material metadata including display labels, icons, and color themes.
 */
export const MATERIAL_CHIPS: {
  id: StoreMaterial;
  label: string;
  icon: string;
  color: string;
  activeColor: string;
}[] = [
  {
    id: 'Plastic',
    label: 'Plastic',
    icon: '🍾',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    activeColor: 'bg-blue-600 text-white border-blue-600',
  },
  {
    id: 'Cardboard',
    label: 'Cardboard',
    icon: '📦',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    activeColor: 'bg-amber-600 text-white border-amber-600',
  },
  {
    id: 'Metal',
    label: 'Metal',
    icon: '⚙️',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    activeColor: 'bg-slate-800 text-white border-slate-800',
  },
  {
    id: 'E-waste',
    label: 'E-waste',
    icon: '💻',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    activeColor: 'bg-purple-600 text-white border-purple-600',
  },
  {
    id: 'Batteries',
    label: 'Batteries',
    icon: '🔋',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    activeColor: 'bg-rose-600 text-white border-rose-600',
  },
  {
    id: 'Paper',
    label: 'Paper',
    icon: '📰',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    activeColor: 'bg-[#136B3B] text-white border-[#136B3B]',
  },
];
