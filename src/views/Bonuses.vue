<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { http } from '@/api/http'
import { loadMe } from '@/utils/authStorage'

const { t } = useI18n()

const tab = ref('multi') // 'multi' | 'structure' | 'sponsor'
const loading = ref(false)
const error = ref('')
const multi = ref([])
const structure = ref([])
const sponsor = ref([])

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
      multi.value = await http(`/api/bonuses/multi_bonuses?${query}`)
    }
    if (which === 'structure' && structure.value.length === 0) {
      structure.value = await http(`/api/bonuses/structure_bonuses?${query}`)
    }
    if (which === 'sponsor' && sponsor.value.length === 0) {
      sponsor.value = await http(`/api/bonuses/sponsor_bonuses?${query}`)
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

    <div class="flex gap-4 mt-3">
      <button :style="tab === 'multi' ? activeBtnStyle : null" @click="setTab('multi')">{{ t('home.multibonus') }}</button>
      <button :style="tab === 'structure' ? activeBtnStyle : null" @click="setTab('structure')">{{ t('home.structure_bonus') }}</button>
      <button :style="tab === 'sponsor' ? activeBtnStyle : null" @click="setTab('sponsor')">{{ t('home.sponsor_bonus') }}</button>
    </div>

    <div v-if="loading" class="mt-4 text-center">
      <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-600 dark:border-t-white"></span>
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
        </div>
        <div v-if="multi.length === 0" class="text-sm text-gray-500">—</div>
      </template>

      <template v-else-if="tab === 'structure'">
        <div v-for="b in structure" :key="`st-${b.id}`" class="rounded-2xl p-4 shadow bg-[#015C3B] text-white">
          <div class="flex items-center justify-between">
            <div class="text-sm opacity-80">{{ t('home.structure_bonus') }}</div>
            <div class="text-xs opacity-80">{{ formatDate(b.received_at) }}</div>
          </div>
          <div class="mt-1 text-base font-medium">+{{ b.amount }}</div>
          <div class="text-xs opacity-80">#{{ b.cycle_number }} · {{ t('home.stage') }} {{ b.stage_number }}</div>
        </div>
        <div v-if="structure.length === 0" class="text-sm text-gray-500">—</div>
      </template>

      <template v-else>
        <div v-for="b in sponsor" :key="`sp-${b.id}`" class="rounded-2xl p-4 shadow bg-[#015C3B] text-white">
          <div class="flex items-center justify-between">
            <div class="text-sm opacity-80">{{ t('home.sponsor_bonus') }}</div>
            <div class="text-xs opacity-80">{{ formatDate(b.received_at) }}</div>
          </div>
        <div class="mt-1 text-base font-medium">+{{ b.amount }}</div>
          <div class="text-xs opacity-80">#{{ b.cycle_number }} · {{ t('home.stage') }} {{ b.stage_number }}</div>
        </div>
        <div v-if="sponsor.length === 0" class="text-sm text-gray-500">—</div>
      </template>
    </div>
  </div>
</template>


