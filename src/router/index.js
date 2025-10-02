import { createRouter, createWebHistory } from 'vue-router'
import { i18n, supportedLocales, resolveInitialLocale } from '../i18n'
import { loadAuth } from '@/utils/authStorage'

const routes = [
  {
    path: '/:locale(en|ru|uz|kg)?',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: { titleKey: 'titles.home' },
  },
  {
    path: '/:locale(en|ru|uz|kg)?/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { titleKey: 'titles.login' },
  },
  {
    path: '/:locale(en|ru|uz|kg)?/register',
    name: 'register',
    component: () => import('@/views/Register.vue'),
    meta: { titleKey: 'titles.register' },
  },
  {
    path: '/:locale(en|ru|uz|kg)?/structure/:id?',
    name: 'structure',
    component: () => import('@/views/Structure.vue'),
    meta: { titleKey: 'titles.structure' },
  },
  {
    path: '/:locale(en|ru|uz|kg)?/bonuses',
    name: 'bonuses',
    component: () => import('@/views/Bonuses.vue'),
    meta: { titleKey: 'titles.bonuses' },
  },
  {
    path: '/:locale(en|ru|uz|kg)?/personals',
    name: 'personals',
    component: () => import('@/views/Personals.vue'),
    meta: { titleKey: 'titles.personals' },
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
    // Continue below to enforce auth
  }
  // If no locale in URL, resolve from storage/browser and redirect to the same route with locale
  const initial = resolveInitialLocale()
  const hasLocale = !!paramLocale && supportedLocales.includes(paramLocale)
  const ensureWithLocale = (target) => ({
    name: target.name || 'home',
    params: { ...(target.params || {}), locale: hasLocale ? paramLocale : initial },
    query: target.query,
    hash: target.hash,
  })

  // Enforce auth for all non-auth routes
  const isAuthRoute = to.name === 'login' || to.name === 'register'
  const isLoggedIn = !!loadAuth()
  if (!isLoggedIn && !isAuthRoute) {
    return next(ensureWithLocale({ name: 'login', query: { redirect: to.fullPath } }))
  }

  if (!hasLocale) {
    return next(ensureWithLocale(to))
  }

  return next()
})

export default router

// Set document title after navigation
router.afterEach((to) => {
  try {
    const key = to.meta && to.meta.titleKey
    if (key) {
      const page = i18n.global.t(String(key))
      document.title = page || ''
    } else {
      document.title = ''
    }
  } catch (_) {
    // noop
  }
})


