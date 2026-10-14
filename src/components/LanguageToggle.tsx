import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages } from 'lucide-react';

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-xs ${className}`}>
      <Languages className="w-4 h-4 ml-1.5 mr-1 text-slate-500" />
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
          language === 'hi'
            ? 'bg-teal-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        हिन्दी
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
          language === 'en'
            ? 'bg-teal-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        English
      </button>
    </div>
  );
};
