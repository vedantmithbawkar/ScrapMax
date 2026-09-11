import { CommandIntent, CommandContext, AIProvider } from './commandTypes';
import { COMMAND_REGISTRY } from './commandRegistry';
import { GeminiAIProvider, extractEntitiesFromInput } from './aiProvider';

export class IntentResolver {
  private aiProvider: AIProvider;

  constructor(aiProvider?: AIProvider) {
    this.aiProvider = aiProvider || new GeminiAIProvider();
  }

  async resolveIntent(input: string, context: CommandContext): Promise<CommandIntent | null> {
    const cleanInput = input.trim().toLowerCase();
    if (!cleanInput) return null;

    // 1. FAST-PATH: Keyword & Phrase Matching against COMMAND_REGISTRY
    for (const rule of Object.values(COMMAND_REGISTRY)) {
      for (const phrase of rule.phrases) {
        if (cleanInput.includes(phrase) || phrase.includes(cleanInput)) {
          const entities = extractEntitiesFromInput(cleanInput);

          // Dynamic route mapping based on role for general dashboard requests
          let targetRoute = rule.targetRoute;
          if (rule.intent === 'VIEW_DASHBOARD') {
            targetRoute = context.role === 'collector' ? '/collector' : context.role === 'admin' ? '/admin' : '/household';
          }

          return {
            intent: rule.intent,
            targetRoute,
            action: rule.action,
            entities,
            safetyLevel: rule.safetyLevel,
            requiredRole: rule.requiredRole,
            confidence: 0.95,
          };
        }
      }
    }

    // 2. FALLBACK: Call Gemini AIProvider for complex/natural inputs
    const aiResolved = await this.aiProvider.interpretCommand(input, context);
    if (aiResolved && aiResolved.intent !== 'UNKNOWN') {
      return aiResolved;
    }

    return null;
  }
}
