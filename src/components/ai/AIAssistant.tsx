'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  X,
  Loader2,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { useI18n } from '@/i18n/context';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { createClient } from '@/lib/supabase/client';
import { AppUserRole, CommandContext, CommandIntent } from '@/lib/ai/commandTypes';
import { IntentResolver } from '@/lib/ai/intentResolver';
import { checkCommandPermission } from '@/lib/ai/permissionChecker';
import { CommandExecutor } from '@/lib/ai/commandExecutor';
import { getSuggestedCommands } from '@/lib/ai/commandRegistry';
import { fetchNearbyKabadiwalas } from '@/lib/kabadiwala-service';
import { NearbyKabadiwala } from '@/types';
import { AIConfirmationModal } from './AIConfirmationModal';

interface CommandLogItem {
  id: string;
  query: string;
  role: 'user' | 'assistant';
  intent?: CommandIntent;
  feedback: string;
  status: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  dealers?: NearbyKabadiwala[];
  isLoadingDealers?: boolean;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: { results: Array<Array<{ transcript: string }>> }) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

function getInitialRole(path: string | null): AppUserRole {
  if (!path) return 'guest';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/collector')) return 'collector';
  if (path.startsWith('/household')) return 'household';
  return 'guest';
}

export default function AIAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();
  const { speak, stop, isSpeaking } = useTextToSpeech();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<AppUserRole>(() =>
    getInitialRole(typeof window !== 'undefined' ? window.location.pathname : pathname)
  );
  const [commandLogs, setCommandLogs] = useState<CommandLogItem[]>([]);

  // Confirmation Modal State
  const [pendingIntent, setPendingIntent] = useState<CommandIntent | null>(null);
  const [confirmationSummary, setConfirmationSummary] = useState<string>('');
  const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false);

  // Speech & Counter Refs
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const intentResolverRef = useRef<IntentResolver>(new IntentResolver());
  const commandExecutorRef = useRef<CommandExecutor>(new CommandExecutor());
  const cmdCounterRef = useRef<number>(0);

  // Detect user role from Supabase session & active route
  useEffect(() => {
    async function loadUserRole() {
      // Synchronously set initial role from active pathname to eliminate initial race condition
      const fallbackRole = getInitialRole(pathname);
      setUserRole(fallbackRole);

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (data?.role) {
            setUserRole(data.role as AppUserRole);
            return;
          }
          setUserRole((user.user_metadata?.role as AppUserRole) || 'household');
        }
      } catch {
        console.warn('[AI] Error fetching session user role. Defaulting to route fallback.');
        setUserRole(fallbackRole);
      }
    }
    loadUserRole();
  }, [pathname]);

  const handleProcessCommandRef = useRef<(input: string) => Promise<void>>(async () => {});

  // Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as unknown as Record<string, new () => ISpeechRecognition>).SpeechRecognition ||
        (window as unknown as Record<string, new () => ISpeechRecognition>).webkitSpeechRecognition;

      if (SpeechRecognition) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // ignore
          }
        }

        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = locale === 'mr' ? 'mr-IN' : locale === 'hi' ? 'hi-IN' : 'en-US';

        rec.onresult = (event: { results: Array<Array<{ transcript: string }>> }) => {
          const transcript = event.results[0][0]?.transcript || '';
          console.log('[AI STT] SpeechRecognition result transcript:', transcript);
          if (transcript) {
            setInputText(transcript);
            if (handleProcessCommandRef.current) {
              handleProcessCommandRef.current(transcript);
            }
          }
          setIsListening(false);
        };

        rec.onerror = (event: { error: string }) => {
          console.warn('[AI STT] SpeechRecognition event error:', event.error);
          setIsListening(false);

          const errFeedback =
            event.error === 'no-speech'
              ? 'No speech detected. Please speak clearly into your microphone.'
              : event.error === 'not-allowed'
              ? 'Microphone permission was denied by browser settings.'
              : event.error === 'audio-capture'
              ? 'No microphone hardware was detected on your device.'
              : `Voice recognition error (${event.error}). Please try typing your command.`;

          const sttErrorLog: CommandLogItem = {
            id: `cmd-${++cmdCounterRef.current}`,
            query: 'Voice Input',
            role: 'user',
            feedback: errFeedback,
            status: 'warning',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setCommandLogs((prev) => [sttErrorLog, ...prev]);
        };

        rec.onend = () => {
          console.log('[AI STT] SpeechRecognition ended.');
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [locale]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      const generateId = () => `cmd-${++cmdCounterRef.current}`;
      const noSpeechMsg: CommandLogItem = {
        id: generateId(),
        query: 'Voice Input',
        role: 'user',
        feedback: 'Voice input is not supported in this browser. Please type your command.',
        status: 'warning',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setCommandLogs((prev) => [noSpeechMsg, ...prev]);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stop();
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('[AI] STT start exception:', err);
        setIsListening(false);
      }
    }
  };

  // Handle GPS Nearby Collector Search
  const handleFindNearbyCollectors = async (logId: string) => {
    setCommandLogs((prev) =>
      prev.map((log) => (log.id === logId ? { ...log, isLoadingDealers: true } : log))
    );

    try {
      let lat = 12.9716;
      let lng = 77.5946;
      let locDenied = false;

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          locDenied = true;
        }
      }

      const dealers = await fetchNearbyKabadiwalas(lat, lng);
      setCommandLogs((prev) =>
        prev.map((log) =>
          log.id === logId
            ? {
                ...log,
                dealers,
                isLoadingDealers: false,
                feedback: locDenied
                  ? 'Location access was denied or unavailable. Showing default nearby collectors.'
                  : log.feedback,
              }
            : log
        )
      );
    } catch {
      setCommandLogs((prev) =>
        prev.map((log) => (log.id === logId ? { ...log, isLoadingDealers: false } : log))
      );
    }
  };

  // Main Command Processing Pipeline
  const handleProcessCommand = async (rawInput: string) => {
    const query = rawInput.trim();
    if (!query) return;

    setInputText('');
    setIsProcessing(true);
    stop();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Construct Context
    const context: CommandContext = {
      role: userRole,
      pathname,
      locale,
    };

    // 2. Resolve Intent (Fast-path + Gemini fallback)
    const intent = await intentResolverRef.current.resolveIntent(query, context);

    const generateId = () => `cmd-${++cmdCounterRef.current}`;

    if (!intent) {
      const translatedFallback = t('assistantActions.UNKNOWN_COMMAND');
      const fallbackFeedback =
        translatedFallback && translatedFallback !== 'assistantActions.UNKNOWN_COMMAND'
          ? translatedFallback
          : "I didn't understand that command. Try: 'Show my earnings', 'Book a pickup', or 'Show scrap prices'.";

      const unknownMsg: CommandLogItem = {
        id: generateId(),
        query,
        role: 'user',
        feedback: fallbackFeedback,
        status: 'warning',
        timestamp,
      };
      setCommandLogs((prev) => [unknownMsg, ...prev]);
      speak(unknownMsg.feedback, locale);
      setIsProcessing(false);
      return;
    }

    // 3. Check Permission
    const permCheck = checkCommandPermission(intent, context);
    if (!permCheck.allowed) {
      const deniedMsg: CommandLogItem = {
        id: generateId(),
        query,
        role: 'user',
        intent,
        feedback: permCheck.reason || "You don't have permission to perform that action.",
        status: 'error',
        timestamp,
      };
      setCommandLogs((prev) => [deniedMsg, ...prev]);
      speak(deniedMsg.feedback, locale);
      setIsProcessing(false);
      return;
    }

    // 4. Execute Command (Safe vs Requires Confirmation)
    const result = commandExecutorRef.current.execute(intent, {
      navigate: (route) => router.push(route),
      switchLanguage: (newLang) => setLocale(newLang as 'en' | 'hi' | 'mr'),
      triggerCollectorSearch: () => handleFindNearbyCollectors(generateId()),
    });

    const cmdId = generateId();

    if (result.requiresConfirmation) {
      setPendingIntent(intent);
      setConfirmationSummary(result.confirmationSummary || 'Confirm Action');
      setIsConfirmationOpen(true);

      const confirmNotice: CommandLogItem = {
        id: cmdId,
        query,
        role: 'user',
        intent,
        feedback: `Confirmation required: ${result.confirmationSummary}`,
        status: 'info',
        timestamp,
      };
      setCommandLogs((prev) => [confirmNotice, ...prev]);
      speak(`Please confirm: ${result.confirmationSummary}`, locale);
    } else {
      const successMsg: CommandLogItem = {
        id: cmdId,
        query,
        role: 'user',
        intent,
        feedback: result.feedbackMessage,
        status: 'success',
        timestamp,
      };
      setCommandLogs((prev) => [successMsg, ...prev]);
      speak(result.feedbackMessage, locale);
    }

    setIsProcessing(false);
  };

  useEffect(() => {
    handleProcessCommandRef.current = handleProcessCommand;
  });

  // Handle Action Confirmation Modal Confirm
  const handleConfirmAction = () => {
    if (!pendingIntent) return;

    if (pendingIntent.targetRoute) {
      const queryParams = pendingIntent.entities?.material
        ? `?material=${pendingIntent.entities.material}&weight=${pendingIntent.entities.weightKg || ''}`
        : '';
      router.push(`${pendingIntent.targetRoute}${queryParams}`);
    }

    const confirmedLog: CommandLogItem = {
      id: `cmd-${++cmdCounterRef.current}`,
      query: `Confirmed: ${pendingIntent.intent}`,
      role: 'assistant',
      intent: pendingIntent,
      feedback: 'Action confirmed! Opening request form...',
      status: 'success',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCommandLogs((prev) => [confirmedLog, ...prev]);
    speak('Action confirmed. Opening request form.', locale);

    setIsConfirmationOpen(false);
    setPendingIntent(null);
  };

  const suggestions = getSuggestedCommands(userRole);

  return (
    <>
      {/* ── Global Floating Trigger Button */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (isSpeaking) stop();
          }}
          className="relative group bg-[#136B3B] hover:bg-[#0E522D] text-white p-3.5 sm:p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-white/20"
          aria-label="Open AI Command Agent"
        >
          <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
          <span className="absolute -top-1 -right-1 bg-amber-400 text-gray-900 font-extrabold px-1.5 py-0.5 rounded-full text-[10px] border border-white uppercase tracking-wider">
            AGENT
          </span>
        </button>
      </div>

      {/* ── AI Command Panel Drawer */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[540px] h-[520px] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Panel Header */}
          <div className="bg-[#136B3B] text-white p-4 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                ♻️
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-snug flex items-center space-x-1.5">
                  <span>ScrapMax AI Agent</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-800/80 rounded font-mono uppercase text-emerald-200">
                    {userRole}
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100 font-medium">App Navigation & Control</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stop}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-xs font-semibold rounded text-white flex items-center space-x-1 transition"
                  title="Mute Speech"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Mute</span>
                </button>
              )}
              <span className="px-2 py-0.5 bg-white/10 rounded text-[11px] font-mono uppercase tracking-wider text-emerald-100">
                {locale}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  stop();
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Command Log Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#F8FAFC]">
            
            {/* Welcome Banner */}
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-full bg-[#136B3B] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                AI
              </div>
              <div className="bg-white text-gray-800 p-3 rounded-2xl rounded-tl-none text-xs border border-gray-100 shadow-xs max-w-[88%] leading-relaxed">
                <p className="font-semibold text-[#136B3B]">How can I assist you today?</p>
                <p className="text-gray-600 mt-1">Speak or type commands to navigate pages, view history, check scrap rates, or find collectors.</p>
              </div>
            </div>

            {/* Command History Items */}
            {commandLogs.map((log) => (
              <div key={log.id} className="space-y-2">
                
                {/* User Query Bubble */}
                <div className="flex justify-end">
                  <div className="bg-[#136B3B] text-white p-2.5 rounded-2xl rounded-tr-none text-xs max-w-[85%] shadow-xs">
                    <p className="font-medium">{log.query}</p>
                    <span className="block text-[9px] text-emerald-200 text-right mt-0.5">{log.timestamp}</span>
                  </div>
                </div>

                {/* AI Agent Feedback Bubble */}
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#136B3B] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                    AI
                  </div>
                  <div className="bg-white text-gray-800 p-3 rounded-2xl rounded-tl-none text-xs border border-gray-100 shadow-xs max-w-[88%] space-y-2">
                    
                    <div className="flex items-start space-x-1.5">
                      {log.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      {log.status === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                      {log.status === 'error' && <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                      {log.status === 'info' && <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                      <p className="font-medium text-gray-800 leading-normal">{log.feedback}</p>
                    </div>

                    {/* Matched Intent Badge */}
                    {log.intent && (
                      <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-mono border border-emerald-100">
                        <Navigation className="w-3 h-3 text-emerald-600" />
                        <span>{log.intent.intent}</span>
                      </div>
                    )}

                    {/* Dealer List Render if available */}
                    {log.dealers && log.dealers.length > 0 && (
                      <div className="pt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {log.dealers.map((dealer) => (
                          <div key={dealer.id} className="p-2 bg-emerald-50/80 rounded-lg border border-emerald-100 flex items-center justify-between text-[11px]">
                            <div>
                              <p className="font-bold text-gray-800">{dealer.name}</p>
                              <p className="text-[10px] text-gray-500">{dealer.address} • {dealer.distanceKm}km</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}

            {/* Listening Indicator */}
            {isListening && (
              <div className="flex justify-end">
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-2xl rounded-tr-none text-xs border border-emerald-200 shadow-xs italic animate-pulse">
                  <span className="font-semibold not-italic">🎙️ Listening for command...</span>
                </div>
              </div>
            )}

            {/* Processing Spinner */}
            {isProcessing && (
              <div className="flex items-center justify-center py-2 space-x-2 text-xs text-emerald-700">
                <Loader2 className="w-4 h-4 animate-spin text-[#136B3B]" />
                <span className="font-medium">Resolving command intent...</span>
              </div>
            )}
          </div>

          {/* Quick Command Suggestions */}
          <div className="p-2 bg-gray-50 border-t border-gray-100 overflow-x-auto shrink-0 flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 shrink-0">Try:</span>
            {suggestions.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => handleProcessCommand(cmd)}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-[#136B3B] text-gray-700 text-[11px] font-medium rounded-full border border-gray-200 transition shrink-0 shadow-2xs"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Command Input Controls */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessCommand(inputText);
              }}
              className="flex items-center space-x-2"
            >
              {/* STT Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                    : 'bg-emerald-50 text-[#136B3B] border-emerald-200 hover:bg-emerald-100'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice command'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or speak a command..."
                className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#136B3B] focus:bg-white text-gray-800"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="p-2.5 bg-[#136B3B] hover:bg-[#0E522D] text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Confirmation Dialog Modal */}
      <AIConfirmationModal
        isOpen={isConfirmationOpen}
        summary={confirmationSummary}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setIsConfirmationOpen(false);
          setPendingIntent(null);
        }}
      />
    </>
  );
}
