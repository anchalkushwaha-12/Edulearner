import React from 'react';
import { useOffline } from '../context/OfflineContext';
import { useLanguage } from '../context/LanguageContext';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const NetworkStatusBadge: React.FC = () => {
  const { isOnline, pendingSyncCount, syncNow } = useOffline();
  const { t } = useLanguage();
  const [syncing, setSyncing] = React.useState(false);

  const handleManualSync = async () => {
    setSyncing(true);
    await syncNow();
    setSyncing(false);
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {isOnline ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('online')}</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
          <WifiOff className="w-3.5 h-3.5 text-amber-600" />
          <span>{t('offline')}</span>
        </span>
      )}

      {pendingSyncCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={!isOnline || syncing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium transition cursor-pointer disabled:opacity-60"
          title={t('sync_now')}
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          <span>{pendingSyncCount} {t('sync_pending')}</span>
        </button>
      )}
    </div>
  );
};
