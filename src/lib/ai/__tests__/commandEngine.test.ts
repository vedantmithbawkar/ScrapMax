import { IntentResolver } from '../intentResolver';
import { checkCommandPermission } from '../permissionChecker';
import { extractEntitiesFromInput } from '../aiProvider';
import { CommandContext, AIProvider, CommandIntent } from '../commandTypes';

// Mock AIProvider for fallback testing
class MockAIProvider implements AIProvider {
  async interpretCommand(input: string): Promise<CommandIntent | null> {
    if (input.includes('malformed')) return null;
    if (input.includes('complex scrap request')) {
      return {
        intent: 'PREPARE_PICKUP',
        targetRoute: '/household/request-pickup',
        safetyLevel: 'REQUIRES_CONFIRMATION',
        confidence: 0.88,
      };
    }
    return null;
  }
}

export async function runCommandEngineTests(): Promise<{ passed: boolean; total: number; failed: number; log: string[] }> {
  const logs: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      logs.push(`✅ PASS: ${testName}`);
    } else {
      failed++;
      logs.push(`❌ FAIL: ${testName}`);
    }
  }

  const resolver = new IntentResolver(new MockAIProvider());

  // Test 1: Fast-Path Intent Resolution
  const ctxHousehold: CommandContext = { role: 'household', pathname: '/', locale: 'en' };
  const ctxCollector: CommandContext = { role: 'collector', pathname: '/collector', locale: 'en' };
  const ctxAdmin: CommandContext = { role: 'admin', pathname: '/admin', locale: 'en' };
  const ctxGuest: CommandContext = { role: 'guest', pathname: '/', locale: 'en' };

  const resEarnings = await resolver.resolveIntent('show my earnings', ctxHousehold);
  assert(resEarnings?.intent === 'VIEW_EARNINGS', 'Fast-path: "show my earnings" -> VIEW_EARNINGS');

  const resPrices = await resolver.resolveIntent('show scrap prices', ctxGuest);
  assert(resPrices?.intent === 'VIEW_PRICES', 'Fast-path: "show scrap prices" -> VIEW_PRICES');

  const resPending = await resolver.resolveIntent('show pending pickups', ctxHousehold);
  assert(resPending?.intent === 'VIEW_PENDING_PICKUPS', 'Fast-path: "show pending pickups" -> VIEW_PENDING_PICKUPS');

  const resAdmin = await resolver.resolveIntent('open admin dashboard', ctxAdmin);
  assert(resAdmin?.intent === 'ADMIN_DASHBOARD', 'Fast-path: "open admin dashboard" -> ADMIN_DASHBOARD');

  // Test 2: Entity Extraction
  const entities = extractEntitiesFromInput('sell 10.5 kg of copper tomorrow');
  assert(entities.material === 'COPPER', 'Entity: material === COPPER');
  assert(entities.weightKg === 10.5, 'Entity: weightKg === 10.5');
  assert(entities.scheduledDate === 'Tomorrow', 'Entity: scheduledDate === Tomorrow');

  // Test 3: Permission Checker Guards
  const permHouseholdToCollector = checkCommandPermission(
    { intent: 'VIEW_COLLECTOR_MAP', targetRoute: '/collector/map', safetyLevel: 'SAFE', requiredRole: 'collector' },
    ctxHousehold
  );
  assert(!permHouseholdToCollector.allowed, 'Permission Guard: Household blocked from collector map');

  const permCollectorOnMap = checkCommandPermission(
    { intent: 'VIEW_COLLECTOR_MAP', targetRoute: '/collector/map', safetyLevel: 'SAFE', requiredRole: 'collector' },
    ctxCollector
  );
  assert(permCollectorOnMap.allowed, 'Permission Guard: Collector allowed on collector map');

  const permGuestToHistory = checkCommandPermission(
    { intent: 'VIEW_HISTORY', targetRoute: '/household/history', safetyLevel: 'SAFE', requiredRole: 'household' },
    ctxGuest
  );
  assert(!permGuestToHistory.allowed, 'Permission Guard: Guest blocked from household history');

  const permHouseholdToAdmin = checkCommandPermission(
    { intent: 'ADMIN_DASHBOARD', targetRoute: '/admin', safetyLevel: 'SAFE', requiredRole: 'admin' },
    ctxHousehold
  );
  assert(!permHouseholdToAdmin.allowed, 'Permission Guard: Household blocked from admin dashboard');

  const permAdminAccess = checkCommandPermission(
    { intent: 'ADMIN_ANALYTICS', targetRoute: '/admin/analytics', safetyLevel: 'SAFE', requiredRole: 'admin' },
    ctxAdmin
  );
  assert(permAdminAccess.allowed, 'Permission Guard: Admin allowed into admin analytics');

  // Test 4: Graceful Malformed Fallback Handling
  const resMalformed = await resolver.resolveIntent('malformed random gibberish input', ctxHousehold);
  assert(resMalformed === null, 'Fallback: Gracefully returns null on unrecognized input');

  return {
    passed: failed === 0,
    total: passed + failed,
    failed,
    log: logs,
  };
}
