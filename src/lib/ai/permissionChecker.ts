import { CommandIntent, CommandContext } from './commandTypes';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export function checkCommandPermission(
  intent: CommandIntent,
  context: CommandContext
): PermissionCheckResult {
  const { role } = context;

  // 1. Check requiredRole requirement on intent
  if (intent.requiredRole) {
    if (intent.requiredRole === 'admin' && role !== 'admin') {
      return {
        allowed: false,
        reason: 'Administrator privileges are required to access this feature.',
      };
    }

    if (intent.requiredRole === 'household' && role !== 'household' && role !== 'admin') {
      if (role === 'guest') {
        return {
          allowed: false,
          reason: 'Please sign in to your household account to access this feature.',
        };
      }
      return {
        allowed: false,
        reason: 'This action is reserved for Household accounts.',
      };
    }

    if (intent.requiredRole === 'collector' && role !== 'collector' && role !== 'admin') {
      return {
        allowed: false,
        reason: 'This feature is only available to registered Collectors.',
      };
    }
  }

  // 2. Check target route access policies
  if (intent.targetRoute) {
    if (intent.targetRoute.startsWith('/admin') && role !== 'admin') {
      return {
        allowed: false,
        reason: 'You don\'t have administrator permission to access Admin pages.',
      };
    }

    if (intent.targetRoute.startsWith('/collector') && role !== 'collector' && role !== 'admin') {
      return {
        allowed: false,
        reason: 'You don\'t have permission to access Collector pages.',
      };
    }

    if (intent.targetRoute.startsWith('/household') && role === 'collector') {
      return {
        allowed: false,
        reason: 'Collectors cannot access Household dashboard pages.',
      };
    }

    if (intent.targetRoute.startsWith('/household') && role === 'guest') {
      return {
        allowed: false,
        reason: 'Please sign in to access your Household dashboard.',
      };
    }
  }

  return { allowed: true };
}
