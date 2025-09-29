const THEME_KEY = 'theme'

export function getSavedTheme() {
  try { return localStorage.getItem(THEME_KEY) || '' } catch (_) { return '' }
}

export function applyTheme(theme) {
  const root = document.documentElement
  const body = document.body
  if (theme === 'dark') {
    root.classList.add('dark')
    try { body.classList.add('dark') } catch (_) {}
    root.style.backgroundColor = '#282828'
    try { body.style.backgroundColor = '#282828' } catch (_) {}
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    try { body.classList.remove('dark') } catch (_) {}
    root.style.backgroundColor = ''
    try { body.style.backgroundColor = '' } catch (_) {}
    root.style.colorScheme = 'light'
  }
}

export function setTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme) } catch (_) {}
  applyTheme(theme)
}

export function initTheme() {
  const saved = getSavedTheme()
  applyTheme(saved || 'light')
}


