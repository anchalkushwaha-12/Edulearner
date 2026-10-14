import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { api } from '../services/api';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { AudioSpeaker } from '../components/AudioSpeaker';
import {
  Bot,
  Send,
  Lightbulb,
  Sparkles,
  WifiOff,
  User,
  RotateCcw,
  BookOpen,
  Info
} from 'lucide-react';

interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLive?: boolean;
  hints?: string[];
  timestamp: string;
}

export const AITutorPage: React.FC<{ initialTopic?: string; initialHintMode?: boolean }> = ({
  initialTopic,
  initialHintMode = false,
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { isOnline } = useOffline();

  const [messages, setMessages] = useState<ChatMessageUI[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: language === 'hi'
        ? `नमस्ते ${user?.full_name?.split(' ')[0] || 'साथी'}! मैं आपका लर्नमेट (LearnMate) AI सहायक शिक्षक हूँ।\n\nआप मुझसे कक्षा ${user?.grade || 8} के किसी भी विषय (गणित, विज्ञान, सामाजिक विज्ञान) का प्रश्न पूछ सकते हैं। आप बोलकर भी सवाल पूछ सकते हैं!`
        : `Hello ${user?.full_name?.split(' ')[0] || 'friend'}! I am your LearnMate AI rural education tutor.\n\nYou can ask me any question from Grade ${user?.grade || 8} curriculum. Feel free to ask step-by-step explanations, daily life examples, or Socratic hints!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedGrade, setSelectedGrade] = useState(user?.grade || 8);
  const [requestType, setRequestType] = useState<'explanation' | 'hint'>(initialHintMode ? 'hint' : 'explanation');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`sess-${Date.now()}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg: ChatMessageUI = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.chatWithTutor({
        message: query,
        session_id: sessionId,
        language,
        grade: selectedGrade,
        subject: selectedSubject,
        topic: initialTopic,
        request_type: requestType,
      });

      const botMsg: ChatMessageUI = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        isLive: response.is_live_provider,
        hints: response.suggested_hints,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessageUI = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: language === 'hi'
          ? 'माफ़ कीजिए, AI शिक्षक से संपर्क करने में समस्या हुई। कृपया पुनः प्रयास करें।'
          : 'Sorry, could not connect to AI Tutor. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-5rem)] flex flex-col space-y-4">
      {/* Top Header & Context Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base">{t('ai_tutor')}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Gemini 3.8 Flash Server
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'कक्षावार व भाषाई सहायता' : 'Bilingual Socratic Guidance & Explanations'}
            </p>
          </div>
        </div>

        {/* Grade, Subject & Mode Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-700 focus:outline-hidden"
          >
            {[6, 7, 8, 9, 10].map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="Mathematics">Mathematics (गणित)</option>
            <option value="Science">Science (विज्ञान)</option>
            <option value="Social Science">Social Science (सामाजिक विज्ञान)</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi (हिन्दी)</option>
          </select>

          {/* Mode Toggle: Hint vs Explanation */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setRequestType('explanation')}
              className={`px-2 py-1 rounded-md font-bold text-[11px] transition ${
                requestType === 'explanation' ? 'bg-white shadow-2xs text-teal-700' : 'text-slate-500'
              }`}
            >
              Full Explain
            </button>
            <button
              onClick={() => setRequestType('hint')}
              className={`px-2 py-1 rounded-md font-bold text-[11px] transition flex items-center gap-1 ${
                requestType === 'hint' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-500'
              }`}
            >
              <Lightbulb className="w-3 h-3" />
              <span>Hint Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Offline Notice (Milestone 9 Requirement) */}
      {!isOnline && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {language === 'hi'
              ? 'आप ऑफलाइन मोड में हैं। AI ट्यूटर लाइव इंटरनेट की अनुपस्थिति में बुनियादी शैक्षिक व्याख्या प्रदान करेगा।'
              : 'You are currently offline. Live Gemini API is paused; local offline pedagogical engine is active.'}
          </span>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-2xl border border-slate-200 p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                msg.role === 'user' ? 'bg-slate-700' : 'bg-teal-600'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-xs shadow-xs font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>

              {/* Bot Action Bar (Audio Speaker + Timestamp) */}
              <div
                className={`flex items-center gap-2 text-[10px] text-slate-400 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.role === 'assistant' && (
                  <AudioSpeaker text={msg.content} className="scale-90" />
                )}
              </div>

              {/* Suggested Follow-up Hints */}
              {msg.hints && msg.hints.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.hints.map((hintText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(hintText)}
                      className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-full text-[11px] font-semibold border border-teal-200 transition cursor-pointer"
                    >
                      💡 {hintText}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-xs text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
              <span>{language === 'hi' ? 'शिक्षक सोच रहा है...' : 'Tutor is thinking...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <VoiceInputButton onTranscript={(txt) => setInputText(txt)} />

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            requestType === 'hint'
              ? (language === 'hi' ? 'संकेत के लिए प्रश्न लिखें (जैसे 2/5 + 3/5 कैसे जोड़ें?)...' : 'Ask for a hint on your question...')
              : (language === 'hi' ? 'प्रश्न पूछें या माइक से बोलें...' : 'Ask a concept, equation or exercise question...')
          }
          className="flex-1 px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || loading}
          className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-40 transition cursor-pointer"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
