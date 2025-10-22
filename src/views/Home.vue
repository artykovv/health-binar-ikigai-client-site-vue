<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchMe, fetchParticipantBonusData, fetchParticipantsBonuses } from '@/api/auth'
import { http } from '@/api/http'
import { loadAuth, saveMe } from '@/utils/authStorage'

const { t, locale } = useI18n()

const me = ref(null)
const passport = ref(null)
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

const isPassportIncomplete = computed(() => {
  if (!passport.value) return true
  const p = passport.value
  const requiredFields = ['pin', 'passport_id', 'passport_issuer', 'passport_issue_date', 'bank', 'phone_number', 'date_birth']
  return requiredFields.some(field => !p[field] || p[field] === null || p[field] === '')
})

async function loadProfileIfLoggedIn() {
  const auth = loadAuth()
  if (!auth) {
    me.value = null
    passport.value = null
    return
  }
  loading.value = true
  error.value = ''
  try {
    const fullData = await http('/api/profile/me/participant')
    me.value = fullData.current_user || fullData
    passport.value = fullData.passport || null
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
    // Load summary after profile is available and dates are selected
    try { await loadWeeklySummary() } catch (_) {}
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

// Remaining sides: base - total
const leftRemaining = computed(() => {
  const b = bonus.value || {}
  return Number(b.total_left || 0) - Number(b.base_left || 0)
})

const rightRemaining = computed(() => {
  const b = bonus.value || {}
  return Number(b.total_right || 0) - Number(b.base_right || 0)
})

// Weekly summary selection
const START_ANCHOR = new Date('2025-09-23T00:00:00')
const weeks = ref([])
const selectedWeekIndex = ref(0)
const filters = ref({ start_date: '', end_date: '' })
const summary = ref(null)
const isWeekOpen = ref(false)
const weekDropdownRef = ref(null)

function formatDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildWeeks() {
  weeks.value = []
  const today = new Date()
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let start = new Date(START_ANCHOR)
  let end = new Date(start)
  end.setDate(start.getDate() + 7)
  const result = []
  // Fully completed weeks
  while (end <= midnight) {
    result.push({ start: formatDate(start), end: formatDate(end), label: '' })
    start = new Date(end)
    end = new Date(start)
    end.setDate(start.getDate() + 7)
  }
  // Also include the current (in-progress) week
  if (start < end) {
    result.push({ start: formatDate(start), end: formatDate(end), label: '' })
  }
  // Relabel weeks sequentially: Week 1, Week 2, ...
  weeks.value = result.map((w, idx) => ({ ...w, label: `${t('home.week_short')} ${idx + 1}` }))
}

function setDefaultDates() {
  buildWeeks()
  if (weeks.value.length > 0) {
    selectedWeekIndex.value = weeks.value.length - 1
    const w = weeks.value[selectedWeekIndex.value]
    filters.value.start_date = w.start
    filters.value.end_date = w.end
  }
}

function onWeekChange() {
  const w = weeks.value[selectedWeekIndex.value]
  if (!w) return
  filters.value.start_date = w.start
  filters.value.end_date = w.end
  loadWeeklySummary()
}

async function loadWeeklySummary() {
  try {
    if (!me.value || !me.value.id || !filters.value.start_date || !filters.value.end_date) return
    const data = await http(`/api/bonuses/summary/${me.value.id}?start_date=${filters.value.start_date}&end_date=${filters.value.end_date}`)
    summary.value = data || null
  } catch (_) {
    summary.value = null
  }
}

function toggleWeekDropdown() {
  isWeekOpen.value = !isWeekOpen.value
}

function selectWeek(idx) {
  if (idx === selectedWeekIndex.value) {
    isWeekOpen.value = false
    return
  }
  selectedWeekIndex.value = idx
  onWeekChange()
  isWeekOpen.value = false
}

function handleClickOutside(e) {
  try {
    if (weekDropdownRef.value && !weekDropdownRef.value.contains(e.target)) {
      isWeekOpen.value = false
    }
  } catch (_) {}
}
// Watch for locale changes and rebuild weeks
watch(locale, () => {
  setDefaultDates()
})

onMounted(() => {
  // Build weeks and select the latest completed week by default
  setDefaultDates()
  loadProfileIfLoggedIn()
  try { window.addEventListener('click', handleClickOutside, true) } catch (_) {}
})
onUnmounted(() => {
  try { window.removeEventListener('click', handleClickOutside, true) } catch (_) {}
})
</script>

<template>
  <div class="justify-center">
    <div class="text-center">
      <div class="mt-6 text-left max-w-2xl mx-auto">
        <!-- Loading animation -->
        <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
          <div id="wifi-loader">
            <svg class="circle-outer" viewBox="0 0 86 86">
              <circle class="back" cx="43" cy="43" r="40"></circle>
              <circle class="front" cx="43" cy="43" r="40"></circle>
              <circle class="new" cx="43" cy="43" r="40"></circle>
            </svg>
            <svg class="circle-middle" viewBox="0 0 60 60">
              <circle class="back" cx="30" cy="30" r="27"></circle>
              <circle class="front" cx="30" cy="30" r="27"></circle>
            </svg>
            <svg class="circle-inner" viewBox="0 0 34 34">
              <circle class="back" cx="17" cy="17" r="14"></circle>
              <circle class="front" cx="17" cy="17" r="14"></circle>
            </svg>
          </div>
        </div>
        <!-- Error state -->
        <div v-else-if="error" class="flex items-center justify-center min-h-[400px]">
          <div class="text-red-600 text-sm">{{ error }}</div>
        </div>
        <!-- Content -->
        <div v-else-if="me">
          <!-- Account not activated warning -->
          <div v-if="!me.registered" class="mb-4 rounded-2xl p-4 shadow overflow-hidden bg-red-500 text-white">
            <div class="text-center font-medium">{{ t('home.account_not_activated') }}</div>
          </div>
          
          <!-- Passport incomplete warning -->
          <div v-if="isPassportIncomplete" class="mb-4 rounded-2xl p-4 shadow overflow-hidden bg-yellow-500 text-white">
            <div class="text-center font-medium mb-2">{{ t('home.passport_incomplete') }}</div>
            <div class="text-center">
              <router-link :to="{ name: 'edit-profile', params: { locale: locale } }" 
                class="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-yellow-600 hover:bg-gray-100">
                {{ t('edit_participant.title') }}
              </router-link>
            </div>
          </div>
          
          <div class="rounded-2xl p-6 shadow overflow-hidden bg-[#015C3B] text-white dark:bg-[#015C3B]">
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
              <div class="rounded-xl bg-white/20 p-4"><div class="text-xs opacity-80">{{ t('home.left') }}</div><div class="text-2xl font-semibold">{{ leftRemaining }}</div></div>
              <div class="rounded-xl bg-white/20 p-4"><div class="text-xs opacity-80">{{ t('home.right') }}</div><div class="text-2xl font-semibold">{{ rightRemaining }}</div></div>
            </div>
          </div>

          <!-- Weekly summary (separate section) -->
          <div class="justify-center mt-4">
            <div class="text-center">
              <div class="mt-2 text-left max-w-2xl mx-auto">
          <div class="rounded-2xl p-5 shadow bg-white text-black dark:bg-[#015C3B] dark:text-white">
                    <div class="mb-3">
                      <div class="text-sm opacity-90 mb-2">{{ t('home.week') }}</div>
                      <div ref="weekDropdownRef" class="relative">
                        <button type="button" @click="toggleWeekDropdown" class="w-full group flex items-center justify-between rounded-md bg-white text-black px-3 py-2 text-sm shadow ring-1 ring-white/20 hover:opacity-90 dark:bg-[#437d63] dark:text-white dark:ring-white/10 dark:hover:ring-white/20">
                          <span>{{ weeks[selectedWeekIndex]?.label || '—' }}</span>
                          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="h-4 w-4 stroke-zinc-500 dark:stroke-zinc-300">
                            <path d="M6 8l4 4 4-4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                          </svg>
                        </button>
                        <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
                          <div v-if="isWeekOpen" class="absolute left-0 z-50 mt-2 w-full origin-top rounded-md bg-white text-black shadow-lg ring-1 ring-zinc-900/10 dark:bg-[#437d63] dark:text-white dark:ring-white/10">
                            <ul class="max-h-60 overflow-auto py-1">
                              <li v-for="(w, idx) in weeks" :key="w.label">
                                <button type="button" @click="selectWeek(idx)" class="block w-full text-left px-4 py-2 text-sm" :class="idx === selectedWeekIndex ? 'bg-gray-100 text-gray-900 dark:bg-[#015C3B] dark:text-white' : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-[#015C3B]'">
                                  {{ w.label }}
                                </button>
                              </li>
                            </ul>
                          </div>
                        </transition>
                      </div>
                    </div>
            <div v-if="summary" class="grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-zinc-100 dark:bg-white/20 p-4">
                      <div class="text-xs opacity-80">{{ t('home.structure_bonus') }}</div>
                      <div class="text-2xl font-semibold">{{ summary.total_structure_bonus ?? '-' }}</div>
                    </div>
              <div class="rounded-xl bg-zinc-100 dark:bg-white/20 p-4">
                      <div class="text-xs opacity-80">{{ t('home.sponsor_bonus') }}</div>
                      <div class="text-2xl font-semibold">{{ summary.total_sponsor_bonus ?? '-' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="bonuses" class="rounded-2xl p-5 shadow overflow-hidden bg-[#015C3B] text-white dark:bg-[#015C3B] mt-4">
            <div class="text-xs opacity-80 mb-1">{{ t('home.multibonus') }}</div>
            <div class="text-xl font-semibold break-all">{{ bonuses.total_multi ?? '-' }}</div>
          </div>

          <!-- Structure and sponsor bonus -->
          <!-- <div v-if="bonuses" class="grid grid-cols-2 gap-3 mt-4">
            <div class="rounded-2xl p-5 shadow overflow-hidden bg-[#015C3B] text-white dark:bg-[#015C3B]">
              <div class="text-xs opacity-80 mb-1">{{ t('home.structure_bonus') }}</div>
              <div class="text-2xl font-semibold">{{ bonuses.total_structure ?? '-' }}</div>
            </div>
            <div class="rounded-2xl p-5 shadow overflow-hidden bg-[#015C3B] text-white dark:bg-[#015C3B]">
              <div class="text-xs opacity-80 mb-1">{{ t('home.sponsor_bonus') }}</div>
              <div class="text-2xl font-semibold">{{ bonuses.total_sponsor ?? '-' }}</div>
            </div>
          </div> -->
        </div>
        <div v-else class="text-gray-500 text-sm">No user data. Please login.</div>
      </div>
    </div>
  </div>

</template>

<style scoped>
/* WiFi loader adapted with custom colors */
#wifi-loader {
  --background: #437d63;
  --front-color: #015C3B;
  --back-color: #437d63;
  --text-color: #414856;
  width: 64px;
  height: 64px;
  border-radius: 50px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

#wifi-loader svg {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
}

#wifi-loader svg circle {
  position: absolute;
  fill: none;
  stroke-width: 6px;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(-100deg);
  transform-origin: center;
}

#wifi-loader svg circle.back {
  stroke: var(--back-color);
}

#wifi-loader svg circle.front {
  stroke: var(--front-color);
}

#wifi-loader svg.circle-outer {
  height: 86px;
  width: 86px;
}

#wifi-loader svg.circle-outer circle {
  stroke-dasharray: 62.75 188.25;
}

#wifi-loader svg.circle-outer circle.back {
  animation: circle-outer135 1.8s ease infinite 0.3s;
}

#wifi-loader svg.circle-outer circle.front {
  animation: circle-outer135 1.8s ease infinite 0.15s;
}

#wifi-loader svg.circle-middle {
  height: 60px;
  width: 60px;
}

#wifi-loader svg.circle-middle circle {
  stroke-dasharray: 42.5 127.5;
}

#wifi-loader svg.circle-middle circle.back {
  animation: circle-middle6123 1.8s ease infinite 0.25s;
}

#wifi-loader svg.circle-middle circle.front {
  animation: circle-middle6123 1.8s ease infinite 0.1s;
}

#wifi-loader svg.circle-inner {
  height: 34px;
  width: 34px;
}

#wifi-loader svg.circle-inner circle {
  stroke-dasharray: 22 66;
}

#wifi-loader svg.circle-inner circle.back {
  animation: circle-inner162 1.8s ease infinite 0.2s;
}

#wifi-loader svg.circle-inner circle.front {
  animation: circle-inner162 1.8s ease infinite 0.05s;
}

@keyframes circle-outer135 {
  0% {
    stroke-dashoffset: 25;
  }
  25% {
    stroke-dashoffset: 0;
  }
  65% {
    stroke-dashoffset: 301;
  }
  80% {
    stroke-dashoffset: 276;
  }
  100% {
    stroke-dashoffset: 276;
  }
}

@keyframes circle-middle6123 {
  0% {
    stroke-dashoffset: 17;
  }
  25% {
    stroke-dashoffset: 0;
  }
  65% {
    stroke-dashoffset: 204;
  }
  80% {
    stroke-dashoffset: 187;
  }
  100% {
    stroke-dashoffset: 187;
  }
}

@keyframes circle-inner162 {
  0% {
    stroke-dashoffset: 9;
  }
  25% {
    stroke-dashoffset: 0;
  }
  65% {
    stroke-dashoffset: 106;
  }
  80% {
    stroke-dashoffset: 97;
  }
  100% {
    stroke-dashoffset: 97;
  }
}
</style>
