<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { http } from '@/api/http'
import { loadMe } from '@/utils/authStorage'

const { t } = useI18n()

const participants = ref([])
const loading = ref(false)
const error = ref('')
const filter = ref('true') // 'all' | 'true' | 'false'
function setFilter(value) { filter.value = value; loadPersonals() }
const activeBtnStyle = { backgroundColor: '#015C3B', color: '#fff', borderRadius: '9999px', padding: '4px 12px' }

function displayName(p) {
  const parts = [p.lastname, p.name, p.patronymic].filter(Boolean)
  return parts.join(' ')
}
function displayDate(p) {
  try {
    if (!p.register_at) return ''
    const d = new Date(p.register_at)
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(d)
  } catch (_) { return p.register_at || '' }
}

function timeUntilStageClose(p) {
  try {
    if (!p.bonus_data?.stage_start_date) return null
    const startDate = new Date(p.bonus_data.stage_start_date)
    const closeDate = new Date(startDate.getTime() + 56 * 24 * 60 * 60 * 1000) // +56 days
    const now = new Date()
    const diff = closeDate - now
    
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 }
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
    
    return { days, hours, minutes }
  } catch (_) {
    return null
  }
}

async function loadPersonals() {
  const me = loadMe()
  const sponsorId = me?.id || ''
  if (!sponsorId) return
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ page: '1', page_size: '20', sponsor_id: sponsorId })
    if (filter.value !== 'all') params.set('registered', filter.value)
    const data = await http(`/api/participants/?${params.toString()}`)
    participants.value = Array.isArray(data?.participants) ? data.participants : []
  } catch (e) {
    error.value = e?.message || 'Error'
  } finally {
    loading.value = false
  }
}

onMounted(loadPersonals)
</script>

<template>
  <div class="py-6">
    <h1 class="text-2xl font-semibold">{{ t('menu.personals') }}</h1>
    <div class="flex gap-6 mt-3">
      <button :style="filter === 'all' ? activeBtnStyle : null" @click="setFilter('all')">{{ t('personals.all') }}</button>
      <button :style="filter === 'true' ? activeBtnStyle : null" @click="setFilter('true')">{{ t('personals.in_structure') }}</button>
      <button :style="filter === 'false' ? activeBtnStyle : null" @click="setFilter('false')">{{ t('personals.not_in_structure') }}</button>
    </div>
    <div v-if="loading" class="flex items-center justify-center min-h-[200px] mt-4">
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
    <div v-else-if="error" class="mt-4 text-sm text-red-600">{{ error }}</div>
    <div v-else class="mt-4 space-y-2">
      <div v-for="p in participants" :key="p.id" class="rounded-2xl p-4 shadow bg-[#015C3B] text-white">
        <div class="flex items-center justify-between">
          <div class="text-sm opacity-80">{{ p.personal_number }}</div>
          <div class="text-xs opacity-80">{{ displayDate(p) }}</div>
        </div>
        <div class="mt-1 text-base font-medium">{{ displayName(p) }}</div>
        <div class="mt-1 text-xs">
          <span v-if="p.registered" class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            {{ t('personals.in_structure') }}
          </span>
          <span v-else class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-rose-500/20 text-rose-100 ring-1 ring-rose-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zM10 14.75a.875.875 0 100-1.75.875.875 0 000 1.75z" clip-rule="evenodd"/></svg>
            {{ t('personals.not_in_structure') }}
          </span>
        </div>
        <div v-if="p.registered && timeUntilStageClose(p)" class="mt-2 text-xs opacity-90">
          <div class="font-medium">{{ t('personals.time_until_stage_close') }}:</div>
          <div class="mt-0.5">
            {{ timeUntilStageClose(p).days }} {{ t('personals.days') }} 
            {{ timeUntilStageClose(p).hours }} {{ t('personals.hours') }} 
            {{ timeUntilStageClose(p).minutes }} {{ t('personals.minutes') }}
          </div>
        </div>
      </div>
      <div v-if="participants.length === 0" class="text-sm text-gray-500">—</div>
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


