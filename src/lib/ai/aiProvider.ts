import { AIProvider, CommandIntent, CommandContext } from './commandTypes';

export class GeminiAIProvider implements AIProvider {
  async interpretCommand(input: string, context: CommandContext): Promise<CommandIntent | null> {
    try {
      const response = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input || '',
          role: context?.role || 'guest',
          locale: context?.locale || 'en',
        }),
      });

      if (response.status === 429) {
        console.warn('[AI] GeminiAIProvider rate limit (429) hit.');
        return {
          intent: 'UNKNOWN',
          safetyLevel: 'SAFE',
          confidence: 0,
          entities: {
            fallbackMessage: 'AI service is temporarily busy. Please try again in a moment.',
          },
        };
      }

      if (response.status === 503) {
        console.warn('[AI] GeminiAIProvider server unconfigured (503).');
        return {
          intent: 'UNKNOWN',
          safetyLevel: 'SAFE',
          confidence: 0,
          entities: {
            fallbackMessage: 'AI Assistant service is not configured on the server.',
          },
        };
      }

      if (!response.ok) {
        console.warn(`[AI] GeminiAIProvider API returned status ${response.status}`);
        return null;
      }

      const data = await response.json().catch(() => null);
      if (!data) return null;

      // Extract structured fields from response
      const rawAction = data.action || 'NONE';

      // Validate or infer CommandIntent shape
      let intentName = data.intent || 'UNKNOWN';
      let safetyLevel: 'SAFE' | 'REQUIRES_CONFIRMATION' = 'SAFE';
      let targetRoute: string | undefined = undefined;

      if (rawAction === 'PREPARE_PICKUP_WORKFLOW' || intentName === 'PREPARE_PICKUP' || rawAction === 'NAVIGATE_TO_REQUEST_PICKUP') {
        intentName = 'PREPARE_PICKUP';
        safetyLevel = 'REQUIRES_CONFIRMATION';
        targetRoute = '/household/request-pickup';
      } else if (rawAction === 'NAVIGATE_TO_SAFETY') {
        intentName = 'VIEW_SAFETY';
        targetRoute = '/privacy';
      } else if (rawAction === 'NAVIGATE_TO_HISTORY') {
        intentName = 'VIEW_HISTORY';
        targetRoute = '/household/history';
      } else if (rawAction === 'NAVIGATE_TO_PROFILE') {
        intentName = 'VIEW_PROFILE';
        targetRoute = '/household/profile';
      } else if (rawAction === 'NAVIGATE_TO_COLLECTOR_MAP') {
        intentName = 'VIEW_COLLECTOR_MAP';
        targetRoute = '/collector/map';
      } else if (rawAction === 'SHOW_NEARBY_COLLECTORS') {
        intentName = 'FIND_COLLECTORS';
        targetRoute = '/household';
      }

      const intent: CommandIntent = {
        intent: intentName,
        targetRoute,
        action: rawAction !== 'NONE' ? rawAction : undefined,
        entities: data.entities || extractEntitiesFromInput(input),
        safetyLevel,
        confidence: data.confidence || 0.9,
      };

      return intent;
    } catch {
      console.warn('[AI] GeminiAIProvider network request failed.');
      return null; // Graceful fallback to null on network or JSON parsing error
    }
  }
}

export function extractEntitiesFromInput(input: string): Record<string, unknown> {
  const entities: Record<string, unknown> = {};
  const lower = (input || '').toLowerCase();

  // Material extraction
  if (lower.includes('copper')) entities.material = 'COPPER';
  else if (lower.includes('paper') || lower.includes('newspaper') || lower.includes('raddi')) entities.material = 'PAPER';
  else if (lower.includes('plastic') || lower.includes('bottle')) entities.material = 'PLASTIC';
  else if (lower.includes('e-waste') || lower.includes('electronic') || lower.includes('laptop') || lower.includes('phone')) entities.material = 'E_WASTE';
  else if (lower.includes('metal') || lower.includes('iron') || lower.includes('brass') || lower.includes('aluminum')) entities.material = 'METAL';

  // Weight extraction (e.g. "5 kg", "10.5kg", "20 kilos")
  const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos|kilogram|kgs)/);
  if (weightMatch) {
    entities.weightKg = parseFloat(weightMatch[1]);
  }

  // Date extraction
  if (lower.includes('tomorrow')) entities.scheduledDate = 'Tomorrow';
  else if (lower.includes('today')) entities.scheduledDate = 'Today';
  else if (lower.includes('next monday')) entities.scheduledDate = 'Next Monday';
  else if (lower.includes('weekend')) entities.scheduledDate = 'Weekend';

  // Language extraction
  if (lower.includes('marathi')) entities.language = 'mr';
  else if (lower.includes('hindi')) entities.language = 'hi';
  else if (lower.includes('english')) entities.language = 'en';

  return entities;
}
