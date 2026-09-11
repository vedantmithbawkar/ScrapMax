import { AppUserRole } from './commandTypes';

export interface CommandRule {
  intent: string;
  phrases: string[];
  targetRoute?: string;
  action?: string;
  safetyLevel: 'SAFE' | 'REQUIRES_CONFIRMATION';
  requiredRole?: AppUserRole;
}

export const COMMAND_REGISTRY: Record<string, CommandRule> = {
  VIEW_DASHBOARD: {
    intent: 'VIEW_DASHBOARD',
    phrases: [
      'open dashboard',
      'show dashboard',
      'go to dashboard',
      'my dashboard',
      'open my dashboard',
      'go home',
      'home page',
      'take me home',
      'main page',
      'home',
    ],
    safetyLevel: 'SAFE',
  },

  VIEW_EARNINGS: {
    intent: 'VIEW_EARNINGS',
    phrases: [
      'show my earnings',
      'how much did i earn',
      'show earnings',
      'my recycling value',
      'total earnings',
      'view earnings',
      'recycling income',
      'my income',
      'how much money',
      'scrap earnings',
      'kitna kamaya',
      'paise',
    ],
    targetRoute: '/household',
    action: 'OPEN_EARNINGS',
    safetyLevel: 'SAFE',
    requiredRole: 'household',
  },

  VIEW_HISTORY: {
    intent: 'VIEW_HISTORY',
    phrases: [
      'show recycling history',
      'my recycling history',
      'show past pickups',
      'pickup history',
      'my activity',
      'show my completed pickups',
      'show pending pickups',
      'view pickup history',
      'history',
      'past sales',
      'previous pickups',
    ],
    targetRoute: '/household/history',
    safetyLevel: 'SAFE',
    requiredRole: 'household',
  },

  VIEW_PENDING_PICKUPS: {
    intent: 'VIEW_PENDING_PICKUPS',
    phrases: [
      'show pending pickups',
      'view pending pickups',
      'pending requests',
      'my active pickups',
      'upcoming pickups',
      'check pending pickup status',
    ],
    targetRoute: '/household/history?status=pending',
    safetyLevel: 'SAFE',
    requiredRole: 'household',
  },

  VIEW_COMPLETED_PICKUPS: {
    intent: 'VIEW_COMPLETED_PICKUPS',
    phrases: [
      'show completed pickups',
      'view completed pickups',
      'finished pickups',
      'past completed requests',
      'completed recycling history',
    ],
    targetRoute: '/household/history?status=completed',
    safetyLevel: 'SAFE',
    requiredRole: 'household',
  },

  VIEW_IMPACT: {
    intent: 'VIEW_IMPACT',
    phrases: [
      'show my impact',
      'eco impact',
      'co2 saved',
      'recycling stats',
      'environmental impact',
      'how much waste recycled',
      'green impact',
    ],
    targetRoute: '/household',
    action: 'FOCUS_IMPACT',
    safetyLevel: 'SAFE',
    requiredRole: 'household',
  },

  OPEN_CHAT: {
    intent: 'OPEN_CHAT',
    phrases: [
      'open chat',
      'talk to collector',
      'chat with collector',
      'messages',
      'pickup chat',
      'collector messages',
    ],
    targetRoute: '/chat',
    action: 'OPEN_CHAT',
    safetyLevel: 'SAFE',
  },

  VIEW_PRICES: {
    intent: 'VIEW_PRICES',
    phrases: [
      'show scrap prices',
      'today scrap prices',
      'price board',
      'open price board',
      'waste rates',
      'scrap market rates',
      'how much for paper',
      'how much for copper',
      'raddi rate',
      'bhav',
      'scrap rate card',
      'metal rates',
    ],
    targetRoute: '/safety',
    action: 'OPEN_PRICES',
    safetyLevel: 'SAFE',
  },

  FIND_COLLECTORS: {
    intent: 'FIND_COLLECTORS',
    phrases: [
      'find nearby collectors',
      'find collectors',
      'nearby collectors',
      'show collectors near me',
      'search collectors',
      'kabadiwala near me',
      'find someone to collect my scrap',
      'show local collectors',
      'kabadiwala',
      'scrap collector',
    ],
    targetRoute: '/household',
    action: 'SHOW_NEARBY_COLLECTORS',
    safetyLevel: 'SAFE',
  },

  VIEW_SAFETY: {
    intent: 'VIEW_SAFETY',
    phrases: [
      'open safety guide',
      'show safety guide',
      'safety guidelines',
      'e-waste disposal rules',
      'recycling safety',
      'safety page',
      'handling rules',
    ],
    targetRoute: '/safety',
    safetyLevel: 'SAFE',
  },

  VIEW_PROFILE: {
    intent: 'VIEW_PROFILE',
    phrases: [
      'show my profile',
      'open profile',
      'my account',
      'view profile',
      'account settings',
      'manage addresses',
      'my details',
    ],
    targetRoute: '/household/profile',
    safetyLevel: 'SAFE',
    requiredRole: 'household',
  },

  VIEW_COLLECTOR_MAP: {
    intent: 'VIEW_COLLECTOR_MAP',
    phrases: [
      'open collector map',
      'open map route',
      'show map route',
      'collector map',
      'go to recycler dashboard',
      'open route map',
      'collector portal',
    ],
    targetRoute: '/collector/map',
    safetyLevel: 'SAFE',
    requiredRole: 'collector',
  },

  ADMIN_DASHBOARD: {
    intent: 'ADMIN_DASHBOARD',
    phrases: [
      'open admin dashboard',
      'admin portal',
      'go to admin',
      'admin console',
      'admin page',
    ],
    targetRoute: '/admin',
    safetyLevel: 'SAFE',
    requiredRole: 'admin',
  },

  ADMIN_ANALYTICS: {
    intent: 'ADMIN_ANALYTICS',
    phrases: [
      'open admin analytics',
      'admin analytics',
      'epr reports',
      'system analytics',
      'admin metrics',
    ],
    targetRoute: '/admin/analytics',
    safetyLevel: 'SAFE',
    requiredRole: 'admin',
  },

  SWITCH_LANGUAGE: {
    intent: 'SWITCH_LANGUAGE',
    phrases: [
      'switch to marathi',
      'change language to marathi',
      'switch to hindi',
      'change language to hindi',
      'switch to english',
      'change language to english',
      'marathi language',
      'hindi language',
      'english language',
      'bhasha badlo',
    ],
    action: 'SWITCH_LANGUAGE',
    safetyLevel: 'SAFE',
  },

  PREPARE_PICKUP: {
    intent: 'PREPARE_PICKUP',
    phrases: [
      'book a scrap pickup',
      'book a pickup',
      'schedule a pickup',
      'i want to sell scrap',
      'sell copper',
      'sell plastic',
      'sell paper',
      'sell e-waste',
      'recycle copper',
      'request pickup',
      'sell raddi',
      'sell scrap',
    ],
    targetRoute: '/household/request-pickup',
    action: 'PREPARE_PICKUP_WORKFLOW',
    safetyLevel: 'REQUIRES_CONFIRMATION',
    requiredRole: 'household',
  },
};

export function getSuggestedCommands(role: AppUserRole): string[] {
  if (role === 'admin') {
    return [
      'Open admin dashboard',
      'Admin analytics',
      'View safety guide',
      'Switch to English',
    ];
  }
  if (role === 'collector') {
    return [
      'Open route map',
      'Collector dashboard',
      'View safety guide',
      'Switch to Hindi',
    ];
  }
  if (role === 'household') {
    return [
      'Book a scrap pickup',
      'Show my earnings',
      'Pending pickups',
      'Find nearby collectors',
    ];
  }
  return [
    'Find nearby collectors',
    'Show scrap prices',
    'View safety guide',
    'Switch to Marathi',
  ];
}
