<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchMe, fetchParticipantBonusData, fetchParticipantsBonuses } from '@/api/auth'
import { http } from '@/api/http'
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
  // Relabel weeks sequentially: Неделя 1, Неделя 2, ...
  weeks.value = result.map((w, idx) => ({ ...w, label: `Неделя ${idx + 1}` }))
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
            <div class="rounded-xl bg-white/20 p-4"><div class="text-xs opacity-80">{{ t('home.left') }}</div><div class="text-2xl font-semibold">{{ leftRemaining }}</div></div>
            <div class="rounded-xl bg-white/20 p-4"><div class="text-xs opacity-80">{{ t('home.right') }}</div><div class="text-2xl font-semibold">{{ rightRemaining }}</div></div>
          </div>
        </div>


        <!-- Weekly summary (separate section) -->
        <div class="justify-center mt-4">
          <div class="text-center">
            <div class="mt-2 text-left max-w-2xl mx-auto">
        <div class="rounded-2xl p-5 shadow overflow-hidden bg-white text-black dark:bg-[#015C3B] dark:text-white">
                  <div class="mb-3">
                    <div class="text-sm opacity-90 mb-2">Неделя</div>
                    <div ref="weekDropdownRef" class="relative">
                      <button type="button" @click="toggleWeekDropdown" class="w-full group flex items-center justify-between rounded-md bg-white text-black px-3 py-2 text-sm shadow ring-1 ring-white/20 hover:opacity-90 dark:bg-[#282828] dark:text-white dark:ring-white/10 dark:hover:ring-white/20">
                        <span>{{ weeks[selectedWeekIndex]?.label || '—' }}</span>
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="h-4 w-4 stroke-zinc-500 dark:stroke-zinc-300">
                          <path d="M6 8l4 4 4-4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                      </button>
                      <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
                        <div v-if="isWeekOpen" class="absolute left-0 z-10 mt-2 w-full origin-top rounded-md bg-white text-black shadow-lg ring-1 ring-zinc-900/10 dark:bg-[#282828] dark:text-white dark:ring-white/10">
                          <ul class="max-h-60 overflow-auto py-1">
                            <li v-for="(w, idx) in weeks" :key="w.label">
                              <button type="button" @click="selectWeek(idx)" class="block w-full text-left px-4 py-2 text-sm" :class="idx === selectedWeekIndex ? 'bg-gray-100 text-gray-900 dark:bg-[#3f3f47] dark:text-white' : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-[#3f3f47]'">
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
        <div v-else class="text-gray-500 text-sm">No user data. Please login.</div>
      </div>
    </div>
  </div>

</template>


