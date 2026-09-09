'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTextToSpeechReturn {
  speak: (text: string, locale?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  hasVoiceForLocale: (locale: string) => boolean;
}

function normalizeLang(lang: string): string {
  return lang.toLowerCase().replace('_', '-');
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const updateVoices = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      // window.speechSynthesis is client-only; this setState is intentionally inside
      // a useEffect to avoid server/client hydration mismatch — SSR always returns false.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSupported(true);
      updateVoices();

      // Fix for Chrome & WebKit browsers where getVoices() returns empty array initially
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
      window.speechSynthesis.addEventListener('voiceschanged', updateVoices);

      return () => {
        if ('onvoiceschanged' in window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
        window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      };
    } else {
      // SSR guard: no Speech API available — keep default false state.
      setIsSupported(false);
    }
  }, [updateVoices]);

  const hasVoiceForLocale = useCallback(
    (locale: string): boolean => {
      if (!isSupported || voices.length === 0) return false;
      const targetPrefix = locale === 'hi' ? 'hi' : locale === 'mr' ? 'mr' : 'en';
      return voices.some((v) => normalizeLang(v.lang).startsWith(targetPrefix));
    },
    [isSupported, voices]
  );

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, locale: string = 'en') => {
      if (!isSupported) return;

      stop(); // Stop any currently playing audio

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      const targetPrefix = locale === 'hi' ? 'hi' : locale === 'mr' ? 'mr' : 'en';
      const targetLangStr = locale === 'hi' ? 'hi-IN' : locale === 'mr' ? 'mr-IN' : 'en-US';

      utterance.lang = targetLangStr;

      // Select voice if available
      const matchedVoice =
        voices.find((v) => normalizeLang(v.lang).startsWith(targetPrefix)) ||
        // Fallback for Marathi to Devanagari Hindi voice if Marathi voice is not installed
        (locale === 'mr' ? voices.find((v) => normalizeLang(v.lang).startsWith('hi')) : undefined) ||
        voices[0];

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, voices, stop]
  );

  // Clean up audio playback when component unmounts or route changes
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    hasVoiceForLocale,
  };
}
