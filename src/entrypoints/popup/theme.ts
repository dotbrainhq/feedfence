/** localStorage key holding the last popup theme, read before the first paint. */
export const THEME_CACHE_KEY = 'ff-theme';

export function applyCachedTheme() {
  try {
    const theme = localStorage.getItem(THEME_CACHE_KEY);
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  } catch {}
}
