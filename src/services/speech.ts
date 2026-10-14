import { Language } from '../types';

export class SpeechService {
  // Speech-to-Text (Voice Input)
  static isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  static createRecognizer(
    language: Language,
    onResult: (transcript: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ) {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser.');
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

    recognizer.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    recognizer.onerror = (event: any) => {
      onError(event.error || 'Speech input error');
    };

    recognizer.onend = () => {
      onEnd();
    };

    return recognizer;
  }

  // Text-to-Speech (TTS)
  static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  static speak(text: string, language: Language, onEnd?: () => void): boolean {
    if (!this.isSpeechSynthesisSupported()) {
      return false;
    }

    // Cancel ongoing speech
    window.speechSynthesis.cancel();

    // Clean markdown before speaking
    const cleanText = text
      .replace(/[*#_`$]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .slice(0, 500); // speak first 500 characters cleanly

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // slightly slower for educational clarity

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  }

  static stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
