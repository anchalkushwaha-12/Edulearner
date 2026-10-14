import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { SpeechService } from '../services/speech';
import { useLanguage } from '../context/LanguageContext';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputProps> = ({ onTranscript, className = '' }) => {
  const { language, t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [recognizer, setRecognizer] = useState<any>(null);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognizer) {
        recognizer.stop();
      }
      setIsRecording(false);
    } else {
      const rec = SpeechService.createRecognizer(
        language,
        (transcript) => {
          onTranscript(transcript);
          setIsRecording(false);
        },
        (err) => {
          console.warn('Voice recognition notice:', err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );

      if (rec) {
        setRecognizer(rec);
        setIsRecording(true);
        rec.start();
      } else {
        alert(language === 'hi' ? 'इस ब्राउज़र में आवाज़ इनपुट समर्थित नहीं है।' : 'Speech recognition is not supported in this browser.');
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleRecording}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition ${
        isRecording
          ? 'bg-rose-600 text-white shadow-lg ring-4 ring-rose-200 animate-pulse'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
      } ${className}`}
      title={isRecording ? 'Listening...' : t('voice_input')}
    >
      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-teal-600" />}
      {isRecording && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
      )}
    </button>
  );
};
