import React, { useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { SpeechService } from '../services/speech';
import { useLanguage } from '../context/LanguageContext';

export const AudioSpeaker: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const { language, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = () => {
    if (isPlaying) {
      SpeechService.stopSpeaking();
      setIsPlaying(false);
    } else {
      const started = SpeechService.speak(text, language, () => {
        setIsPlaying(false);
      });
      if (started) {
        setIsPlaying(true);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
        isPlaying
          ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
          : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
      } ${className}`}
      title={isPlaying ? t('stop_audio') : t('listen')}
    >
      {isPlaying ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
          <span>{t('stop_audio')}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5" />
          <span>{t('listen')}</span>
        </>
      )}
    </button>
  );
};
