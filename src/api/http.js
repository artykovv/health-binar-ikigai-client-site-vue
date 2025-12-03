import { API_BASE, STORE_API_BASE } from '@/config'
import { getAccessToken, clearAuth, clearMe } from '@/utils/authStorage'

export async function http(path, { method = 'GET', headers = {}, body } = {}) {
  const token = getAccessToken()
  const finalHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...headers,
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  })
  // Handle unauthorized globally: clear auth and redirect to login
  if (res.status === 401) {
    try { clearAuth(); } catch (_) {}
    try { clearMe(); } catch (_) {}
    try {
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
      let localeFromPath = ''
      try {
        const path = typeof window !== 'undefined' ? window.location.pathname : ''
        const m = path ? path.match(/^\/(en|ru|uz|kg)(?:\/|$)/) : null
        localeFromPath = m && m[1] ? m[1] : ''
      } catch (_) {}
      let savedLocale = ''
      try { savedLocale = localStorage.getItem('locale') || '' } catch (_) {}
      const finalLocale = localeFromPath || savedLocale || 'en'
      const params = new URLSearchParams({ redirect: currentPath })
      const loginUrl = `/${finalLocale}/login?${params.toString()}`
      window.location.replace(loginUrl)
    } catch (_) {}
    const unauthorizedError = new Error('Unauthorized')
    unauthorizedError.status = 401
    throw unauthorizedError
  }
  const contentType = res.headers.get('content-type') || ''
  if (!res.ok) {
    let errorBody = null
    try {
      if (contentType.includes('application/json')) {
        errorBody = await res.json()
      } else {
        errorBody = await res.text()
      }
    } catch (_) {}
    const message = typeof errorBody === 'string' ? errorBody : (errorBody?.detail || errorBody?.message || '')
    const err = new Error(message || `${method} ${path} failed (${res.status})`)
    err.status = res.status
    if (errorBody) err.data = errorBody
    throw err
  }
  if (contentType.includes('application/json')) return res.json()
  return res.text()
}

// HTTP function for store API (no auth required)
export async function storeHttp(path, { method = 'GET', headers = {}, body } = {}) {
  const finalHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...headers,
  }
  const res = await fetch(`${STORE_API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  })
  const contentType = res.headers.get('content-type') || ''
  if (!res.ok) {
    let errorBody = null
    try {
      if (contentType.includes('application/json')) {
        errorBody = await res.json()
      } else {
        errorBody = await res.text()
      }
    } catch (_) {}
    const message = typeof errorBody === 'string' ? errorBody : (errorBody?.detail || errorBody?.message || '')
    const err = new Error(message || `${method} ${path} failed (${res.status})`)
    err.status = res.status
    if (errorBody) err.data = errorBody
    throw err
  }
  if (contentType.includes('application/json')) return res.json()
  return res.text()
}
