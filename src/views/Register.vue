<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { http } from '@/api/http'

const router = useRouter()
const { t, locale } = useI18n()

const branches = ref([])
const submitting = ref(false)
const searchingSponsors = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const sponsorSearch = ref('')
const sponsorResults = ref([])
const selectedSponsor = ref(null)
const showPassword = ref(false)

const form = ref({
  email: '',
  password: '',
  name: '',
  lastname: '',
  patronymic: '',
  sponsor_id: '',
  branch_id: '',
  personal_number: ''
})

async function loadBranches() {
  try {
    const data = await http('/api/branches/?is_active=true')
    branches.value = Array.isArray(data) ? data : (data?.results || [])
  } catch (_) {}
}

async function searchSponsors() {
  const q = sponsorSearch.value.trim()
  if (!q) { sponsorResults.value = []; return }
  searchingSponsors.value = true
  try {
    const data = await http(`/api/participants/?page=1&page_size=20&search=${encodeURIComponent(q)}`)
    sponsorResults.value = data?.participants || []
  } catch (_) {
    sponsorResults.value = []
  } finally {
    searchingSponsors.value = false
  }
}

function selectSponsor(s) {
  selectedSponsor.value = s
  form.value.sponsor_id = s?.id || ''
  sponsorResults.value = []
  sponsorSearch.value = ''
}

function clearSponsor() {
  selectedSponsor.value = null
  form.value.sponsor_id = ''
}

async function generatePersonalNumber() {
  try {
    const data = await http('/api/participants/code')
    if (data?.personal_number) form.value.personal_number = data.personal_number
  } catch (_) {}
}

async function submitRegistration() {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const payload = {
      email: form.value.email,
      password: form.value.password,
      name: form.value.name,
      lastname: form.value.lastname,
      patronymic: form.value.patronymic || null,
      sponsor_id: form.value.sponsor_id || null,
      branch_id: form.value.branch_id ? parseInt(form.value.branch_id) : null,
      code: form.value.personal_number || null,
    }
    await http('/api/participants/', { method: 'POST', body: payload })
    successMessage.value = t('register.success')
    setTimeout(() => {
      try { router.push({ name: 'login', params: { locale: locale.value } }) } catch (_) {}
    }, 1200)
  } catch (e) {
    const raw = (e?.data && (e.data.detail || e.data.message)) || e?.message || ''
    const lower = (raw || '').toLowerCase()
    if (lower.includes('already exists') || lower.includes('уже существует')) {
      errorMessage.value = t('register.errors.emailExists')
    } else {
      errorMessage.value = t('register.errors.generic')
    }
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.value = { email: '', password: '', name: '', lastname: '', patronymic: '', sponsor_id: '', branch_id: '', personal_number: '' }
  selectedSponsor.value = null
  sponsorSearch.value = ''
  sponsorResults.value = []
  errorMessage.value = ''
  successMessage.value = ''
  generatePersonalNumber()
}

onMounted(() => { loadBranches(); generatePersonalNumber() })
</script>

<template>
  <div>
    <div>
      

      <div class="grid md:grid-cols-12 gap-4">
        <div class="md:col-span-8 w-full">
          <div class="rounded-lg bg-[#015C3B] text-white">
            <div class="px-4 py-3">
              <h5 class="m-0">{{ t('register.form') }}</h5>
            </div>
            <div class="p-4">
              <form @submit.prevent="submitRegistration" class="space-y-4">
                <!-- 1) Поиск спонсора -->
                <div class="grid md:grid-cols-12 gap-4">
                  <div class="md:col-span-12">
                    <label for="sponsor_search" class="block text-sm font-medium mb-1">{{ t('register.searchSponsor') }}</label>
                    <input v-model="sponsorSearch" type="text" class="block w-full rounded-md bg-white text-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white border-0" id="sponsor_search" :placeholder="t('register.search')" @input="searchSponsors">
                    <div v-if="sponsorResults.length > 0" class="mt-2 rounded-md shadow">
                      <div class="divide-y dark:divide-gray-700">
                        <button v-for="sponsor in sponsorResults" :key="sponsor.id" @click="selectSponsor(sponsor)" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#4a4a52] dark:text-white">
                          {{ sponsor.lastname }} {{ sponsor.name }} {{ sponsor.patronymic }} - {{ sponsor.personal_number }}
                        </button>
                      </div>
                    </div>
                    <div v-if="selectedSponsor" class="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-[#3f3f47] dark:border-gray-700 dark:text-white">
                      <div class="flex items-center justify-between">
                        <div>
                          <strong>{{ t('register.selectedSponsor') }}</strong>
                          {{ selectedSponsor.lastname }} {{ selectedSponsor.name }} {{ selectedSponsor.patronymic }} - {{ selectedSponsor.personal_number }}
                        </div>
                        <button @click="clearSponsor" class="inline-flex items-center rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:bg-[#3f3f47] dark:text-white dark:border-gray-700 dark:hover:bg-[#4a4a52]">{{ t('register.remove') }}</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 2) Филиал -->
                <div class="grid md:grid-cols-12 gap-4">
                  <div class="md:col-span-12">
                    <label for="branch_id" class="block text-sm font-medium mb-1">{{ t('register.branch') }} *</label>
                    <select v-model="form.branch_id" class="block w-full rounded-md bg-white text-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white border-0" id="branch_id" required>
                      <option value="">{{ t('register.selectBranch') }}</option>
                      <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.code }} - {{ branch.name }} - {{ branch.address }}</option>
                    </select>
                  </div>
                </div>

                <!-- 3) Номер -->
                <div class="grid md:grid-cols-12 gap-4">
                  <div class="md:col-span-12">
                    <label for="personal_number" class="block text-sm font-medium mb-1">{{ t('register.number') }}</label>
                    <input v-model="form.personal_number" type="text" class="block w-full rounded-md bg-white text-black px-3 py-2 text-sm" id="personal_number" disabled :placeholder="t('register.numberHint')">
                    <small class="text-gray-500 dark:text-white">{{ t('register.numberHint') }}</small>
                  </div>
                </div>

                <!-- 4) Остальные поля -->
                <div class="grid md:grid-cols-12 gap-4">
                  <div class="md:col-span-6">
                    <label for="email" class="block text-sm font-medium mb-1">{{ t('register.email') }} *</label>
                    <input v-model="form.email" type="email" class="block w-full rounded-md bg-white text-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white border-0" id="email" required>
                  </div>
                  <div class="md:col-span-6">
                    <label for="password" class="block text-sm font-medium mb-1">{{ t('register.password') }} *</label>
                    <div>
                      <input v-model="form.password" :type="showPassword ? 'text' : 'password'" class="block w-full rounded-md bg-white text-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white border-0" id="password" required>
                      <label class="mt-2 inline-flex items-center gap-2 text-sm opacity-90">
                        <input type="checkbox" v-model="showPassword" class="h-4 w-4 rounded border border-white/50 bg-transparent" />
                        <span>{{ t('auth.showPassword') }}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="grid md:grid-cols-12 gap-4">
                  <div class="md:col-span-4">
                    <label for="name" class="block text-sm font-medium mb-1">{{ t('register.name') }} *</label>
                    <input v-model="form.name" type="text" class="block w-full rounded-md bg-white text-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white border-0" id="name" required>
                  </div>
                  <div class="md:col-span-4">
                    <label for="lastname" class="block text-sm font-medium mb-1">{{ t('register.lastname') }} *</label>
                    <input v-model="form.lastname" type="text" class="block w-full rounded-md bg-white text-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white border-0" id="lastname" required>
                  </div>
                  <div class="md:col-span-4">
                    <label for="patronymic" class="block text-sm font-medium mb-1">{{ t('register.patronymic') }}</label>
                    <input v-model="form.patronymic" type="text" class="block w-full rounded-md bg-white text-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white border-0" id="patronymic">
                  </div>
                </div>

                <div v-if="errorMessage" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-[#3f3f47] dark:border-gray-700 dark:text-white">{{ errorMessage }}</div>
                <div v-if="successMessage" class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-[#3f3f47] dark:border-gray-700 dark:text-white">{{ successMessage }}</div>

                <div class="flex gap-2">
                  <button type="submit" class="inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-white text-base md:text-lg hover:opacity-90 bg-[#437d63]" :disabled="submitting">
                    <span v-if="submitting" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white dark:border-gray-600 dark:border-t-white"></span>
                    {{ submitting ? t('register.submitting') : t('register.submit') }}
                  </button>
                </div>
                <div class="mt-2 text-center text-white">
                  {{ t('auth.haveAccount') }}
                  <router-link :to="{ name: 'login', params: { locale: locale.value } }" class="underline">{{ t('auth.login') }}</router-link>
                </div>
              </form>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>


