import { http } from './http'
import { API_BASE } from '../config'
import { saveAuth } from '../utils/authStorage'

export async function login({ username, password }) {
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
  })

  const res = await fetch(`${API_BASE}/api/profile/auth/participant/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Login failed (${res.status})`)
  }

  const data = await res.json()
  saveAuth(data)
  return data
}

// NOTE: Adjust endpoint/fields to match your backend if different
export async function register(payload) {
  const res = await http('/api/profile/auth/participant/register', {
    method: 'POST',
    body: payload,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Register failed (${res.status})`)
  }

  return res
}

export async function fetchMe() {
  return http('/api/profile/me/participant')
}

export async function fetchParticipantBonusData(participantId) {
  return http(`/api/data/participant_bonus_data/${participantId}`)
}

export async function fetchParticipantsBonuses(participantId) {
  return http(`/api/data/participants_bonus/${participantId}`)
}


