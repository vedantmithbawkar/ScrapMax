'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n/context';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

// ─── Debug flag: set NEXT_PUBLIC_STT_DEBUG=true to enable local transcript
// display without calling Gemini. Remove / set to false for production.
const STT_DEBUG = process.env.NEXT_PUBLIC_STT_DEBUG === 'true';

// ─── Native sound-activity tracking: set true when browser reports onsoundstart
// Used only to improve the no-speech error message. No custom audio processing.

// ─── STT state machine phases
type SttPhase =
  | 'idle'
  | 'requesting-permission'
  | 'checking-mic'
  | 'listening'
  | 'processing'
  | 'error';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

// Global declaration for SpeechRecognition window properties
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

export default function VoiceAssistantWidget() {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const { speak, stop, isSpeaking } = useTextToSpeech();

  // ─── Chat state
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // ─── STT state
  const [sttPhase, setSttPhase] = useState<SttPhase>('idle');
  const [interimText, setInterimText] = useState('');
  const [sttStatusMsg, setSttStatusMsg] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    return false;
  });
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [micErrorDetails, setMicErrorDetails] = useState<string | null>(null);

  // ─── Gemini request lifecycle refs
  const isRequestInFlightRef = useRef<boolean>(false);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const activeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef<number>(0);

  // ─── STT session lifecycle refs
  const sttSessionIdRef = useRef<number>(0);
  const isSttStartingRef = useRef<boolean>(false); // synchronous double-click guard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  const hasSubmittedRef = useRef<boolean>(false);
  const endedByUserRef = useRef<boolean>(false);
  const recognitionErrorRef = useRef<string | null>(null);

  // ─── Audio preflight resource refs
  const preflightStreamRef = useRef<MediaStream | null>(null);
  // true = browser fired onsoundstart during this session (native mic activity confirmation)
  const soundHeardRef = useRef<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ─── Route exclusion: never render on frozen admin/payments/analytics/epr routes
  const isForbiddenRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/payments') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/epr');

  // ─── Log STT support once on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      console.log(`[STT] session=0 support=${!!SR}`);
    }
  }, []);

  // ─── Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, interimText, scrollToBottom]);

  // ────────────────────────────────────────────────────────────────────
  // PREFLIGHT RESOURCE CLEANUP
  // Centralized: called on onend, onerror, stopRecording, tab-hidden, unmount
  // ────────────────────────────────────────────────────────────────────
  const cleanupPreflightResources = useCallback((reason: string) => {
    console.log(`[STT] cleanup=${reason}`);
    if (preflightStreamRef.current) {
      preflightStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch { /* ignore */ }
      });
      preflightStreamRef.current = null;
    }
  }, []);

  // ────────────────────────────────────────────────────────────────────
  // RATE LIMIT COOLDOWN
  // ────────────────────────────────────────────────────────────────────
  const clearCooldownTimer = useCallback(() => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
    setCooldownSeconds(0);
  }, []);

  const startRateLimitCooldown = useCallback((seconds = 60) => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
    console.log('[VoiceAssistantWidget] rate-limit cooldown started');
    setCooldownSeconds(seconds);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
          console.log('[VoiceAssistantWidget] rate-limit cooldown ended');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ────────────────────────────────────────────────────────────────────
  // FETCH LIFECYCLE HELPERS
  // ────────────────────────────────────────────────────────────────────
  const cancelInFlightRequest = useCallback(() => {
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
      activeTimeoutRef.current = null;
    }
    if (activeAbortControllerRef.current) {
      try { activeAbortControllerRef.current.abort(); } catch { /* ignore */ }
      activeAbortControllerRef.current = null;
    }
    isRequestInFlightRef.current = false;
    setIsLoading(false);
  }, []);

  // ────────────────────────────────────────────────────────────────────
  // STOP RECORDING — invalidates session ID first, then releases resources
  // ────────────────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    // Invalidate any pending async callback for the current session
    sttSessionIdRef.current += 1;
    endedByUserRef.current = true;
    isSttStartingRef.current = false;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    cleanupPreflightResources('stopRecording');

    setSttPhase('idle');
    setInterimText('');
    setSttStatusMsg(null);
  }, [cleanupPreflightResources]);

  // ────────────────────────────────────────────────────────────────────
  // UNMOUNT / VISIBILITY CLEANUP
  // ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopRecording();
      cancelInFlightRequest();
      clearCooldownTimer();
      cleanupPreflightResources('unmount');
    };
  }, [stopRecording, cancelInFlightRequest, clearCooldownTimer, cleanupPreflightResources]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Abort STT and preflight on tab-hidden; keep text Gemini fetch alive
        if (recognitionRef.current || isSttStartingRef.current) {
          stopRecording();
          cleanupPreflightResources('tab-hidden');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stopRecording, cleanupPreflightResources]);

  // ────────────────────────────────────────────────────────────────────
  // GEMINI SEND HANDLER (unchanged behavior)
  // ────────────────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (textToSend: string) => {
      if (isRequestInFlightRef.current || isLoading || cooldownSeconds > 0) return;
      const trimmed = textToSend.trim();
      if (!trimmed) return;

      isRequestInFlightRef.current = true;
      requestIdRef.current += 1;
      const currentReqId = requestIdRef.current;

      if (activeTimeoutRef.current) { clearTimeout(activeTimeoutRef.current); activeTimeoutRef.current = null; }
      if (activeAbortControllerRef.current) {
        try { activeAbortControllerRef.current.abort(); } catch { /* ignore */ }
        activeAbortControllerRef.current = null;
      }

      const controller = new AbortController();
      activeAbortControllerRef.current = controller;
      activeTimeoutRef.current = setTimeout(() => {
        try { controller.abort(); } catch { /* ignore */ }
      }, 30000);

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setInterimText('');
      setIsLoading(true);
      stop();

      try {
        const response = await fetch('/api/voice-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, locale }),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));
        console.log('[VoiceAssistantWidget] Response status:', response.status, 'Payload:', data);

        if (requestIdRef.current !== currentReqId) return;

        let replyText = data?.reply;
        const is429 = response.status === 429 || data?.error?.toLowerCase().includes('rate');

        if (is429) {
          replyText = 'The assistant is receiving too many requests. Please wait a minute and try again.';
          startRateLimitCooldown(60);
        } else if (!replyText || typeof replyText !== 'string') {
          if (response.status === 504 || data?.error?.toLowerCase().includes('time')) {
            replyText = 'The assistant took too long to respond. Please try again.';
          } else {
            replyText = 'The assistant is temporarily unavailable. Please try again.';
          }
        }

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        if (response.ok && !data?.error && data?.reply && typeof document !== 'undefined' && !document.hidden) {
          speak(replyText, locale);
        }
      } catch (err: unknown) {
        if (requestIdRef.current !== currentReqId) return;
        const isAbort = (err as { name?: string })?.name === 'AbortError';
        console.error('Voice assistant request failed (isAbort:', isAbort, '):', err);
        const errorText = isAbort
          ? 'The assistant took too long to respond. Please try again.'
          : 'The assistant is temporarily unavailable. Please try again.';
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: errorText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      } finally {
        if (activeTimeoutRef.current) { clearTimeout(activeTimeoutRef.current); activeTimeoutRef.current = null; }
        if (activeAbortControllerRef.current === controller) activeAbortControllerRef.current = null;
        if (requestIdRef.current === currentReqId) {
          isRequestInFlightRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [cooldownSeconds, isLoading, locale, speak, startRateLimitCooldown, stop]
  );

  // ────────────────────────────────────────────────────────────────────
  // MIC TOGGLE — full STT state machine with getUserMedia preflight
  // ────────────────────────────────────────────────────────────────────
  const toggleListening = useCallback(() => {
    // ── If active: stop current session
    if (
      sttPhase === 'requesting-permission' ||
      sttPhase === 'checking-mic' ||
      sttPhase === 'listening' ||
      sttPhase === 'processing' ||
      isSttStartingRef.current
    ) {
      stopRecording();
      return;
    }

    // ── Guard: blocked by Gemini request or cooldown
    if (isRequestInFlightRef.current || isLoading || cooldownSeconds > 0) {
      // Show inline status — not a persistent error
      setSttStatusMsg(isLoading ? 'Wait for the current assistant response.' : `Wait ${cooldownSeconds}s before asking another question.`);
      return;
    }

    // ── Support check: SpeechRecognition API
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.log('[STT] session=0 support=false');
      setIsSpeechSupported(false);
      return;
    }

    // ── Support check: getUserMedia
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicErrorDetails('Your browser does not support microphone access. Please use Chrome or Edge and type your question.');
      setSttPhase('error');
      return;
    }

    // ── Begin new session — synchronous guards first
    isSttStartingRef.current = true;
    sttSessionIdRef.current += 1;
    const sessionId = sttSessionIdRef.current;

    // Reset session-scoped state
    finalTranscriptRef.current = '';
    hasSubmittedRef.current = false;
    endedByUserRef.current = false;
    recognitionErrorRef.current = null;
    soundHeardRef.current = false;
    setInterimText('');
    setMicErrorDetails(null);
    setMicPermissionDenied(false);
    setSttStatusMsg(STT_DEBUG ? 'Permission requested...' : null);
    setSttPhase('requesting-permission');

    const targetLang = locale === 'hi' ? 'hi-IN' : locale === 'mr' ? 'mr-IN' : 'en-US';
    console.log(`[STT] session=${sessionId} locale=${locale} lang=${targetLang}`);
    console.log(`[STT] session=${sessionId} preflight=started`);

    // ── STEP 1: getUserMedia preflight
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        // Session still current?
        if (sessionId !== sttSessionIdRef.current) {
          stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
          console.log(`[STT] session=${sessionId} preflight=stale-after-grant`);
          return;
        }

        console.log(`[STT] session=${sessionId} preflight=granted`);
        preflightStreamRef.current = stream;

        // ── STEP 2: Inspect audio track health
        const tracks = stream.getAudioTracks();
        const track = tracks[0];
        const trackLive = !!track && track.readyState === 'live' && track.enabled;
        const hasDevice = !!track?.getSettings().deviceId; // presence-only, never logged

        console.log(`[STT] session=${sessionId} preflight=track-live=${trackLive} hasDevice=${hasDevice}`);

        if (!trackLive) {
          if (sessionId !== sttSessionIdRef.current) return;
          setMicErrorDetails('No microphone audio is available. Check that the correct input device is connected and selected.');
          setSttPhase('error');
          cleanupPreflightResources('track-not-live');
          isSttStartingRef.current = false;
          return;
        }

        // ── STEP 3: Verify session is still current before starting recognition
        if (sessionId !== sttSessionIdRef.current) {
          cleanupPreflightResources('stale-after-track-check');
          isSttStartingRef.current = false;
          return;
        }

        setSttPhase('checking-mic');
        if (STT_DEBUG) setSttStatusMsg('Mic ready. Starting recognition...');

        // ── STEP 4: Create and start SpeechRecognition
        let recognition: typeof recognitionRef.current;
        try {
          recognition = new SR();
        } catch {
          if (sessionId !== sttSessionIdRef.current) return;
          setMicErrorDetails('Unable to initialize speech recognition. Please try again.');
          setSttPhase('error');
          cleanupPreflightResources('sr-init-failed');
          isSttStartingRef.current = false;
          return;
        }

        recognition.lang = targetLang;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // ── onstart
        recognition.onstart = () => {
          if (sessionId !== sttSessionIdRef.current) return;
          console.log(`[STT] session=${sessionId} recognition=start`);
          setSttPhase('listening');
          setMicPermissionDenied(false);
          setMicErrorDetails(null);
          setInterimText('');
          if (STT_DEBUG) setSttStatusMsg('Listening...');
          isSttStartingRef.current = false;
        };

        // ── onsoundstart: native browser confirmation that mic is delivering audio
        // Use this as proof-of-signal instead of a hand-rolled AudioContext meter
        recognition.onsoundstart = () => {
          if (sessionId !== sttSessionIdRef.current) return;
          soundHeardRef.current = true;
          console.log(`[STT] session=${sessionId} recognition=audiostart`);
          if (STT_DEBUG) setSttStatusMsg('Sound detected...');
        };
        recognition.onspeechstart = () => {
          if (sessionId !== sttSessionIdRef.current) return;
          console.log(`[STT] session=${sessionId} recognition=speechstart`);
          if (STT_DEBUG) setSttStatusMsg('Speech detected...');
        };
        recognition.onspeechend = () => {
          if (sessionId !== sttSessionIdRef.current) return;
          console.log(`[STT] session=${sessionId} recognition=speechend`);
        };

        // ── onresult
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          if (sessionId !== sttSessionIdRef.current) return;
          let interim = '';
          let hasFinal = false;
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
              finalTranscriptRef.current += res[0].transcript;
              hasFinal = true;
            } else {
              interim += res[0].transcript;
            }
          }
          console.log(`[STT] session=${sessionId} result-final=${hasFinal} length=${(finalTranscriptRef.current + interim).length}`);
          setInterimText(interim);
          if (STT_DEBUG && hasFinal) setSttStatusMsg('Speech result received.');
        };

        // ── onerror
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          if (sessionId !== sttSessionIdRef.current) return;
          const errCode: string = event.error || 'unknown';
          console.log(`[STT] session=${sessionId} recognition=error=${errCode}`);

          cleanupPreflightResources(`onerror-${errCode}`);

          // Silently handle intentional aborts
          if (errCode === 'aborted') {
            endedByUserRef.current = true;
            setSttPhase('idle');
            setSttStatusMsg(null);
            return;
          }

          recognitionErrorRef.current = errCode;
          setSttPhase('error');
          isSttStartingRef.current = false;

          if (errCode === 'no-speech') {
            // Distinguish hardware silence vs recognition service failure using
            // native onsoundstart event (no custom AudioContext meter needed)
            if (soundHeardRef.current) {
              setMicErrorDetails(
                'Your microphone is working, but speech recognition did not detect words. Speak clearly after the listening indicator appears, or type your question.'
              );
            } else {
              setMicErrorDetails(
                'No speech was detected. Please speak clearly after the listening indicator appears, or type your question.'
              );
            }
          } else if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
            setMicPermissionDenied(true);
            setMicErrorDetails(
              'Microphone access is blocked. Allow microphone access in the browser and Windows settings, then try again.'
            );
          } else if (errCode === 'audio-capture') {
            setMicErrorDetails(
              'No microphone audio is available. Check that the correct input device is connected and selected.'
            );
          } else if (errCode === 'network') {
            setMicErrorDetails(
              'Speech recognition is unavailable right now. Check your internet connection or type your question.'
            );
          } else if (errCode === 'language-not-supported') {
            setMicErrorDetails(
              'Voice recognition is not available for this language in this browser. You can type your question instead.'
            );
          } else {
            setMicErrorDetails(`Voice input stopped unexpectedly [${errCode}]. Please try again or type your question.`);
          }
        };

        // ── onend
        recognition.onend = () => {
          if (sessionId !== sttSessionIdRef.current) return;
          console.log(`[STT] session=${sessionId} recognition=end`);

          cleanupPreflightResources('onend');
          recognitionRef.current = null;
          isSttStartingRef.current = false;

          const transcript = finalTranscriptRef.current.trim();
          const shouldSubmit =
            !hasSubmittedRef.current &&
            !endedByUserRef.current &&
            !recognitionErrorRef.current &&
            !isRequestInFlightRef.current &&
            transcript.length > 0;

          setInterimText('');

          if (!shouldSubmit) {
            setSttPhase('idle');
            setSttStatusMsg(null);
            return;
          }

          hasSubmittedRef.current = true;
          finalTranscriptRef.current = '';

          if (STT_DEBUG) {
            // Debug mode: show transcript locally, NO Gemini call, NO TTS
            setSttPhase('idle');
            setSttStatusMsg(null);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                text: `Speech recognized: "${transcript}"`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          } else {
            // Normal path: reuse existing guarded send handler
            // handleSendMessage has its own cooldown/in-flight guards as final truth
            setSttPhase('idle');
            setSttStatusMsg(null);
            handleSendMessage(transcript);
          }
        };

        // Verify session once more before start()
        if (sessionId !== sttSessionIdRef.current) {
          cleanupPreflightResources('stale-before-start');
          isSttStartingRef.current = false;
          return;
        }

        recognitionRef.current = recognition;
        console.log(`[STT] session=${sessionId} recognition=start`);
        try {
          recognition.start();
        } catch {
          console.log(`[STT] session=${sessionId} recognition=start-exception`);
          if (sessionId !== sttSessionIdRef.current) return;
          setMicErrorDetails('Unable to start voice recognition. Please try again.');
          setSttPhase('error');
          cleanupPreflightResources('start-exception');
          recognitionRef.current = null;
          isSttStartingRef.current = false;
        }
      })
      .catch((err: unknown) => {
        if (sessionId !== sttSessionIdRef.current) return;
        isSttStartingRef.current = false;
        setSttPhase('error');
        cleanupPreflightResources('getUserMedia-failed');

        const errName = (err as { name?: string })?.name || '';
        console.log(`[STT] session=${sessionId} preflight=failed`);

        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setMicPermissionDenied(true);
          setMicErrorDetails(
            'Microphone access is blocked. Allow microphone access in the browser and Windows settings, then try again.'
          );
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setMicErrorDetails(
            'No microphone was found. Check that a microphone is connected and recognized by the system.'
          );
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          setMicErrorDetails(
            'Microphone is in use by another application. Close Meet, Teams, Zoom, or other audio apps and try again.'
          );
        } else if (errName === 'OverconstrainedError') {
          setMicErrorDetails(
            'Microphone configuration is not compatible. Try selecting a different input device in browser settings.'
          );
        } else if (errName === 'SecurityError') {
          setMicErrorDetails(
            'Microphone access is restricted by security policy. Ensure this page is served over HTTPS.'
          );
        } else if (errName === 'TypeError') {
          setMicErrorDetails(
            'Unsupported audio configuration in this browser. Please type your question instead.'
          );
        } else {
          setMicErrorDetails(
            'Microphone access failed. Check browser permissions and try again, or type your question.'
          );
        }
      });
  }, [
    cleanupPreflightResources,
    cooldownSeconds,
    handleSendMessage,
    isLoading,
    locale,
    sttPhase,
    stopRecording,
  ]);

  if (isForbiddenRoute) return null;

  // ────────────────────────────────────────────────────────────────────
  // LOCALIZATION HELPER (inline map — no i18n dict edits required)
  // ────────────────────────────────────────────────────────────────────
  const getLocalizedText = (key: string): string => {
    const defaultTexts: Record<string, Record<string, string>> = {
      title: { en: 'ScrapMax Assistant', hi: 'स्क्रैपमैक्स सहायक', mr: 'स्क्रॅपमॅक्स सहाय्यक' },
      subtitle: { en: 'Ask recycling & pickup questions', hi: 'रीसायकलिंग और पिकअप सवाल पूछें', mr: 'रिसायकलिंग व पिकअप प्रश्न विचारा' },
      listening: { en: 'Listening...', hi: 'सुन रहा है...', mr: 'ऐकत आहे...' },
      thinking: { en: 'Thinking...', hi: 'सोच रहा है...', mr: 'विचार करत आहे...' },
      placeholder: { en: 'Type your message...', hi: 'अपना संदेश लिखें...', mr: 'तुमचा संदेश लिहा...' },
      micUnsupported: {
        en: 'Voice input not supported in this browser. Please type below.',
        hi: 'इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया नीचे टाइप करें।',
        mr: 'या ब्राउझरमध्ये व्हॉइस इनपुट समर्थित नाही. कृपया खाली टाईप करा.',
      },
      welcomeMessage: {
        en: 'Hello! I am your ScrapMax Assistant. How can I help you with recycling, waste categories, or booking a pickup today?',
        hi: 'नमस्ते! मैं आपका स्क्रैपमैक्स सहायक हूँ। आज मैं रीसायकलिंग, कचरा श्रेणियों या पिकअप बुकिंग में आपकी कैसे मदद कर सकता हूँ?',
        mr: 'नमस्कार! मी तुमचा स्क्रॅपमॅक्स सहाय्यक आहे. आज मी रिसायकलिंग, कचरा प्रकार किंवा पिकअप बुकिंगमध्ये तुम्हाला कशी मदत करू शकतो?',
      },
    };
    return defaultTexts[key]?.[locale] ?? defaultTexts[key]?.en ?? t(key);
  };

  // ── Derived UI booleans
  const isListening = sttPhase === 'listening';
  const isSttActive = sttPhase === 'requesting-permission' || sttPhase === 'checking-mic' || sttPhase === 'listening' || sttPhase === 'processing';
  const isControlDisabled = isLoading || cooldownSeconds > 0;
  const showMicError = sttPhase === 'error' || !isSpeechSupported || micPermissionDenied || !!micErrorDetails;

  const micAriaLabel = isSttActive ? 'Stop voice input' : 'Start voice input';
  const micTitle =
    cooldownSeconds > 0 ? `Assistant temporarily rate-limited; wait ${cooldownSeconds} seconds`
    : isLoading ? 'Wait for the current assistant response'
    : isSttActive ? 'Stop voice input'
    : 'Start voice input';
  const sendTitle = cooldownSeconds > 0
    ? `Assistant temporarily rate-limited; wait ${cooldownSeconds} seconds`
    : 'Send message';

  return (
    <>
      {/* ── Floating Action Button */}
      <div className="fixed bottom-20 right-4 sm:right-6 z-50">
        <button
          type="button"
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
            } else {
              setIsOpen(false);
              stop();
              stopRecording();
              cancelInFlightRequest();
              clearCooldownTimer();
              cleanupPreflightResources('drawer-close');
            }
          }}
          className={`relative group p-3.5 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
            isListening
              ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-300'
              : isSpeaking
              ? 'bg-[#136B3B] text-white ring-4 ring-[#136B3B]/30'
              : 'bg-[#136B3B] hover:bg-[#0E522D] text-white hover:scale-105'
          }`}
          aria-label={isListening ? 'Stop voice input' : 'Open ScrapMax Assistant'}
          title={isListening ? 'Stop voice input' : 'Open ScrapMax Assistant'}
        >
          {isListening && <span className="absolute -inset-1 rounded-full bg-red-400 opacity-75 animate-ping" />}
          <svg className="w-6 h-6 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isSpeaking ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
          <span className="absolute -top-1 -right-1 bg-amber-400 text-xs text-gray-900 font-bold px-1.5 py-0.5 rounded-full border-2 border-white uppercase text-[10px]">AI</span>
        </button>
      </div>

      {/* ── Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[520px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">

          {/* Header */}
          <div className="bg-[#136B3B] text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">🎙️</div>
              <div>
                <h3 className="font-semibold text-sm leading-snug">{getLocalizedText('title')}</h3>
                <p className="text-[11px] text-emerald-100 font-medium">{getLocalizedText('subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              {isSpeaking && (
                <button type="button" onClick={stop}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-xs font-semibold rounded text-white flex items-center space-x-1 transition-all"
                  title="Stop audio speech">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
                  <span>Mute</span>
                </button>
              )}
              <span className="px-2 py-0.5 bg-white/10 rounded text-[11px] font-mono uppercase tracking-wider text-emerald-100">{locale}</span>
              <button type="button"
                onClick={() => {
                  setIsOpen(false);
                  stop();
                  stopRecording();
                  cancelInFlightRequest();
                  clearCooldownTimer();
                  cleanupPreflightResources('close-button');
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition-all"
                aria-label="Close Assistant">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#F8FAFC]">
            {/* Welcome */}
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-full bg-[#136B3B] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">AI</div>
              <div className="bg-white text-gray-800 p-3 rounded-2xl rounded-tl-none text-xs border border-gray-100 shadow-sm max-w-[85%] leading-relaxed">
                {getLocalizedText('welcomeMessage')}
              </div>
            </div>

            {/* Message history */}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start space-x-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#136B3B] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">AI</div>
                )}
                <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#136B3B] text-white rounded-tr-none shadow-sm'
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
                }`}>
                  <p>{msg.text}</p>
                  <span className={`block text-[9px] mt-1 ${msg.role === 'user' ? 'text-emerald-200 text-right' : 'text-gray-400'}`}>{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Interim live transcript bubble */}
            {isListening && (
              <div className="flex justify-end" aria-live="polite">
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-2xl rounded-tr-none text-xs border border-emerald-200 shadow-sm italic animate-pulse max-w-[85%]">
                  <span className="font-semibold not-italic">🎙️ {getLocalizedText('listening')}</span>{' '}
                  {interimText ? `"${interimText}"` : ''}
                </div>
              </div>
            )}

            {/* Requesting permission / checking-mic spinner (shows interim state) */}
            {(sttPhase === 'requesting-permission' || sttPhase === 'checking-mic') && !isListening && (
              <div className="flex justify-end" aria-live="polite">
                <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-2xl rounded-tr-none text-xs border border-emerald-200 shadow-sm animate-pulse max-w-[85%]">
                  🎙️ {sttPhase === 'requesting-permission' ? 'Requesting microphone...' : 'Checking microphone signal...'}
                </div>
              </div>
            )}

            {/* Gemini loading indicator */}
            {isLoading && (
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#136B3B] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">AI</div>
                <div className="bg-white text-gray-500 p-3 rounded-2xl rounded-tl-none text-xs border border-gray-100 shadow-sm flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#136B3B] animate-ping" />
                  <span>{getLocalizedText('thinking')}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* STT Debug panel — only when NEXT_PUBLIC_STT_DEBUG=true */}
          {STT_DEBUG && sttStatusMsg && (
            <div className="px-3 py-1.5 bg-blue-50 border-t border-blue-200 text-[11px] text-blue-800" aria-live="polite">
              <span className="font-semibold">🔧 STT Debug:</span> {sttStatusMsg}
            </div>
          )}

          {/* Rate-limit cooldown banner */}
          {cooldownSeconds > 0 && (
            <div className="px-3 py-1.5 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-800">
              <span className="font-semibold text-amber-900">⏳ Please wait {cooldownSeconds}s before asking another question.</span>
            </div>
          )}

          {/* STT error / unsupported banner */}
          {showMicError && cooldownSeconds === 0 && (
            <div className="px-3 py-1.5 bg-amber-50 border-t border-amber-200 text-[11px]" aria-live="polite">
              <span className="font-semibold text-red-700">⚠️ {micErrorDetails || getLocalizedText('micUnsupported')}</span>
            </div>
          )}

          {/* Footer controls */}
          <div className="p-3 bg-white border-t border-gray-200 flex items-center space-x-2">
            {/* Mic button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isControlDisabled || !isSpeechSupported}
              aria-disabled={isControlDisabled || !isSpeechSupported}
              aria-label={micAriaLabel}
              title={micTitle}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : isSttActive
                  ? 'bg-amber-400 text-gray-900'
                  : 'bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-[#136B3B]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Text input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(inputText); }
              }}
              placeholder={getLocalizedText('placeholder')}
              disabled={isControlDisabled}
              aria-disabled={isControlDisabled}
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#136B3B]/20 focus:border-[#136B3B] transition-all disabled:opacity-50"
            />

            {/* Send button */}
            <button
              type="button"
              onClick={() => handleSendMessage(inputText)}
              disabled={isControlDisabled || !inputText.trim()}
              aria-disabled={isControlDisabled || !inputText.trim()}
              aria-label="Send message"
              title={sendTitle}
              className="p-2.5 bg-[#136B3B] hover:bg-[#0E522D] text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
