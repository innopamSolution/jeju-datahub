import { useCallback, useEffect, useState } from 'react';

const KEY = 'theme';
const EVENT = 'themechange';

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-contrast', 'high');
  } else {
    document.documentElement.removeAttribute('data-contrast');
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem(KEY) || 'light');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onChange = (e) => setThemeState(e.detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const setTheme = useCallback((next) => {
    localStorage.setItem(KEY, next);
    setThemeState(next);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  }, []);

  return [theme, setTheme];
}
