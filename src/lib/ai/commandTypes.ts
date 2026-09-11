export type SafetyLevel = 'SAFE' | 'REQUIRES_CONFIRMATION';

export type AppUserRole = 'guest' | 'household' | 'collector' | 'admin';

export interface CommandIntent {
  intent: string;
  targetRoute?: string;
  action?: string;
  entities?: Record<string, unknown>;
  safetyLevel: SafetyLevel;
  requiredRole?: AppUserRole;
  confidence?: number;
}

export interface CommandContext {
  role: AppUserRole;
  pathname: string;
  locale: string;
  history?: string[];
}

export interface AIProvider {
  interpretCommand(input: string, context: CommandContext): Promise<CommandIntent | null>;
}

export interface ExecutionResult {
  executed: boolean;
  requiresConfirmation?: boolean;
  confirmationSummary?: string;
  intent?: CommandIntent;
  feedbackMessage: string;
  navigatedRoute?: string;
}
