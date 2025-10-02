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

        <div v-if="loading" class="flex items-center justify-center min-h-[100px]">
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
        <button
          v-else
          type="submit"
          class="w-full rounded-md py-2 bg-white text-black hover:bg-zinc-100"
        >
          {{ t('auth.submit') }}
        </button>
      </form>

      <p class="mt-4 text-sm opacity-90">
        {{ t('auth.noAccount') }}
        <router-link class="underline" :to="{ name: 'register', params: { locale: locale.value } }">{{ t('auth.register') }}</router-link>
      </p>
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


