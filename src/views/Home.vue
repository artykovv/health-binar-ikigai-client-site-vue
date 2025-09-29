<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchMe, fetchParticipantBonusData, fetchParticipantsBonuses } from '@/api/auth'
import { loadAuth, saveMe } from '@/utils/authStorage'

const { t } = useI18n()

const me = ref(null)
const loading = ref(false)
const error = ref('')
const copied = ref(false)
function registrationLink(me) {
  try {
    // Example ref link: current origin + locale + register with sponsor/participant id
    const origin = window.location.origin
    return `${origin}/${(new URLSearchParams(window.location.search).get('lang')) || ''}/register?sponsor=${me?.id || ''}`
  } catch (_) { return '' }
}
async function copyRegistration(me) {
  const link = registrationLink(me)
  try {
    await navigator.clipboard.writeText(link)
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch (_) {}
}

const fullName = computed(() => {
  const p = me.value || {}
  const parts = [p.name, p.lastname, p.patronymic].filter(Boolean)
  return parts.join(' ')
})

async function loadProfileIfLoggedIn() {
  const auth = loadAuth()
  if (!auth) {
    me.value = null
    return
  }
  loading.value = true
  error.value = ''
  try {
    me.value = await fetchMe()
    saveMe(me.value)
    // fetch bonus data
    if (me.value && me.value.id) {
      bonus.value = await fetchParticipantBonusData(me.value.id)
      bonuses.value = await fetchParticipantsBonuses(me.value.id)
    }
  } catch (e) {
    error.value = e?.message || 'Error'
  } finally {
    loading.value = false
  }
}

const bonus = ref(null)
const bonuses = ref(null)
const allTimeTotal = computed(() => {
  const b = bonuses.value || {}
  const left = Number(b.total_structure || 0)
  const right = Number(b.total_sponsor || 0)
  return left + right
})
onMounted(loadProfileIfLoggedIn)
</script>

<template>
  <div class="justify-center">
    <div class="text-center">
      <div class="mt-6 text-left max-w-2xl mx-auto">
        <div v-if="loading" class="text-gray-500">Loading...</div>
        <div v-else-if="error" class="text-red-600 text-sm">{{ error }}</div>
        <div v-else-if="me" class="rounded-2xl p-6 shadow overflow-hidden bg-[#015C3B] text-white dark:bg-[#015C3B]">
          <h1 class="text-3xl font-bold text-center">{{ me.personal_number || '-' }}</h1>
          <div class="mt-3 text-center text-lg">{{ fullName || '-' }}</div>
          <div class="my-4 h-px w-full opacity-30" style="background: rgba(255,255,255,0.5)"></div>
          <!-- <div class="flex items-center justify-center gap-2">
            <button class="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-zinc-900 ring-1 ring-white/50 hover:bg-white" @click="copyRegistration(me)">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 8h8v8H8z"/>
                <path d="M4 16V6a2 2 0 0 1 2-2h10"/>
              </svg>
              <span>{{ t('home.registration_link') }}</span>
            </button>
            <span v-if="copied" class="text-xs">{{ t('home.copied') }}</span>
          </div> -->
          <div v-if="bonus" class="mt-6 grid grid-cols-2 gap-3">
            <div v-if="bonuses" class="rounded-xl bg-white/20 p-4 col-span-2"><div class="text-xs opacity-80">{{ t('home.all_time') }}</div><div class="text-2xl font-semibold">{{ allTimeTotal }}</div></div>
            <div class="rounded-xl bg-white/20 p-4"><div class="text-xs opacity-80">{{ t('home.cycle') }}</div><div class="text-2xl font-semibold">{{ bonus.cycle_number ?? '-' }}</div></div>
            <div class="rounded-xl bg-white/20 p-4"><div class="text-xs opacity-80">{{ t('home.stage') }}</div><div class="text-2xl font-semibold">{{ bonus.stage_number ?? '-' }}</div></div>
            <div class="rounded-xl bg-white/20 p-4"><div class="text-xs opacity-80">{{ t('home.left') }}</div><div class="text-2xl font-semibold">{{ bonus.total_left ?? '-' }}</div></div>
            <div class="rounded-xl bg-white/20 p-4"><div class="text-xs opacity-80">{{ t('home.right') }}</div><div class="text-2xl font-semibold">{{ bonus.total_right ?? '-' }}</div></div>
          </div>
        </div>
        <div v-if="bonuses" class="rounded-2xl p-5 shadow overflow-hidden bg-[#015C3B] text-white dark:bg-[#015C3B] mt-4">
          <div class="text-xs opacity-80 mb-1">{{ t('home.multibonus') }}</div>
          <div class="text-xl font-semibold break-all">{{ bonuses.total_multi ?? '-' }}</div>
        </div>
        <div v-if="bonuses" class="grid grid-cols-2 gap-3 mt-4">
          <div class="rounded-2xl p-5 shadow overflow-hidden bg-[#015C3B] text-white dark:bg-[#015C3B]">
            <div class="text-xs opacity-80 mb-1">{{ t('home.structure_bonus') }}</div>
            <div class="text-2xl font-semibold">{{ bonuses.total_structure ?? '-' }}</div>
          </div>
          <div class="rounded-2xl p-5 shadow overflow-hidden bg-[#015C3B] text-white dark:bg-[#015C3B]">
            <div class="text-xs opacity-80 mb-1">{{ t('home.sponsor_bonus') }}</div>
            <div class="text-2xl font-semibold">{{ bonuses.total_sponsor ?? '-' }}</div>
          </div>
        </div>
        <div v-else class="text-gray-500 text-sm">No user data. Please login.</div>
      </div>
    </div>
  </div>
</template>


