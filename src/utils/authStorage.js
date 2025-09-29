const STORAGE_KEY = 'auth'
const ME_KEY = 'me'
const AUTH_CHANGED_EVENT = 'auth-changed'

export function saveAuth(auth) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  } catch (_) {}
  try {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { auth } }))
  } catch (_) {}
}

export function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_) {
    return null
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (_) {}
  try {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { auth: null } }))
  } catch (_) {}
}

export function getAccessToken() {
  const auth = loadAuth()
  return auth && auth.access_token ? auth.access_token : null
}

export function onAuthChanged(handler) {
  try {
    window.addEventListener(AUTH_CHANGED_EVENT, handler)
  } catch (_) {}
}

export function offAuthChanged(handler) {
  try {
    window.removeEventListener(AUTH_CHANGED_EVENT, handler)
  } catch (_) {}
}

// Persisted current user profile
export function saveMe(me) {
  try { localStorage.setItem(ME_KEY, JSON.stringify(me)) } catch (_) {}
}

export function loadMe() {
  try {
    const raw = localStorage.getItem(ME_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_) { return null }
}

export function clearMe() {
  try { localStorage.removeItem(ME_KEY) } catch (_) {}
}


