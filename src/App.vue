<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { setLocale } from './i18n'
import { clearAuth, loadAuth, onAuthChanged, offAuthChanged, clearMe } from '@/utils/authStorage'
import { getSavedTheme, setTheme } from '@/utils/theme'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

const changeLocale = (lang) => {
  setLocale(lang)
  const targetName = route.name || 'home'
  router.push({
    name: targetName,
    params: { ...(route.params || {}), locale: lang },
    query: route.query,
    hash: route.hash,
  })
}

const auth = ref(loadAuth())
function handleAuthChanged(e) {
  try {
    auth.value = e?.detail?.auth || null
  } catch (_) {
    auth.value = loadAuth()
  }
}
onMounted(() => {
  onAuthChanged(handleAuthChanged)
  // Ensure DOM theme matches saved value on mount/HMR
  setTheme(theme.value)
})
onUnmounted(() => {
  offAuthChanged(handleAuthChanged)
})
function goLogin() {
  router.push({ name: 'login', params: { locale: locale.value } })
}
function goRegister() {
  router.push({ name: 'register', params: { locale: locale.value } })
}
function logout() {
  clearAuth()
  clearMe()
  try {
    window.location.reload()
  } catch (_) {
    router.push({ name: 'home', params: { locale: locale.value } })
  }
}

const theme = ref(getSavedTheme() || 'light')
function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark'
  theme.value = next
  setTheme(next)
}

const langModalOpen = ref(false)
function openLangModal() { langModalOpen.value = true }
function closeLangModal() { langModalOpen.value = false }
function selectLang(lang) { closeLangModal(); changeLocale(lang) }

const menuModalOpen = ref(false)
function openMenuModal() { menuModalOpen.value = true }
function closeMenuModal() { menuModalOpen.value = false }

// Hide menu on auth pages (login/register)
const hideMenu = computed(() => route.name === 'login' || route.name === 'register')
watch(hideMenu, (shouldHide) => { if (shouldHide) closeMenuModal() })
</script>

<template>
  <div>
    <header class="w-full h-[50px] flex items-center justify-end px-4 gap-2 mt-5">
      <button class="group inline-flex items-center justify-center rounded-full h-9 w-9 shadow-lg ring-1 backdrop-blur-sm transition"
        :class="theme === 'dark'
          ? 'bg-[#282828] text-white ring-white/10 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]'
          : 'bg-white text-black ring-zinc-900/5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]'"
        @click="toggleTheme" aria-label="Toggle theme">
        <transition name="fade" mode="out-in">
          <span :key="theme" class="text-base">{{ theme === 'dark' ? '🌙' : '☀️' }}</span>
        </transition>
      </button>
      <button class="group flex items-center rounded-full px-4 py-2 text-sm font-medium shadow-lg ring-1 backdrop-blur-sm"
        :class="theme === 'dark'
          ? 'bg-[#282828] text-white ring-white/10 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]'
          : 'bg-white text-black ring-zinc-900/5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]'"
        @click="openLangModal">
        <span class="font-medium">{{ (locale || '').toUpperCase() }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </button>
      <button v-if="!hideMenu" aria-label="Menu" class="group flex items-center rounded-full px-4 py-2 text-sm font-medium shadow-lg ring-1 backdrop-blur-sm"
        :class="theme === 'dark'
          ? 'bg-[#282828] text-white ring-white/10 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]'
          : 'bg-white text-black ring-zinc-900/5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]'"
        @click="openMenuModal">
        <span class="font-medium">{{ t('ui.menu') }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </button>
    </header>
    <!-- Overlay for any modal -->
    <transition name="fade">
      <div v-if="langModalOpen || (menuModalOpen && !hideMenu)" class="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs" @click="() => { closeLangModal(); closeMenuModal() }"></div>
    </transition>
    <transition name="scale">
      <div v-if="langModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="closeLangModal">
        <div class="w-full max-w-sm rounded-3xl p-8 shadow" :class="theme === 'dark' ? 'bg-[#282828] text-white' : 'bg-white text-zinc-900'" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium" :class="theme === 'dark' ? 'text-white' : 'text-zinc-700'">{{ t('ui.language') }}</h3>
            <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" @click="closeLangModal" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
            </button>
          </div>
          <div class="-mx-2">
            <button class="w-full flex items-center justify-between px-2 py-4 text-lg border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800" @click="selectLang('ru')">
              <span>RU</span>
              <span v-if="locale === 'ru'" class="text-blue-600">✓</span>
            </button>
            <button class="w-full flex items-center justify-between px-2 py-4 text-lg border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800" @click="selectLang('en')">
              <span>EN</span>
              <span v-if="locale === 'en'" class="text-blue-600">✓</span>
            </button>
            <button class="w-full flex items-center justify-between px-2 py-4 text-lg border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800" @click="selectLang('kg')">
              <span>KG</span>
              <span v-if="locale === 'kg'" class="text-blue-600">✓</span>
            </button>
            <button class="w-full flex items-center justify-between px-2 py-4 text-lg border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800" @click="selectLang('uz')">
              <span>UZ</span>
              <span v-if="locale === 'uz'" class="text-blue-600">✓</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
    <!-- Menu Modal -->
    <transition name="scale">
      <div v-if="menuModalOpen && !hideMenu" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="closeMenuModal">
        <div class="w-full max-w-sm rounded-3xl p-8 shadow" :class="theme === 'dark' ? 'bg-[#282828] text-white' : 'bg-white text-zinc-900'" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium" :class="theme === 'dark' ? 'text-white' : 'text-zinc-700'">{{ t('ui.menu') }}</h3>
            <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" @click="closeMenuModal" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
            </button>
          </div>
          <div class="-mx-2">
            <router-link class="block w-full text-left px-2 py-4 text-lg border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800" :to="{ name: 'home', params: { locale: locale } }" @click="closeMenuModal">{{ t('menu.home') }}</router-link>
            <router-link class="block w-full text-left px-2 py-4 text-lg border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800" :to="{ name: 'structure', params: { locale: locale } }" @click="closeMenuModal">{{ t('menu.structure') }}</router-link>
            <router-link class="block w-full text-left px-2 py-4 text-lg border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800" :to="{ name: 'bonuses', params: { locale: locale } }" @click="closeMenuModal">{{ t('menu.bonuses') }}</router-link>
            <router-link class="block w-full text-left px-2 py-4 text-lg border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800" :to="{ name: 'personals', params: { locale: locale } }" @click="closeMenuModal">{{ t('menu.personals') }}</router-link>
            <router-link class="block w-full text-left px-2 py-4 text-lg border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800" :to="{ name: 'edit-profile', params: { locale: locale } }" @click="closeMenuModal">{{ t('menu.edit_profile') }}</router-link>
            <button class="block w-full text-left px-2 py-4 text-lg border-b last:border-b-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800" @click="() => { closeMenuModal(); logout() }">{{ t('auth.logout') }}</button>
          </div>
        </div>
      </div>
    </transition>
    
    <div class="mx-auto w-full max-w-md px-4 mt-10">
      <div class="justify-center">
        <router-view />
      </div>
    </div>
  </div>

</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.scale-enter-active, .scale-leave-active { transition: opacity .2s ease, transform .2s ease; }
.scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(0.98); }
</style>

