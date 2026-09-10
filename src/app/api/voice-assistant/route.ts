import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

interface ModelCache {
  discoveredAt: number;
  apiKeyPrefix: string;
  models: string[];
}

let modelCache: ModelCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SERVER_TIMEOUT_MS = 25000; // 25 seconds server deadline

const EXCLUDED_MODEL_TERMS = [
  'tts',
  'image',
  'embedding',
  'audio',
  'live',
  'veo',
  'lyria',
  'robotics',
  'computer-use',
  'deep-research',
  'transcribe',
  'banana',
  'streaming',
];

/**
 * Filter out models that are not standard text generation models.
 */
function isSafeTextModel(modelName: string): boolean {
  const lower = modelName.toLowerCase();
  return !EXCLUDED_MODEL_TERMS.some((term) => lower.includes(term));
}

/**
 * Conservative sentence completion guard.
 * Verifies non-empty text ends with terminal punctuation (. ! ? । ॥)
 * allowing optional trailing closing quotation marks/brackets.
 */
function isTextComplete(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 5) return false;
  return /[.!?।॥]["')\]]?$/.test(trimmed);
}

/**
 * Promise wrapper enforcing a strict server execution deadline.
 */
function withTimeout<T>(promise: Promise<T>, ms = SERVER_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`SERVER_TIMEOUT_${ms}MS`));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Discover generateContent-compatible models for the provided Gemini API key.
 * Caches model lists for 5 minutes per API key prefix.
 */
async function getDiscoveredModels(
  ai: GoogleGenAI,
  apiKeyPrefix: string,
  forceRefresh = false
): Promise<{ models: string[]; cacheHit: boolean }> {
  const now = Date.now();
  if (
    !forceRefresh &&
    modelCache &&
    modelCache.apiKeyPrefix === apiKeyPrefix &&
    now - modelCache.discoveredAt < CACHE_TTL_MS
  ) {
    return { models: modelCache.models, cacheHit: true };
  }

  const discovered: string[] = [];
  try {
    const listPager = await withTimeout(ai.models.list(), 10000);
    for await (const m of listPager) {
      const rawName = (m as { name?: string }).name || '';
      const normalized = rawName.replace(/^models\//, '');
      const methods =
        (m as { supportedGenerationMethods?: string[] }).supportedGenerationMethods ||
        (m as { supported_generation_methods?: string[] }).supported_generation_methods ||
        [];

      if (methods.length === 0 || methods.includes('generateContent')) {
        if (normalized && !discovered.includes(normalized)) {
          discovered.push(normalized);
        }
      }
    }
  } catch (err) {
    console.error(
      '[Voice Assistant Server Log] Error listing Gemini models:',
      err instanceof Error ? err.message : String(err)
    );
  }

  modelCache = {
    discoveredAt: now,
    apiKeyPrefix,
    models: discovered,
  };

  return { models: discovered, cacheHit: false };
}

/**
 * Select best text model based on user requirements.
 */
function selectBestModel(discoveredModels: string[]): { model: string | null; reason: string } {
  if (discoveredModels.length === 0) return { model: null, reason: 'none-available' };

  const safeModels = discoveredModels.filter(isSafeTextModel);
  const pool = safeModels.length > 0 ? safeModels : discoveredModels;

  const envModel = process.env.GEMINI_MODEL_NAME;
  if (envModel && pool.includes(envModel)) {
    return { model: envModel, reason: 'env-config' };
  }

  const priorityChain: { name: string; reason: string }[] = [
    { name: 'gemini-flash-lite-latest', reason: 'flash-lite-latest' },
    { name: 'gemini-flash-latest', reason: 'flash-latest' },
    { name: 'gemini-2.5-flash-lite', reason: '2.5-flash-lite' },
    { name: 'gemini-2.5-flash', reason: '2.5-flash' },
    { name: 'gemini-3.1-flash-lite', reason: '3.1-flash-lite' },
    { name: 'gemini-3-flash-preview', reason: '3-flash-preview' },
  ];

  for (const item of priorityChain) {
    if (pool.includes(item.name)) {
      return { model: item.name, reason: item.reason };
    }
  }

  const flashLite = pool.find((m) => m.toLowerCase().includes('flash-lite'));
  if (flashLite) return { model: flashLite, reason: 'flash-lite' };

  const flash = pool.find((m) => m.toLowerCase().includes('flash'));
  if (flash) return { model: flash, reason: 'flash' };

  const latest = pool.find((m) => m.toLowerCase().includes('latest'));
  if (latest) return { model: latest, reason: 'latest' };

  return { model: pool[0], reason: 'fallback' };
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const rawApiKey = process.env.GEMINI_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, '') : '';
    const keyMaskedPrefix = apiKey && apiKey.length >= 4 ? `${apiKey.slice(0, 4)}***` : 'NONE';

    console.log(`[Voice Assistant Server Log] [${reqId}] KEY_LOADED: ${!!apiKey}, KEY_PREFIX: ${keyMaskedPrefix}`);

    if (!apiKey || apiKey === '' || apiKey === 'your-gemini-api-key-here') {
      console.warn(`[Voice Assistant Server Log] [${reqId}] GEMINI_API_KEY missing or unconfigured.`);
      return NextResponse.json(
        {
          reply: 'Voice Assistant is not configured on the server. Please add a valid GEMINI_API_KEY to your .env.local file.',
          error: 'GEMINI_API_KEY is missing or unconfigured.',
          configured: false,
        },
        { status: 503 }
      );
    }

    const isValidFormat = (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) && apiKey.length >= 20;
    if (!isValidFormat) {
      console.warn(`[Voice Assistant Server Log] [${reqId}] WARNING: Key format validation failed for prefix "${keyMaskedPrefix}". Length: ${apiKey.length}`);
    }

    const body = await req.json().catch(() => null);
    const { message, locale } = body || {};

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message payload is required.', reply: 'Please provide a valid message.' },
        { status: 400 }
      );
    }

    const targetLocaleCode = locale === 'hi' ? 'hi' : locale === 'mr' ? 'mr' : 'en';
    const targetLocale = locale === 'hi' ? 'Hindi' : locale === 'mr' ? 'Marathi' : 'English';

    const systemInstruction = `You are ScrapMax Assistant, a helpful AI assistant for ScrapMax - a digital platform connecting households with local scrap collectors (Kabadiwalas) for recycling and waste disposal in India.

Your knowledge is STRICTLY CONSTRAINED to the ScrapMax application and waste recycling topics:
1. Waste categories: Paper (newspaper, cardboard, office paper), Plastics (PET bottles, HDPE, hard plastics), Metals (copper, iron, aluminum, brass), E-Waste (electronics, mobile phones, appliances, batteries), Glass, and Mixed Scrap.
2. How to request a pickup: Users navigate to the "Pickup" tab (/household/request-pickup), select waste category, enter estimated weight, pick an address, select a time slot, and submit their request.
3. Safety & Compliance: E-waste must be handed over safely without dismantling batteries or toxic components. Hazardous chemicals are not accepted. Refer to the /safety page for detailed guidance.
4. How platform works: ScrapMax connects users with verified collectors. Collectors review requests, visit the location, weigh items on digital scales, pay instant cash/digital payment, and take scrap for recycling.
5. Language & Style: Respond in ${targetLocale} language (matching the user's active locale). Keep responses concise (2-4 sentences max) so they are easy to understand when read aloud via text-to-speech.

DO NOT answer general knowledge questions unrelated to waste management, recycling, or the ScrapMax platform (e.g., math, programming, general history, movies, or outer space). If asked an off-topic question, politely decline and remind the user that you are the ScrapMax Recycling & Pickup Assistant.`;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: SERVER_TIMEOUT_MS },
    });

    const { models: discoveredModels, cacheHit } = await getDiscoveredModels(ai, keyMaskedPrefix);
    const { model: selectedModel, reason: selectionReason } = selectBestModel(discoveredModels);

    console.log(`[Voice Assistant Server Log] [${reqId}] Model Discovery CacheHit=${cacheHit}, DiscoveredCount=${discoveredModels.length}`);
    console.log(`[Voice Assistant Server Log] [${reqId}] Selected Model: ${selectedModel || 'NONE'} (Reason: ${selectionReason})`);

    if (!selectedModel) {
      console.error(`[Voice Assistant Server Log] [${reqId}] No generateContent-compatible safe text model found.`);
      return NextResponse.json(
        {
          reply: 'No compatible AI text model was found for this server credential. Please check Google AI Studio API permissions.',
          error: 'No compatible Gemini text model found.',
          configured: true,
        },
        { status: 503 }
      );
    }

    let replyText = '';
    let isFinalSuccess = false;

    console.log(`[Voice Assistant Server Log] [${reqId}] Attempting generateContent model=${selectedModel} locale=${targetLocaleCode}`);

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: selectedModel,
          contents: message,
          config: {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 768,
          },
        }),
        SERVER_TIMEOUT_MS
      );

      replyText = response.text || '';
      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason || (candidate as { finish_reason?: string })?.finish_reason || 'UNKNOWN';
      const finishMessage = (candidate as { finishMessage?: string })?.finishMessage || '';
      const candidatesCount = response.candidates?.length ?? 0;
      const textComplete = isTextComplete(replyText);

      console.log(`[Voice Assistant Server Log] [${reqId}] Primary Response: Candidates=${candidatesCount}, FinishReason=${finishReason}, TextLength=${replyText.length}, TextComplete=${textComplete}`);
      if (finishMessage) {
        console.log(`[Voice Assistant Server Log] [${reqId}] FinishMessage: ${finishMessage}`);
      }

      const isNormalFinish = finishReason === 'STOP';
      isFinalSuccess = isNormalFinish && textComplete;

      // Single retry ONLY if response text was incomplete/truncated
      if (!isFinalSuccess) {
        console.warn(`[Voice Assistant Server Log] [${reqId}] Primary output incomplete. Retrying once with completion prompt...`);
        const retryPrompt = `${message}\n\nReply in 2 complete concise sentences. End with proper punctuation. Do not cut off mid-sentence.`;

        const retryResponse = await withTimeout(
          ai.models.generateContent({
            model: selectedModel,
            contents: retryPrompt,
            config: {
              systemInstruction,
              temperature: 0.3,
              maxOutputTokens: 768,
            },
          }),
          SERVER_TIMEOUT_MS
        );

        const retryText = retryResponse.text || '';
        const retryCandidate = retryResponse.candidates?.[0];
        const retryFinishReason = retryCandidate?.finishReason || (retryCandidate as { finish_reason?: string })?.finish_reason || 'UNKNOWN';
        const retryComplete = isTextComplete(retryText);

        console.log(`[Voice Assistant Server Log] [${reqId}] Retry Response: FinishReason=${retryFinishReason}, TextLength=${retryText.length}, TextComplete=${retryComplete}`);

        if (retryFinishReason === 'STOP' && retryComplete) {
          replyText = retryText;
          isFinalSuccess = true;
        }
      }
    } catch (err: unknown) {
      const elapsedMs = Date.now() - startTime;
      const errStr = String(err);
      const isTimeout = errStr.includes('SERVER_TIMEOUT') || errStr.toLowerCase().includes('timeout');

      console.error(`[Voice Assistant Server Log] [${reqId}] generateContent threw error (Elapsed: ${elapsedMs}ms, IsTimeout: ${isTimeout}):`, err instanceof Error ? err.message : errStr);

      if (isTimeout) {
        return NextResponse.json(
          {
            reply: 'The assistant is taking longer than expected. Please try again or type a shorter question.',
            error: 'AI response timed out.',
            configured: true,
          },
          { status: 504 }
        );
      }

      throw err; // Pass to main catch block for status categorization
    }

    const elapsedMs = Date.now() - startTime;

    if (!isFinalSuccess || !replyText || replyText.trim() === '') {
      console.error(`[Voice Assistant Server Log] [${reqId}] Failed to produce complete response after retry. Elapsed: ${elapsedMs}ms`);
      return NextResponse.json(
        {
          reply: 'I could not produce a complete response right now. Please try asking your question again.',
          error: 'Incomplete output from AI provider.',
          configured: true,
        },
        { status: 503 }
      );
    }

    console.log(`[Voice Assistant Server Log] [${reqId}] Generation SUCCESS. Elapsed: ${elapsedMs}ms, FinalLength: ${replyText.length}`);
    return NextResponse.json({ reply: replyText, configured: true }, { status: 200 });

  } catch (error: unknown) {
    const elapsedMs = Date.now() - startTime;
    const errMessage = error instanceof Error ? error.message : String(error);
    const errName = error instanceof Error ? error.name : 'UnknownError';
    const errLower = errMessage.toLowerCase();

    const isAuthError = errMessage.includes('401') || errMessage.includes('403') || errLower.includes('invalid') || errLower.includes('unauthorized') || errLower.includes('permission');
    const isRateLimit = errMessage.includes('429') || errLower.includes('quota') || errLower.includes('rate');
    const statusCode = isAuthError ? 401 : isRateLimit ? 429 : 500;
    const errCategory = isAuthError ? 'auth' : isRateLimit ? 'rate_limit' : 'provider';

    console.error('================================================================================');
    console.error(`=== [Voice Assistant Server API Error Details - ${reqId}] ===`);
    console.error(`Timestamp: ${new Date().toISOString()} | Elapsed: ${elapsedMs}ms`);
    console.error(`Category: ${errCategory} | Provider HTTP status: ${statusCode}`);
    console.error(`Error Name: ${errName} | Safe Message: ${errMessage}`);
    if (error instanceof Error && error.stack) {
      console.error(`Error Stack: ${error.stack}`);
    }
    console.error('================================================================================');

    if (isAuthError) {
      return NextResponse.json(
        {
          reply: 'The assistant service is currently unavailable due to an authorization issue. Please check server configuration.',
          error: 'Authorization failure.',
          configured: true,
        },
        { status: 401 }
      );
    }

    if (isRateLimit) {
      return NextResponse.json(
        {
          reply: 'The assistant is receiving too many requests. Please wait a minute and try again.',
          error: 'Rate limit exceeded.',
          configured: true,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        reply: 'The assistant service encountered a temporary error. Please try again.',
        error: 'Assistant service temporary error.',
        configured: true,
      },
      { status: 500 }
    );
  }
}
