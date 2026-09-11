export type UserRole = 'household' | 'collector' | 'recycler' | 'admin';

export type PickupStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type WasteCategory = 'PAPER' | 'PLASTIC' | 'METAL' | 'E_WASTE' | 'GLASS' | 'ORGANIC';

export interface UserProfile {
  id: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  age?: number | string;
  email?: string;
  gender?: string;
  household_type?: string;
  preferred_pickup_slot?: string;
  rating?: number;
  completed_pickups?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SavedAddress {
  id: string;
  user_id?: string;
  label: 'Home' | 'Work' | 'Other';
  full_name?: string;
  phone?: string;
  flat_building: string;
  area_street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  latitude?: number;
  longitude?: number;
}

export interface WasteItem {
  id?: string;
  request_id?: string;
  category: WasteCategory;
  approx_weight_kg: number;
  photos?: string[];
  notes?: string;
  created_at?: string;
}

export type PaymentMethod = 'upi' | 'cash';

export interface VerifiedWasteItem {
  category: WasteCategory;
  verifiedWeightKg: number;
  ratePerKg: number;
  subtotal: number;
}

export interface PaymentDetails {
  transactionId: string;
  method: PaymentMethod;
  totalAmount: number;
  timestamp: string;
  items: VerifiedWasteItem[];
  upiVpa?: string;
  cashGivenBy?: string;
}

export interface PickupRequest {
  id: string;
  household_id: string;
  collector_id?: string | null;
  status: PickupStatus;
  address: string;
  latitude: number;
  longitude: number;
  scheduled_date: string;
  notes?: string;
  total_estimated_weight_kg?: number;
  photos?: string[];
  payment?: PaymentDetails;
  created_at: string;
  updated_at: string;
  // Joined fields
  household?: UserProfile;
  collector?: UserProfile;
  waste_items?: WasteItem[];
}

export interface Chat {
  id: string;
  request_id: string;
  household_id: string;
  collector_id: string;
  created_at: string;
  household?: UserProfile;
  collector?: UserProfile;
  pickup_request?: PickupRequest;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  sender?: UserProfile;
}

export interface CollectorLocation {
  collector_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  updated_at: string;
}

export interface NearbyKabadiwala {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  address: string;
  phone?: string;
  rating?: number;
  acceptedMaterials?: string[];
  type: 'scrap_dealer' | 'recycling_center' | 'collector';
}

export const STANDARD_SCRAP_RATES: Record<WasteCategory, number> = {
  PAPER: 15,    // ₹15 / kg
  PLASTIC: 20,  // ₹20 / kg
  METAL: 65,    // ₹65 / kg
  E_WASTE: 110, // ₹110 / kg
  GLASS: 8,     // ₹8 / kg
  ORGANIC: 4,   // ₹4 / kg
};

export const WASTE_CATEGORY_LABELS: Record<WasteCategory, { label: string; icon: string; color: string; estRatePerKg: string }> = {
  PAPER: { label: 'Paper & Cardboard', icon: '📦', color: 'bg-amber-100 text-amber-800 border-amber-300', estRatePerKg: '₹12 - ₹18' },
  PLASTIC: { label: 'Plastics & Bottles', icon: '🍾', color: 'bg-blue-100 text-blue-800 border-blue-300', estRatePerKg: '₹15 - ₹25' },
  METAL: { label: 'Metals & Scrap', icon: '⚙️', color: 'bg-slate-100 text-slate-800 border-slate-300', estRatePerKg: '₹35 - ₹120' },
  E_WASTE: { label: 'E-Waste & Electronics', icon: '💻', color: 'bg-purple-100 text-purple-800 border-purple-300', estRatePerKg: '₹40 - ₹200' },
  GLASS: { label: 'Glass Bottles', icon: '🥛', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', estRatePerKg: '₹5 - ₹10' },
  ORGANIC: { label: 'Organic / Compost', icon: '🌱', color: 'bg-green-100 text-green-800 border-green-300', estRatePerKg: '₹2 - ₹5' },
};

export type ReportCategory =
  | 'no_show'
  | 'wrong_price'
  | 'wrong_weight'
  | 'payment_issue'
  | 'behaviour'
  | 'other';

export type ReportStatus = 'open' | 'under_review' | 'resolved';

export interface Report {
  id: string;
  request_id: string;
  reporter_id?: string;
  category: ReportCategory;
  description?: string;
  status: ReportStatus;
  created_at: string;
}

export const REPORT_CATEGORIES: Record<
  ReportCategory,
  { label: string; icon: string; description: string }
> = {
  no_show:       { label: "Collector didn't arrive", icon: '🚫', description: 'The collector never showed up at the scheduled time.' },
  wrong_price:   { label: 'Wrong price quoted',      icon: '💰', description: 'The price offered was lower than expected.' },
  wrong_weight:  { label: 'Wrong weight measured',   icon: '⚖️', description: 'The weight reading seemed inaccurate.' },
  payment_issue: { label: 'Payment problem',         icon: '💳', description: 'There was an issue with the payment.' },
  behaviour:     { label: 'Behaviour issue',         icon: '😠', description: 'The collector behaved inappropriately.' },
  other:         { label: 'Other',                   icon: '📝', description: 'Something else went wrong.' },
};

export const STATUS_LABELS: Record<PickupStatus, { label: string; badgeColor: string }> = {
  pending: { label: 'Pending Collector', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  accepted: { label: 'Collector Assigned', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'Pickup In Progress', badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  completed: { label: 'Completed & Paid', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  cancelled: { label: 'Cancelled', badgeColor: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
};

export type ReviewerType = 'customer' | 'kabadiwala' | 'collector';

export interface RatingReview {
  id?: string;
  transaction_id: string;
  reviewer_id: string;
  reviewer_type: ReviewerType;
  reviewee_id: string;
  rating: number;
  review_comment?: string | null;
  timestamp: string;
}

export interface UserRatingsSummary {
  user_id: string;
  average_rating: number;
  total_reviews: number;
  reviews: RatingReview[];
}

// ========================================================
// RECYCLER ECOSYSTEM & COLLECTOR MARKETPLACE TYPES
// ========================================================

export type RecyclerBusinessType = 'Recycler' | 'Dismantler' | 'Refurbisher' | 'Processor';

export type RecyclerVerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export type RecyclerVerificationSource = 'official_listing' | 'scrapmax_partner' | 'demo_data';

export type RecyclerMaterial =
  | 'PCB'
  | 'Copper Cable'
  | 'Aluminium'
  | 'Ferrous Metal'
  | 'Non-ferrous Metal'
  | 'Batteries'
  | 'LCD'
  | 'CRT'
  | 'Motors'
  | 'Magnets'
  | 'Mixed Plastics'
  | 'Mixed E-Waste'
  | 'Other';

export const RECYCLER_MATERIALS_LIST: RecyclerMaterial[] = [
  'PCB',
  'Copper Cable',
  'Aluminium',
  'Ferrous Metal',
  'Non-ferrous Metal',
  'Batteries',
  'LCD',
  'CRT',
  'Motors',
  'Magnets',
  'Mixed Plastics',
  'Mixed E-Waste',
  'Other',
];

export const RECYCLER_MATERIAL_DETAILS: Record<
  RecyclerMaterial,
  { label: string; icon: string; typicalPriceRange: string; defaultUnit: string }
> = {
  PCB: { label: 'PCB Circuit Boards', icon: '💻', typicalPriceRange: '₹120 – ₹180 / KG', defaultUnit: 'KG' },
  'Copper Cable': { label: 'Copper Cable & Wire', icon: '🔌', typicalPriceRange: '₹550 – ₹680 / KG', defaultUnit: 'KG' },
  Aluminium: { label: 'Aluminium Scrap', icon: '⚙️', typicalPriceRange: '₹140 – ₹210 / KG', defaultUnit: 'KG' },
  'Ferrous Metal': { label: 'Ferrous Metal (Iron/Steel)', icon: '🔩', typicalPriceRange: '₹30 – ₹45 / KG', defaultUnit: 'KG' },
  'Non-ferrous Metal': { label: 'Non-ferrous Metal (Brass/Zinc)', icon: '🪙', typicalPriceRange: '₹320 – ₹480 / KG', defaultUnit: 'KG' },
  Batteries: { label: 'Lithium & Lead Batteries', icon: '🔋', typicalPriceRange: '₹90 – ₹220 / KG', defaultUnit: 'KG' },
  LCD: { label: 'LCD Screens & Panels', icon: '🖥️', typicalPriceRange: '₹80 – ₹150 / KG', defaultUnit: 'KG' },
  CRT: { label: 'CRT Glass & Monitors', icon: '📺', typicalPriceRange: '₹15 – ₹30 / KG', defaultUnit: 'KG' },
  Motors: { label: 'Electric Motors & Alternators', icon: '🔄', typicalPriceRange: '₹75 – ₹130 / KG', defaultUnit: 'KG' },
  Magnets: { label: 'Neodymium & Ceramic Magnets', icon: '🧲', typicalPriceRange: '₹200 – ₹450 / KG', defaultUnit: 'KG' },
  'Mixed Plastics': { label: 'Industrial Mixed Plastics', icon: '🧱', typicalPriceRange: '₹18 – ₹32 / KG', defaultUnit: 'KG' },
  'Mixed E-Waste': { label: 'Assorted Electronic Waste', icon: '📟', typicalPriceRange: '₹45 – ₹95 / KG', defaultUnit: 'KG' },
  Other: { label: 'Other Recyclable Material', icon: '📦', typicalPriceRange: 'Market Negotiable', defaultUnit: 'KG' },
};

export interface RecyclerProfile {
  id: string; // references auth.users / profiles.id
  company_name: string;
  business_type: RecyclerBusinessType;
  authorized_person_name: string;
  designation?: string;
  business_email: string;
  business_phone: string;
  registered_address: string;
  facility_address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  registration_number?: string;
  spcb?: string;
  cpcb_epr_id?: string;
  verification_status: RecyclerVerificationStatus;
  verification_source: RecyclerVerificationSource;
  verification_notes?: string;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
  // Capability list
  materials?: RecyclerMaterialCapability[];
  // Aggregate stats
  active_requirements_count?: number;
  completed_transactions_count?: number;
  total_material_purchased_kg?: number;
}

export interface RecyclerMaterialCapability {
  id?: string;
  recycler_id: string;
  material: RecyclerMaterial;
  accepted: boolean;
  minimum_quantity_kg?: number;
  maximum_capacity_kg?: number;
}

export type RequirementStatus = 'Draft' | 'Active' | 'Paused' | 'Fulfilled' | 'Expired' | 'Cancelled';

export type CollectionMethod = 'Recycler Pickup' | 'Collector Delivery' | 'Both';

export interface RecyclerRequirement {
  id: string;
  recycler_id: string;
  material: RecyclerMaterial;
  quantity_required_kg: number;
  quantity_fulfilled_kg: number;
  quantity_committed_kg: number;
  offered_price_per_kg: number;
  minimum_lot_kg: number;
  collection_method: CollectionMethod;
  city: string;
  area?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  quality_requirements?: string;
  status: RequirementStatus;
  expires_at: string;
  created_at: string;
  updated_at?: string;
  // Joined or calculated fields
  recycler?: RecyclerProfile;
  remaining_quantity_kg?: number;
  fulfillment_percentage?: number;
  suppliers_count?: number;
  is_demo?: boolean;
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'counter_offered' | 'cancelled';

export interface CollectorOffer {
  id: string;
  requirement_id: string;
  collector_id: string;
  quantity_offered_kg: number;
  offered_price_per_kg: number;
  estimated_value: number;
  status: OfferStatus;
  counter_price_per_kg?: number;
  counter_quantity_kg?: number;
  counter_notes?: string;
  rejection_reason?: string;
  message?: string;
  created_at: string;
  updated_at?: string;
  // Joined
  requirement?: RecyclerRequirement;
  collector?: UserProfile;
}

export type RecyclerPickupStatus =
  | 'Scheduled'
  | 'Collector Ready'
  | 'Driver Assigned'
  | 'Out for Pickup'
  | 'Arrived'
  | 'Collected'
  | 'Completed'
  | 'Cancelled';

export type RecyclerPaymentMethod = 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'OTHER';

export type RecyclerPaymentStatus = 'Pending' | 'Processing' | 'Paid' | 'Failed';

export interface RecyclerTransaction {
  id: string;
  requirement_id: string;
  offer_id?: string;
  collector_id: string;
  recycler_id: string;
  material: RecyclerMaterial;
  agreed_quantity_kg: number;
  agreed_price_per_kg: number;
  actual_weight_kg?: number;
  final_amount?: number;
  pickup_date?: string;
  pickup_time?: string;
  pickup_method: string;
  pickup_address?: string;
  pickup_status: RecyclerPickupStatus;
  payment_method: RecyclerPaymentMethod;
  payment_status: RecyclerPaymentStatus;
  collector_handover_confirmed: boolean;
  recycler_receipt_confirmed: boolean;
  status: 'in_progress' | 'completed' | 'cancelled';
  traceability_code?: string;
  traceability_data?: TraceabilityRecord;
  created_at: string;
  updated_at?: string;
  // Joined
  collector?: UserProfile;
  recycler?: RecyclerProfile;
  requirement?: RecyclerRequirement;
}

export interface TraceabilityStep {
  step: number;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  status: 'completed' | 'current' | 'pending';
  meta?: Record<string, unknown>;
}

export interface TraceabilityRecord {
  transaction_id: string;
  traceability_code: string;
  material: RecyclerMaterial;
  confirmed_weight_kg: number;
  origin_collector: {
    name: string;
    city: string;
  };
  destination_facility: {
    name: string;
    city: string;
    registration_number?: string;
  };
  steps: TraceabilityStep[];
  emissions_prevented_co2_kg?: number;
  circular_recycling_batch?: string;
}

export interface MatchingScoreResult {
  score: number; // 0 to 100
  requirement: RecyclerRequirement;
  estimatedValue: number;
  reasons: string[];
  isBestMatch?: boolean;
}


