// The light/dark button in the header, shared by every page.
// Pages follow the system setting until the visitor picks the other theme. That choice is saved
// and applied by a one-line script in each page's <head>, before anything is drawn, so the page
// never flashes the wrong colours. Switching back to match the system goes back to following it.
(function () {
  'use strict';

  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  if (!button) return;

  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const kurdish = root.lang === 'ckb';
  const text = kurdish
    ? { dark: 'تاریک', light: 'ڕووناک', toDark: 'گۆڕین بۆ ڕەنگی تاریک', toLight: 'گۆڕین بۆ ڕەنگی ڕووناک' }
    : { dark: 'Dark', light: 'Light', toDark: 'Switch to dark colours', toLight: 'Switch to light colours' };
  const barColour = { light: '#ffffff', dark: '#111111' };

  const systemTheme = () => (systemDark.matches ? 'dark' : 'light');
  const currentTheme = () => root.dataset.theme || systemTheme();

  function remember(theme) {
    try {
      if (theme) localStorage.setItem('theme', theme);
      else localStorage.removeItem('theme');
    } catch (error) {
      // Private browsing can block storage; the switch still works for this page.
    }
  }

  function update() {
    const theme = currentTheme();
    const other = theme === 'dark' ? 'light' : 'dark';
    button.textContent = text[other];
    button.setAttribute('aria-label', other === 'dark' ? text.toDark : text.toLight);

    // The phone's browser bar follows the page too.
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.content = root.dataset.theme
        ? barColour[theme]
        : barColour[meta.media.includes('dark') ? 'dark' : 'light'];
    });
  }

  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (next === systemTheme()) {
      delete root.dataset.theme;
      remember(null);
    } else {
      root.dataset.theme = next;
      remember(next);
    }
    update();
  });

  systemDark.addEventListener('change', update);
  update();
  button.hidden = false;
})();
