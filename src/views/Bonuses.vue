<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { http } from '@/api/http'
import { loadMe } from '@/utils/authStorage'

const { t } = useI18n()

const tab = ref('structure') // 'multi' | 'structure' | 'sponsor' | 'gifts' | 'health_day'
const loading = ref(false)
const error = ref('')
const multi = ref([])
const structure = ref([])
const sponsor = ref([])
const gifts = ref([])
const healthDay = ref([])

const activeBtnStyle = { backgroundColor: '#015C3B', color: '#fff', borderRadius: '9999px', padding: '4px 12px' }

function formatDate(iso) {
  try {
    if (!iso) return ''
    const d = new Date(iso)
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(d)
  } catch (_) { return iso || '' }
}

function qs(participantId) {
  const p = new URLSearchParams({
    participant_id: participantId,
    order_by: 'created_at',
    order_dir: 'desc',
    page: '1',
    page_size: '30',
  })
  return p.toString()
}

async function loadTab(which) {
  const me = loadMe()
  const id = me?.id || ''
  if (!id) return
  loading.value = true
  error.value = ''
  try {
    const query = qs(id)
    if (which === 'multi' && multi.value.length === 0) {
      const response = await http(`/api/bonuses/multi_bonuses?${query}`)
      multi.value = response?.items || []
    }
    if (which === 'structure' && structure.value.length === 0) {
      const response = await http(`/api/bonuses/structure_bonuses?${query}`)
      structure.value = response?.items || []
    }
    if (which === 'sponsor' && sponsor.value.length === 0) {
      const response = await http(`/api/bonuses/sponsor_bonuses?${query}`)
      sponsor.value = response?.items || []
    }
    if (which === 'gifts' && gifts.value.length === 0) {
      const response = await http(`/api/bonuses/gifts?${query}`)
      gifts.value = response?.items || []
    }
    if (which === 'health_day' && healthDay.value.length === 0) {
      const response = await http(`/api/bonuses/health_day?participant_id=${id}`)
      healthDay.value = response?.items || []
    }
  } catch (e) {
    error.value = e?.message || 'Error'
  } finally {
    loading.value = false
  }
}

function setTab(next) {
  tab.value = next
  loadTab(next)
}

onMounted(() => loadTab(tab.value))
</script>

<template>
  <div class="py-6">
    <h1 class="text-2xl font-semibold">{{ t('menu.bonuses') }}</h1>

    <div class="flex gap-4 mt-3 flex-wrap">
      <button :style="tab === 'structure' ? activeBtnStyle : null" @click="setTab('structure')">{{ t('home.structure_bonus') }}</button>
      <button :style="tab === 'sponsor' ? activeBtnStyle : null" @click="setTab('sponsor')">{{ t('home.sponsor_bonus') }}</button>
      <button :style="tab === 'health_day' ? activeBtnStyle : null" @click="setTab('health_day')">{{ t('home.health_day') }}</button>
      <button :style="tab === 'gifts' ? activeBtnStyle : null" @click="setTab('gifts')">{{ t('home.gifts') }}</button>
      <button :style="tab === 'multi' ? activeBtnStyle : null" @click="setTab('multi')">{{ t('home.multibonus') }}</button>
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
      <template v-if="tab === 'multi'">
        <div v-for="b in multi" :key="`m-${b.id}`" class="rounded-2xl p-4 shadow bg-[#015C3B] text-white">
          <div class="flex items-center justify-between">
            <div class="text-sm opacity-80">{{ t('home.multibonus') }}</div>
            <div class="text-xs opacity-80">{{ formatDate(b.received_at) }}</div>
          </div>
          <div class="mt-1 text-base font-medium">+{{ b.amount }}</div>
          <div class="text-xs opacity-80">#{{ b.cycle_number }} · {{ t('home.stage') }} {{ b.stage_number }}</div>
          <div class="text-xs mt-1">
            <span :class="b.status === 'paid' ? 'text-green-300' : 'text-yellow-300'">
              {{ b.status === 'paid' ? t('home.issued') : t('home.not_issued') }}
            </span>
          </div>
        </div>
        <div v-if="multi.length === 0" class="text-sm text-gray-500">—</div>
      </template>

      <template v-else-if="tab === 'structure'">
        <div v-for="b in structure" :key="`st-${b.id}`" class="rounded-2xl p-4 shadow bg-[#015C3B] text-white">
          <div class="flex items-center justify-between">
            <div class="text-sm opacity-80">{{ t('home.structure_bonus') }}</div>
            <div class="text-xs opacity-80">{{ formatDate(b.received_at) }}</div>
          </div>
          <div class="mt-1 text-base font-medium">{{ b.reward }}</div>
          <div class="text-xs opacity-80">#{{ b.cycle_number }} · {{ t('home.stage') }} {{ b.stage_number }}</div>
          <div v-if="b.branch" class="text-xs opacity-80 mt-1">{{ b.branch }}</div>
          <div class="text-xs mt-1">
            <span :class="b.status === 'paid' ? 'text-green-300' : 'text-yellow-300'">
              {{ b.status === 'paid' ? t('home.issued') : t('home.not_issued') }}
            </span>
          </div>
        </div>
        <div v-if="structure.length === 0" class="text-sm text-gray-500">—</div>
      </template>

      <template v-else-if="tab === 'sponsor'">
        <div v-for="b in sponsor" :key="`sp-${b.id}`" class="rounded-2xl p-4 shadow bg-[#015C3B] text-white">
          <div class="flex items-center justify-between">
            <div class="text-sm opacity-80">{{ t('home.sponsor_bonus') }}</div>
            <div class="text-xs opacity-80">{{ formatDate(b.received_at) }}</div>
          </div>
        <div class="mt-1 text-base font-medium">+{{ b.amount }}</div>
          <div class="text-xs opacity-80">#{{ b.cycle_number }} · {{ t('home.stage') }} {{ b.stage_number }}</div>
          <div v-if="b.from_participant_fio" class="text-sm opacity-80 mt-2">{{ b.from_participant_fio }} {{ b.from_participant_personal_number }}</div>
          <div class="text-xs mt-1">
            <span :class="b.status === 'paid' ? 'text-green-300' : 'text-yellow-300'">
              {{ b.status === 'paid' ? t('home.issued') : t('home.not_issued') }}
            </span>
          </div>
        </div>
        <div v-if="sponsor.length === 0" class="text-sm text-gray-500">—</div>
      </template>

      <template v-else-if="tab === 'gifts'">
        <div v-for="b in gifts" :key="`g-${b.id}`" class="rounded-2xl p-4 shadow bg-[#015C3B] text-white">
          <div class="flex items-center justify-between">
            <div class="text-sm opacity-80">{{ t('home.gifts') }}</div>
            <div class="text-xs opacity-80">{{ formatDate(b.received_at) }}</div>
          </div>
          <div class="mt-1 text-base font-medium">{{ b.reward }}</div>
          <div class="text-xs opacity-80">#{{ b.cycle_number }} · {{ t('home.stage') }} {{ b.stage_number }}</div>
          <div v-if="b.branch" class="text-xs opacity-80 mt-1">{{ b.branch }}</div>
          <div class="text-xs mt-1">
            <span :class="b.status === 'paid' ? 'text-green-300' : 'text-yellow-300'">
              {{ b.status === 'paid' ? t('home.issued') : t('home.not_issued') }}
            </span>
          </div>
        </div>
        <div v-if="gifts.length === 0" class="text-sm text-gray-500">—</div>
      </template>

      <template v-else-if="tab === 'health_day'">
        <div v-for="b in healthDay" :key="`hd-${b.id}`" class="rounded-2xl p-4 shadow bg-[#015C3B] text-white">
          <div class="flex items-center justify-between">
            <div class="text-sm opacity-80">{{ t('home.health_day') }}</div>
            <div class="text-xs opacity-80">{{ formatDate(b.received_at) }}</div>
          </div>
          <div class="mt-1 text-base font-medium">+{{ b.amount }}</div>
          <div class="text-xs opacity-80">{{ t('home.depth') }} {{ b.depth }} · {{ b.branch }}</div>
          <div v-if="b.from_participant_fio" class="text-sm opacity-80 mt-2">{{ b.from_participant_fio }} {{ b.from_participant_personal_number }}</div>
          <div class="text-xs mt-1">
            <span :class="b.status === 'paid' ? 'text-green-300' : 'text-yellow-300'">
              {{ b.status === 'paid' ? t('home.issued') : t('home.not_issued') }}
            </span>
          </div>
        </div>
        <div v-if="healthDay.length === 0" class="text-sm text-gray-500">—</div>
      </template>

      <template v-else>
        <div class="text-sm text-gray-500">—</div>
      </template>
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


