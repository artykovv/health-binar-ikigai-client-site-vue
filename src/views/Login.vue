<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { login } from '@/api/auth'

const { t, locale } = useI18n()
const router = useRouter()

const form = ref({
  username: '',
  password: '',
})
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await login({ username: form.value.username, password: form.value.password })
    const lang = locale.value
    router.push({ name: 'home', params: { locale: lang } })
  } catch (e) {
    const rawDetail = typeof e?.data === 'string' ? e.data : (e?.data?.detail || e?.data?.message || e?.message || '')
    const lower = String(rawDetail || '').toLowerCase()
    if (e?.status === 400 || lower.includes('login_bad_credentials')) {
      error.value = t('auth.errors.badCredentials')
    } else {
      error.value = t('auth.errors.generic')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center">
    <div class="w-full max-w-md rounded-2xl p-6 shadow bg-[#015C3B] text-white">
      <h2 class="text-xl font-semibold">{{ t('auth.login') }}</h2>
      <form class="mt-5 space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="block text-sm">{{ t('auth.email') }}</label>
          <input
            v-model="form.username"
            type="email"
            autocomplete="username"
            class="mt-1 w-full rounded-md border-0 bg-white text-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white placeholder-zinc-500"
            required
          />
        </div>
        <div>
          <label class="block text-sm">{{ t('auth.password') }}</label>
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            class="mt-1 w-full rounded-md border-0 bg-white text-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white placeholder-zinc-500"
            required
          />
          <label class="mt-2 inline-flex items-center gap-2 text-sm opacity-90">
            <input type="checkbox" v-model="showPassword" class="h-4 w-4 rounded border border-white/50 bg-transparent" />
            <span>{{ t('auth.showPassword') }}</span>
          </label>
        </div>

        <p v-if="error" class="text-sm bg-red-500 text-white rounded-md px-3 py-2">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-md py-2 bg-white text-black hover:bg-zinc-100 disabled:opacity-50"
        >
          {{ loading ? '...' : t('auth.submit') }}
        </button>
      </form>

      <p class="mt-4 text-sm opacity-90">
        {{ t('auth.noAccount') }}
        <router-link class="underline" :to="{ name: 'register', params: { locale: locale.value } }">{{ t('auth.register') }}</router-link>
      </p>
    </div>
  </div>
  
</template>


