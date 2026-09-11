import { CommandIntent, ExecutionResult } from './commandTypes';

export interface CommandExecutorCallbacks {
  navigate: (route: string) => void;
  switchLanguage: (locale: string) => void;
  triggerCollectorSearch: () => void;
}

export class CommandExecutor {
  execute(intent: CommandIntent, callbacks: CommandExecutorCallbacks): ExecutionResult {
    // 1. If command requires confirmation, return payload for confirmation modal
    if (intent.safetyLevel === 'REQUIRES_CONFIRMATION') {
      const material = (intent.entities?.material as string) || 'scrap';
      const weight = intent.entities?.weightKg ? `${intent.entities.weightKg} kg` : '';
      const date = (intent.entities?.scheduledDate as string) || '';

      const detailStr = [weight, material, date].filter(Boolean).join(' ');
      const confirmationSummary = intent.intent === 'PREPARE_PICKUP'
        ? `Schedule pickup for ${detailStr || 'scrap materials'}`
        : `Confirm execution of ${intent.intent}`;

      return {
        executed: false,
        requiresConfirmation: true,
        confirmationSummary,
        intent,
        feedbackMessage: `Action requires confirmation: ${confirmationSummary}`,
      };
    }

    // 2. Handle specific actions
    if (intent.action === 'SWITCH_LANGUAGE') {
      const targetLang = (intent.entities?.language as string) || 'en';
      callbacks.switchLanguage(targetLang);
      return {
        executed: true,
        intent,
        feedbackMessage: `Switched language to ${targetLang.toUpperCase()}.`,
      };
    }

    if (intent.action === 'SHOW_NEARBY_COLLECTORS') {
      callbacks.triggerCollectorSearch();
      return {
        executed: true,
        intent,
        feedbackMessage: 'Searching for nearby scrap collectors...',
      };
    }

    // 3. Handle standard route navigation
    if (intent.targetRoute) {
      callbacks.navigate(intent.targetRoute);
      let feedback = `Navigating to ${intent.targetRoute}...`;

      if (intent.intent === 'VIEW_EARNINGS') feedback = 'Opening your earnings summary...';
      else if (intent.intent === 'VIEW_HISTORY') feedback = 'Opening your recycling history...';
      else if (intent.intent === 'VIEW_PENDING_PICKUPS') feedback = 'Showing your pending pickup requests...';
      else if (intent.intent === 'VIEW_COMPLETED_PICKUPS') feedback = 'Showing your completed recycling pickups...';
      else if (intent.intent === 'VIEW_IMPACT') feedback = 'Opening your environmental impact metrics...';
      else if (intent.intent === 'OPEN_CHAT') feedback = 'Opening collector messaging chat...';
      else if (intent.intent === 'VIEW_PRICES') feedback = 'Opening today\'s scrap price board...';
      else if (intent.intent === 'VIEW_SAFETY') feedback = 'Opening safety guidelines...';
      else if (intent.intent === 'VIEW_PROFILE') feedback = 'Opening your account profile...';
      else if (intent.intent === 'VIEW_COLLECTOR_MAP') feedback = 'Opening collector route map...';
      else if (intent.intent === 'ADMIN_DASHBOARD') feedback = 'Opening Admin Console...';
      else if (intent.intent === 'ADMIN_ANALYTICS') feedback = 'Opening Admin Analytics & EPR Reports...';

      return {
        executed: true,
        intent,
        feedbackMessage: feedback,
        navigatedRoute: intent.targetRoute,
      };
    }

    return {
      executed: false,
      intent,
      feedbackMessage: 'No executable action associated with this command.',
    };
  }
}
