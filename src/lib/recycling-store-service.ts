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
  city?: 'mumbai' | 'bangalore' | 'other';
}

export interface StoreFilterOptions {
  searchQuery?: string;
  selectedMaterials?: StoreMaterial[];
  openNowOnly?: boolean;
  sortBy?: 'nearest' | 'highest_rated';
  userLocation?: [number, number];
  city?: 'all' | 'mumbai' | 'bangalore';
}

export const DEFAULT_CITY_COORDINATES = {
  mumbai: [19.1726, 72.9565] as [number, number], // Mulund West, Mumbai
  bangalore: [12.9716, 77.5946] as [number, number], // Indiranagar/MG Road, Bangalore
};

// Curated verified network of recycling stores & scrap centers across Mulund, Mumbai MMR & Bangalore
export const BASE_RECYCLING_STORES: RecyclingStore[] = [
  // ─── MULUND & MUMBAI MMR RECYCLING STORES ───────────────────────────
  {
    id: 'store-mum-1',
    name: 'Mulund Scrap Mart & Paper Center',
    latitude: 19.1795,
    longitude: 72.9482,
    address: 'LBS Marg, Near Marathon Monte Carlo & Check Naka, Mulund West, Mumbai',
    phone: '+91 98201 45892',
    rating: 4.9,
    reviewCount: 168,
    acceptedMaterials: ['Paper', 'Cardboard', 'Plastic', 'Metal'],
    openingHour: 8.0,
    closingHour: 20.5,
    openingHoursText: '8:00 AM – 8:30 PM',
    verified: true,
    type: 'scrap_dealer',
    pricingBadge: 'Top Rates for Cardboard & Metal',
    notes: 'Certified digital weighing scale on-spot. Cash and instant UPI settlement for all Mulund residents.',
    city: 'mumbai',
  },
  {
    id: 'store-mum-2',
    name: 'Sai Krupa Kabadiwala & Metal Yard',
    latitude: 19.1726,
    longitude: 72.9565,
    address: 'Nehru Road, Opp. Mulund Railway Station West, Mulund West, Mumbai',
    phone: '+91 98192 34567',
    rating: 4.8,
    reviewCount: 134,
    acceptedMaterials: ['Metal', 'Plastic', 'Batteries', 'Cardboard'],
    openingHour: 8.5,
    closingHour: 21.0,
    openingHoursText: '8:30 AM – 9:00 PM',
    verified: true,
    type: 'scrap_dealer',
    pricingBadge: 'Heavy Iron & Copper Specialist',
    notes: 'Reliable neighborhood scrap mart near Mulund Station. Bulk packaging pickup service available.',
    city: 'mumbai',
  },
  {
    id: 'store-mum-3',
    name: 'Mahavir Eco-Recyclers & E-Waste Hub',
    latitude: 19.1748,
    longitude: 72.9510,
    address: 'Devidayal Road, Near Kalidas Hall, Mulund West, Mumbai',
    phone: '+91 98210 98765',
    rating: 4.9,
    reviewCount: 205,
    acceptedMaterials: ['E-waste', 'Batteries', 'Metal', 'Plastic'],
    openingHour: 9.0,
    closingHour: 20.0,
    openingHoursText: '9:00 AM – 8:00 PM',
    verified: true,
    type: 'e_waste_hub',
    pricingBadge: 'Authorized E-Waste & Battery Hub',
    notes: 'MPCB authorized e-waste dismantling, computer scrap, lithium batteries, and electronic scrap disposal.',
    city: 'mumbai',
  },
  {
    id: 'store-mum-4',
    name: 'Eastern Suburbs Circular Scrap Depot',
    latitude: 19.1685,
    longitude: 72.9642,
    address: 'Navghar Road, Near Mulund East Railway Station, Mulund East, Mumbai',
    phone: '+91 98334 56789',
    rating: 4.7,
    reviewCount: 92,
    acceptedMaterials: ['Cardboard', 'Paper', 'Plastic', 'Glass' as StoreMaterial, 'Metal'],
    openingHour: 7.5,
    closingHour: 19.5,
    openingHoursText: '7:30 AM – 7:30 PM',
    verified: true,
    type: 'recycling_center',
    pricingBadge: 'Zero Landfill Partner',
    notes: 'Full circular recovery facility. Accepts newspapers, cartons, PET plastic bottles, and glass jars.',
    city: 'mumbai',
  },
  {
    id: 'store-mum-5',
    name: 'Shree Ganesh Paper & Plastic Mart',
    latitude: 19.1642,
    longitude: 72.9680,
    address: 'Mithagar Road, Near Kelkar College, Mulund East, Mumbai',
    phone: '+91 98701 23456',
    rating: 4.8,
    reviewCount: 118,
    acceptedMaterials: ['Paper', 'Cardboard', 'Plastic'],
    openingHour: 8.0,
    closingHour: 20.0,
    openingHoursText: '8:00 AM – 8:00 PM',
    verified: true,
    type: 'scrap_dealer',
    pricingBadge: 'Best Raddi & Book Rates',
    notes: 'Preferred raddi center for books, old notebooks, carton boxes, and packaging plastics.',
    city: 'mumbai',
  },
  {
    id: 'store-mum-6',
    name: 'Thane Central Kabadiwala & Industrial Scrap Hub',
    latitude: 19.1912,
    longitude: 72.9485,
    address: 'Road No. 16, Wagle Industrial Estate, Thane West (Mulund Border), Mumbai MMR',
    phone: '+91 98205 67890',
    rating: 4.9,
    reviewCount: 310,
    acceptedMaterials: ['Metal', 'E-waste', 'Batteries', 'Cardboard', 'Plastic', 'Paper'],
    openingHour: 8.0,
    closingHour: 21.0,
    openingHoursText: '8:00 AM – 9:00 PM',
    verified: true,
    type: 'recycling_center',
    pricingBadge: 'High Volume Weighbridge Available',
    notes: 'Massive recycling depot serving Mulund, Thane, and Kalwa. High-capacity balers and electronic scales.',
    city: 'mumbai',
  },
  {
    id: 'store-mum-7',
    name: 'Bhandup Metal & Electronics Scrap Mart',
    latitude: 19.1512,
    longitude: 72.9372,
    address: 'LBS Marg, Near Dreams Mall, Bhandup West, Mumbai',
    phone: '+91 98920 11223',
    rating: 4.6,
    reviewCount: 78,
    acceptedMaterials: ['Metal', 'Plastic', 'Cardboard', 'E-waste'],
    openingHour: 8.5,
    closingHour: 20.0,
    openingHoursText: '8:30 AM – 8:00 PM',
    verified: true,
    type: 'scrap_dealer',
    pricingBadge: 'Instant UPI Payout',
    notes: 'Specializes in white goods recycling (refrigerators, AC units, motors, and wiring cables).',
    city: 'mumbai',
  },
  {
    id: 'store-mum-8',
    name: 'Powai Eco-Solutions & Battery Recyclers',
    latitude: 19.1197,
    longitude: 72.9051,
    address: 'Central Avenue, Near Hiranandani Gardens, Powai, Mumbai',
    phone: '+91 97690 44556',
    rating: 4.9,
    reviewCount: 245,
    acceptedMaterials: ['E-waste', 'Batteries', 'Plastic', 'Cardboard', 'Paper'],
    openingHour: 9.0,
    closingHour: 21.0,
    openingHoursText: '9:00 AM – 9:00 PM',
    verified: true,
    type: 'recycling_center',
    pricingBadge: 'Certified Green Recycler',
    notes: 'Premium circular hub serving Powai, Vikhroli, and Kanjurmarg. Clean doorstep pickup team.',
    city: 'mumbai',
  },

  // ─── BANGALORE RECYCLING STORES ─────────────────────────────────────
  {
    id: 'store-blr-1',
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
    city: 'bangalore',
  },
  {
    id: 'store-blr-2',
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
    city: 'bangalore',
  },
  {
    id: 'store-blr-3',
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
    city: 'bangalore',
  },
  {
    id: 'store-blr-4',
    name: 'Ali Brother Kabadi & Metal Yard',
    latitude: 12.9698,
    longitude: 77.5912,
    address: 'Behind Shanthi Nagar Bus Station, Service Road, Bangalore',
    phone: '+91 99001 23456',
    rating: 4.7,
    reviewCount: 76,
    acceptedMaterials: ['Metal', 'Batteries', 'Plastic'],
    openingHour: 8.5,
    closingHour: 20.0,
    openingHoursText: '8:30 AM – 8:00 PM',
    verified: true,
    type: 'scrap_dealer',
    pricingBadge: 'Best Iron & Copper Rates',
    notes: 'Industrial and domestic scrap specialists with on-spot electronic weighment.',
    city: 'bangalore',
  },
  {
    id: 'store-blr-5',
    name: 'HSR Circular E-Waste & Dry Waste Drop',
    latitude: 12.9123,
    longitude: 77.6391,
    address: '27th Main Road, Sector 1, HSR Layout, Bangalore',
    phone: '+91 98455 67890',
    rating: 4.9,
    reviewCount: 184,
    acceptedMaterials: ['E-waste', 'Batteries', 'Plastic', 'Cardboard'],
    openingHour: 9.0,
    closingHour: 19.0,
    openingHoursText: '9:00 AM – 7:00 PM',
    verified: true,
    type: 'e_waste_hub',
    pricingBadge: 'Free Certified Data Wipe',
    notes: 'Provides recycling certificates and digital payments for all IT scrap.',
    city: 'bangalore',
  },
  {
    id: 'store-blr-6',
    name: 'Sri Krishna Recyclers & Bailing Mart',
    latitude: 12.9245,
    longitude: 77.5834,
    address: '9th Block, Jayanagar, near Raghavendra Swamy Mutt, Bangalore',
    phone: '+91 99800 11223',
    rating: 4.6,
    reviewCount: 64,
    acceptedMaterials: ['Paper', 'Cardboard', 'Plastic'],
    openingHour: 8.0,
    closingHour: 19.0,
    openingHoursText: '8:00 AM – 7:00 PM',
    verified: true,
    type: 'scrap_dealer',
    pricingBadge: 'Instant Cash Settlement',
    notes: 'Daily newspaper and cardboard box pickups across Jayanagar & JP Nagar.',
    city: 'bangalore',
  },
  {
    id: 'store-blr-7',
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
    city: 'bangalore',
  },
  {
    id: 'store-blr-8',
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
    city: 'bangalore',
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
 * city, open now toggle, and sort preference (Nearest vs Highest-rated).
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
    userLocation = DEFAULT_CITY_COORDINATES.mumbai, // Defaults to Mulund, Mumbai
    city = 'all',
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

  // 2. Filter by city if explicitly selected (and not 'all')
  let filtered = storesWithDistance.filter((store) => {
    if (city === 'all') return true;
    return store.city === city;
  });

  // 3. Filter by text search query (matches name, address, materials, city, notes)
  const query = searchQuery.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((store) => {
      const matchName = store.name.toLowerCase().includes(query);
      const matchAddress = store.address.toLowerCase().includes(query);
      const matchCity = store.city?.toLowerCase().includes(query) || false;
      const matchMaterials = store.acceptedMaterials.some((m) =>
        m.toLowerCase().includes(query)
      );
      const matchNotes = store.notes?.toLowerCase().includes(query) || false;
      return matchName || matchAddress || matchCity || matchMaterials || matchNotes;
    });
  }

  // 4. Filter by materials (if any materials selected, store must accept at least one selected material)
  if (selectedMaterials.length > 0) {
    filtered = filtered.filter((store) =>
      selectedMaterials.some((mat) => store.acceptedMaterials.includes(mat))
    );
  }

  // 5. Filter by Open Now
  if (openNowOnly) {
    filtered = filtered.filter((store) => isStoreOpenNow(store));
  }

  // 6. Sort
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
