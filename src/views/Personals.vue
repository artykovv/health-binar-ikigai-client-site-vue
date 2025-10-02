<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { http } from '@/api/http'
import { loadMe } from '@/utils/authStorage'

const { t } = useI18n()

const participants = ref([])
const loading = ref(false)
const error = ref('')
const filter = ref('all') // 'all' | 'true' | 'false'
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
    <div v-if="loading" class="mt-4 text-center">
      <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-600 dark:border-t-white"></span>
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
      </div>
      <div v-if="participants.length === 0" class="text-sm text-gray-500">—</div>
    </div>
  </div>
</template>


