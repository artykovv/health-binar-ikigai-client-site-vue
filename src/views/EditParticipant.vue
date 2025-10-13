<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { http } from '@/api/http'
import { loadMe } from '@/utils/authStorage'

const router = useRouter()
const { t } = useI18n()

const me = loadMe()
const participantId = ref(me?.id || '')

const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const showPassword = ref(false)

const form = ref({
  email: '',
  password: '',
  name: '',
  lastname: '',
  patronymic: '',
  personal_number: ''
})

const passportForm = ref({
  pin: '',
  passport_id: '',
  passport_issuer: '',
  passport_issue_date: '',
  bank: '',
  ip_inn: false,
  pensioner: false,
  phone_number: '',
  date_birth: ''
})

const togglePassword = () => { showPassword.value = !showPassword.value }

const loadParticipant = async () => {
  if (!participantId.value) return
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const p = await http(`/api/participants/${participantId.value}`)
    form.value.email = p.email || ''
    form.value.name = p.name || ''
    form.value.lastname = p.lastname || ''
    form.value.patronymic = p.patronymic || ''
    form.value.personal_number = p.personal_number || p.code || ''
    
    const passportInfo = p.passport_info || {}
    passportForm.value.pin = passportInfo.pin || ''
    passportForm.value.passport_id = passportInfo.passport_id || ''
    passportForm.value.passport_issuer = passportInfo.passport_issuer || ''
    passportForm.value.passport_issue_date = passportInfo.passport_issue_date || ''
    passportForm.value.bank = passportInfo.bank || ''
    passportForm.value.ip_inn = passportInfo.ip_inn || false
    passportForm.value.pensioner = passportInfo.pensioner || false
    passportForm.value.phone_number = passportInfo.phone_number || ''
    passportForm.value.date_birth = passportInfo.date_birth || ''
  } catch (error) {
    console.error('Error loading participant:', error)
    errorMessage.value = t('edit_participant.error_loading')
  }
}

const submitEdit = async () => {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    // Обновляем основную информацию
    const payload = {
      email: form.value.email,
      name: form.value.name,
      lastname: form.value.lastname,
      patronymic: form.value.patronymic || null
    }
    if (form.value.password && form.value.password.trim().length > 0) {
      payload.password = form.value.password
    }
    await http(`/api/participants/${participantId.value}`, { method: 'PUT', body: payload })
    
    // Обновляем паспортную информацию
    const passportPayload = {
      pin: passportForm.value.pin || null,
      passport_id: passportForm.value.passport_id || null,
      passport_issuer: passportForm.value.passport_issuer || null,
      passport_issue_date: passportForm.value.passport_issue_date || null,
      bank: passportForm.value.bank || null,
      ip_inn: passportForm.value.ip_inn || false,
      pensioner: passportForm.value.pensioner || false,
      phone_number: passportForm.value.phone_number || null,
      date_birth: passportForm.value.date_birth || null
    }
    await http(`/api/participants/passport_info/${participantId.value}`, { method: 'PUT', body: passportPayload })
    
    successMessage.value = t('edit_participant.success')
    setTimeout(() => { router.go(-1) }, 1200)
  } catch (error) {
    console.error('Error saving participant:', error)
    errorMessage.value = error?.message || t('edit_participant.error_saving')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadParticipant()
})
</script>

<template>
  <div class="py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">{{ t('edit_participant.title') }}</h1>
      <button @click="$router.go(-1)" class="inline-flex items-center rounded-full bg-[#015C3B] px-4 py-2 text-white text-sm hover:bg-[#014A2F]">
        {{ t('edit_participant.back') }}
      </button>
    </div>

    <div class="max-w-4xl mx-auto">
      <div class="bg-[#015C3B] rounded-2xl shadow text-white">
        <div class="px-6 py-4 border-b border-white/10 rounded-t-2xl">
          <h5 class="m-0 font-semibold text-white">{{ t('edit_participant.form_title') }}</h5>
        </div>
        <div class="p-6">
            <form @submit.prevent="submitEdit" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="email" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.email') }} *</label>
                  <input v-model="form.email" type="email" id="email" required
                    class="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                </div>
                <div>
                  <label for="password" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.password') }}</label>
                  <div class="relative">
                    <input v-model="form.password" :type="showPassword ? 'text' : 'password'" id="password"
                      class="block w-full rounded-lg border-0 bg-white px-3 py-2 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                    <button @click="togglePassword" type="button" class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 hover:text-gray-900">
                      {{ showPassword ? '👁' : '👁‍🗨' }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label for="name" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.name') }} *</label>
                  <input v-model="form.name" type="text" id="name" required
                    class="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                </div>
                <div>
                  <label for="lastname" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.lastname') }} *</label>
                  <input v-model="form.lastname" type="text" id="lastname" required
                    class="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                </div>
                <div>
                  <label for="patronymic" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.patronymic') }}</label>
                  <input v-model="form.patronymic" type="text" id="patronymic"
                    class="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label for="personal_number" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.personal_number') }}</label>
                  <input v-model="form.personal_number" type="text" id="personal_number" disabled
                    class="block w-full rounded-lg border-0 bg-white/50 px-3 py-2 text-sm text-gray-700">
                </div>
              </div>

              <!-- Паспортная информация -->
              <div class="border-t border-white/10 pt-4">
                <h6 class="text-sm font-semibold mb-3 text-white">{{ t('edit_participant.passport_info') }}</h6>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label for="pin" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.pin') }}</label>
                    <input v-model="passportForm.pin" type="text" id="pin"
                      class="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                  </div>
                  <div>
                    <label for="passport_id" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.passport_id') }}</label>
                    <input v-model="passportForm.passport_id" type="text" id="passport_id"
                      class="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label for="passport_issuer" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.passport_issuer') }}</label>
                    <input v-model="passportForm.passport_issuer" type="text" id="passport_issuer"
                      class="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                  </div>
                  <div>
                    <label for="passport_issue_date" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.passport_issue_date') }}</label>
                    <input v-model="passportForm.passport_issue_date" type="date" id="passport_issue_date"
                      class="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label for="date_birth" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.date_birth') }}</label>
                    <input v-model="passportForm.date_birth" type="date" id="date_birth"
                      class="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                  </div>
                  <div>
                    <label for="phone_number" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.phone') }}</label>
                    <input v-model="passportForm.phone_number" type="text" id="phone_number"
                      class="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                  </div>
                </div>

                <div class="grid grid-cols-1 mb-4">
                  <div>
                    <label for="bank" class="block text-sm font-medium text-white mb-1">{{ t('edit_participant.bank') }}</label>
                    <input v-model="passportForm.bank" type="text" id="bank"
                      class="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="flex items-center text-sm text-white">
                      <input v-model="passportForm.ip_inn" type="checkbox" class="mr-2 rounded border-gray-300 text-[#015C3B] focus:ring-white">
                      {{ t('edit_participant.ip_inn') }}
                    </label>
                  </div>
                  <div>
                    <label class="flex items-center text-sm text-white">
                      <input v-model="passportForm.pensioner" type="checkbox" class="mr-2 rounded border-gray-300 text-[#015C3B] focus:ring-white">
                      {{ t('edit_participant.pensioner') }}
                    </label>
                  </div>
                </div>
              </div>

              <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{{ errorMessage }}</div>
              <div v-if="successMessage" class="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{{ successMessage }}</div>

              <div class="flex flex-col sm:flex-row gap-2">
                <button type="submit" :disabled="submitting"
                  class="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-[#015C3B] text-sm font-medium hover:bg-gray-100 disabled:opacity-40">
                  {{ submitting ? t('edit_participant.saving') : t('edit_participant.save') }}
                </button>
                <button @click="loadParticipant" type="button"
                  class="inline-flex items-center justify-center rounded-full border border-white px-4 py-2 text-sm text-white hover:bg-white/10">
                  {{ t('edit_participant.reset') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
</template>

