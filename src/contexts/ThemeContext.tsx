import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemePreference } from '../types/xtrip';

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: 'dark' | 'light';
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(pref: ThemePreference): 'dark' | 'light' {
  if (pref === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return pref;
}

export function ThemeProvider({
  initialPreference = 'dark',
  children,
}: {
  initialPreference?: ThemePreference;
  children: React.ReactNode;
}) {
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const [resolved, setResolved] = useState<'dark' | 'light'>(() => resolveTheme(initialPreference));

  useEffect(() => {
    setPreference(initialPreference);
  }, [initialPreference]);

  useEffect(() => {
    const apply = () => {
      const next = resolveTheme(preference);
      setResolved(next);
      const root = document.documentElement;
      if (next === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', next === 'dark' ? '#081411' : '#f6f4ee');
      }
    };

    apply();

    if (preference === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [preference]);

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme: resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
