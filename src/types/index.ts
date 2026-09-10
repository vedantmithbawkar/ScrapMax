export type UserRole = 'household' | 'collector';

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

export interface RatingReview {
  id?: string;
  transaction_id: string;
  reviewer_id: string;
  reviewer_type: 'customer' | 'kabadiwala';
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

