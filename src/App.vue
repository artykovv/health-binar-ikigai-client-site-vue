<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { setLocale } from './i18n'

const { t, locale } = useI18n()
const router = useRouter()

const changeLocale = (lang) => {
  setLocale(lang)
  router.push({ name: 'home', params: { locale: lang } })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center p-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ t('welcome') }}</h1>
      <div class="mt-6 inline-flex gap-2 bg-white p-2 rounded-lg shadow">
        <button class="px-3 py-1 rounded border text-sm hover:bg-gray-100" @click="changeLocale('ru')">ru</button>
        <button class="px-3 py-1 rounded border text-sm hover:bg-gray-100" @click="changeLocale('en')">en</button>
        <button class="px-3 py-1 rounded border text-sm hover:bg-gray-100" @click="changeLocale('uz')">uz</button>
        <button class="px-3 py-1 rounded border text-sm hover:bg-gray-100" @click="changeLocale('kg')">kg</button>
      </div>
      <p class="mt-3 text-gray-500 text-sm">Current: {{ locale }}</p>
    </div>
  </div>

</template>

