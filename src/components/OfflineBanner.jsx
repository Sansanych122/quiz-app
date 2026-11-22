import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div 
      role="status" 
      aria-live="assertive"
      className="bg-brand-terracotta text-white text-xs sm:text-sm font-semibold px-4 py-2.5 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md animate-fade-in"
    >
      <WifiOff size={16} />
      <span>Зв'язок з інтернетом втрачено. Перевірте підключення до мережі.</span>
    </div>
  );
}
