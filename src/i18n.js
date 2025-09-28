import { createI18n } from 'vue-i18n'
import en from './lang/en.json'
import ru from './lang/ru.json'
import uz from './lang/uz.json'
import kg from './lang/kg.json'

export const supportedLocales = ['en', 'ru', 'uz', 'kg']
const STORAGE_KEY = 'locale'

const messages = { en, ru, uz, kg }

function detectBrowserLocale() {
  const locales = []
  try {
    if (Array.isArray(navigator.languages)) locales.push(...navigator.languages)
  } catch (_) {}
  try {
    if (navigator.language) locales.push(navigator.language)
  } catch (_) {}
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().locale
    if (resolved) locales.push(resolved)
  } catch (_) {}

  // Helper to extract region (e.g., US) from a BCP 47 tag
  const getRegion = (tag) => {
    try {
      // Prefer Intl.Locale when available
      // eslint-disable-next-line no-undef
      const loc = new Intl.Locale(tag)
      return (loc.region || '').toUpperCase()
    } catch (_) {
      const parts = String(tag || '').replace('_', '-').split('-')
      const maybeRegion = parts.find((p) => p.length === 2 && p.toUpperCase() === p)
      return (maybeRegion || '').toUpperCase()
    }
  }

  // Region-priority mapping: US -> en, RU -> ru, UZ -> uz, KG -> kg
  const regions = []
  for (const tag of locales) {
    const r = getRegion(tag)
    if (r) regions.push(r)
  }
  if (regions.includes('US')) return 'en'
  if (regions.includes('RU')) return 'ru'
  if (regions.includes('UZ')) return 'uz'
  if (regions.includes('KG')) return 'kg'

  const lowered = locales.map((l) => String(l).toLowerCase())
  if (lowered.some((l) => l.includes('ru'))) return 'ru'
  if (lowered.some((l) => l.includes('uz'))) return 'uz'
  if (lowered.some((l) => l.includes('kg') || l.includes('ky'))) return 'kg'
  return 'en'
}

export function resolveInitialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && supportedLocales.includes(saved)) {
      return saved
    }
  } catch (_) {}
  const detected = detectBrowserLocale()
  try {
    localStorage.setItem(STORAGE_KEY, detected)
  } catch (_) {}
  return detected
}

export const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: 'en',
  messages,
})

export function setLocale(lang) {
  const next = supportedLocales.includes(lang) ? lang : 'en'
  i18n.global.locale.value = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch (_) {}
}


