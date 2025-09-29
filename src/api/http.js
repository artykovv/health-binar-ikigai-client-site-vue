import { API_BASE } from '@/config'
import { getAccessToken } from '@/utils/authStorage'

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


