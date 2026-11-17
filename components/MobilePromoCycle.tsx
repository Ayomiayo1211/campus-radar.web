'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
type Promo = 'social' | 'radar' | null;
const MobilePromoContext = createContext<Promo>(null);
export function useMobilePromo() { return useContext(MobilePromoContext); }
export function MobilePromoProvider({ children }: { children: ReactNode }) {
  const [activePromo, setActivePromo] = useState<Promo>(null);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    let mobile = query.matches;
    let current: 'social' | 'radar' = 'social';
    let showing = false;
    let shown = 0;
    let elapsed = 0;
    const show = () => { showing = true; shown = 0; setActivePromo(current); };
    const hide = () => { showing = false; elapsed = 0; setActivePromo(null); };
    const tick = () => {
      if (!mobile || document.visibilityState !== 'visible') return;
      if (showing) { shown += 1; if (shown >= 8) hide(); return; }
      elapsed += 1;
      if (elapsed >= 600) { current = current === 'social' ? 'radar' : 'social'; show(); }
    };
    const resize = () => {
      mobile = query.matches;
      if (mobile) { current = 'social'; show(); }
      else { showing = false; setActivePromo(null); }
    };
    if (mobile) show();
    const timer = window.setInterval(tick, 1000);
    query.addEventListener('change', resize);
    return () => { window.clearInterval(timer); query.removeEventListener('change', resize); };
  }, []);
  return <MobilePromoContext.Provider value={activePromo}>{children}</MobilePromoContext.Provider>;
}
