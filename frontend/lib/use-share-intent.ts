import { useEffect, useState } from 'react';

interface ShareData {
  action?: string;
  type?: string;
  text?: string;
  subject?: string;
  mediaType?: string;
  mediaUri?: string;
  isMultiple?: boolean;
}

export function useShareIntent() {
  const [sharedText, setSharedText] = useState<string | null>(null);

  useEffect(() => {
    const checkShare = () => {
      try {
        // 1. URL search params (örnek: ?sharedText=https://instagram.com/...)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const fromUrl = urlParams.get('sharedText');
          if (fromUrl) {
            setSharedText(decodeURIComponent(fromUrl));
            return;
          }
        }

        // 2. localStorage pendingShareData (MainActivity.java tarafından yazılır)
        const raw = localStorage.getItem('pendingShareData');
        const ts = localStorage.getItem('pendingShareDataTimestamp');
        if (raw && ts) {
          const age = Date.now() - parseInt(ts, 10);
          // 60 saniyeden yeni paylaşımları kabul et
          if (age < 60 * 1000) {
            const data: ShareData = JSON.parse(raw);
            const text = data.text || null;
            if (text) {
              setSharedText(text);
            }
          }
        }
      } catch (e) {
        console.error('[useShareIntent] read error:', e);
      }
    };

    // İlk kontrol
    checkShare();

    // Periyodik kontrol (MainActivity gecikmeli inject ederse yakalamak için)
    const interval = setInterval(checkShare, 500);

    // CustomEvent dinleyicisi
    const handleShareEvent = (event: Event) => {
      try {
        const data: ShareData = (event as CustomEvent).detail;
        const text = data.text || null;
        if (text) {
          setSharedText(text);
        }
      } catch (e) {
        console.error('[useShareIntent] event error:', e);
      }
    };

    window.addEventListener('shareIntent', handleShareEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('shareIntent', handleShareEvent);
    };
  }, []);

  return sharedText;
}
