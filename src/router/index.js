import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import { i18n, supportedLocales, resolveInitialLocale } from '../i18n'

const routes = [
  {
    path: '/:locale(en|ru|uz|kg)?',
    name: 'home',
    component: App,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const paramLocale = (to.params.locale || '').toString()
  if (paramLocale && supportedLocales.includes(paramLocale)) {
    // Update i18n and storage when navigating with explicit locale
    i18n.global.locale.value = paramLocale
    try { localStorage.setItem('locale', paramLocale) } catch (_) {}
    return next()
  }
  // If no locale in URL, resolve from storage/browser and redirect
  const initial = resolveInitialLocale()
  return next({ name: 'home', params: { locale: initial } })
})

export default router


