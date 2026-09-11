import { IntentResolver } from '../intentResolver';
import { checkCommandPermission } from '../permissionChecker';
import { extractEntitiesFromInput } from '../aiProvider';
import { CommandContext, AIProvider, CommandIntent, AppUserRole } from '../commandTypes';

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
      console.error('CRITICAL TEST FAILURE:', testName);
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

  const resMap = await resolver.resolveIntent('open route map', ctxCollector);
  assert(resMap?.intent === 'VIEW_COLLECTOR_MAP', 'Fast-path: "open route map" -> VIEW_COLLECTOR_MAP');

  const resLang = await resolver.resolveIntent('switch to marathi', ctxHousehold);
  assert(resLang?.intent === 'SWITCH_LANGUAGE', 'Fast-path: "switch to marathi" -> SWITCH_LANGUAGE');

  // Test 2: Entity Extraction
  const entities = extractEntitiesFromInput('i want to sell 10.5 kg of copper tomorrow in marathi');
  assert(entities.material === 'COPPER', 'Entity: material === COPPER');
  assert(entities.weightKg === 10.5, 'Entity: weightKg === 10.5');
  assert(entities.scheduledDate === 'Tomorrow', 'Entity: scheduledDate === Tomorrow');
  assert(entities.language === 'mr', 'Entity: language === mr');

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
    { intent: 'ADMIN_ANALYTICS', targetRoute: '/admin/reports', safetyLevel: 'SAFE', requiredRole: 'admin' },
    ctxAdmin
  );
  assert(permAdminAccess.allowed, 'Permission Guard: Admin allowed into admin analytics/reports');

  const permNullRole = checkCommandPermission(
    { intent: 'VIEW_EARNINGS', targetRoute: '/household', safetyLevel: 'SAFE' },
    { role: undefined as unknown as AppUserRole, pathname: '/', locale: 'en' }
  );
  assert(!permNullRole.allowed && Boolean(permNullRole.reason?.includes('initializing')), 'Permission Guard: Null/undefined role blocked with session initializing message');

  // Test 4: Single Character Input Protection
  const resSingleChar = await resolver.resolveIntent('a', ctxHousehold);
  assert(resSingleChar === null, 'Fast-path Guard: Single character "a" does not match long intent phrases');

  // Test 5: Graceful Malformed Fallback Handling
  const resMalformed = await resolver.resolveIntent('malformed random gibberish input', ctxHousehold);
  assert(resMalformed === null, 'Fallback: Gracefully returns null on unrecognized input');

  return {
    passed: failed === 0,
    total: passed + failed,
    failed,
    log: logs,
  };
}
