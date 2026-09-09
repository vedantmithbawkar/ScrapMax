'use client';

import React from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useI18n } from '@/i18n/context';
import { Volume2, Square, VolumeX } from 'lucide-react';

interface SpeakButtonProps {
  text: string;
  locale?: string;
  label?: string;
  className?: string;
}

export default function SpeakButton({ text, locale, label, className = '' }: SpeakButtonProps) {
  const { locale: currentLocale, t } = useI18n();
  const activeLocale = locale || currentLocale;
  const { speak, stop, isSpeaking, isSupported, hasVoiceForLocale } = useTextToSpeech();

  const hasVoice = hasVoiceForLocale(activeLocale);

  const handleToggle = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, activeLocale);
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title={t('common.ttsUnavailable')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed opacity-60 ${className}`}
      >
        <VolumeX className="w-3.5 h-3.5" />
        <span>{label || t('common.speakSection')}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isSpeaking ? t('common.stopSpeaking') : t('common.speakSection')}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition touch-feedback ${
        isSpeaking
          ? 'bg-amber-500 text-white shadow-md animate-pulse'
          : 'bg-[#E6F4EA] hover:bg-[#D4EBD9] text-[#136B3B] border border-[#A6D5B8] shadow-xs'
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>{t('common.stopSpeaking')}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>{label || t('common.speakSection')}</span>
          {!hasVoice && (
            <span
              className="ml-1 text-[10px] text-amber-700 font-normal underline"
              title="Voice for this exact locale is unavailable on browser, using fallback voice"
            >
              (Fallback)
            </span>
          )}
        </>
      )}
    </button>
  );
}
