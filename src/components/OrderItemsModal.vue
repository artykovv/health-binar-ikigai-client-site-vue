<script setup>
import { ref, watch, computed } from 'vue'
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { http, storeHttp } from '@/api/http'
import { STORE_API_BASE } from '@/config'

const { t } = useI18n()

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  orderId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['close'])

const order = ref(null)
const orderItems = ref([])
const loading = ref(false)
const error = ref('')

// Загружаем данные заказа при открытии модального окна
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.orderId) {
    loadOrder()
  } else {
    // Сбрасываем данные при закрытии
    order.value = null
    orderItems.value = []
    error.value = ''
  }
})

async function loadOrder() {
  if (!props.orderId) return
  
  loading.value = true
  error.value = ''
  try {
    const data = await http(`/api/orders/${props.orderId}`)
    // API возвращает массив, берем первый элемент
    order.value = Array.isArray(data) ? data[0] : data
    orderItems.value = order.value?.items || []
    
    // Загружаем информацию о товарах из store API
    await loadProductDetails()
  } catch (e) {
    error.value = e?.message || t('order_items.load_error')
    order.value = null
    orderItems.value = []
  } finally {
    loading.value = false
  }
}

async function loadProductDetails() {
  if (!orderItems.value.length) return
  
  try {
    // Загружаем все варианты товаров
    const variants = await storeHttp('/api/products/variants?skip=0&limit=100&is_binar=true')
    const variantsMap = {}
    variants.forEach(v => {
      variantsMap[v.id] = v
    })
    
    // Обогащаем items данными о товарах
    orderItems.value = orderItems.value.map(item => {
      const variant = variantsMap[item.variant_id]
      return {
        ...item,
        product: variant || null
      }
    })
  } catch (e) {
    console.error('Error loading product details:', e)
  }
}

function getProductImage(product) {
  if (product && product.images && product.images.length > 0 && product.images[0].src) {
    const imagePath = product.images[0].src
    if (imagePath.startsWith('/')) {
      return `${STORE_API_BASE}${imagePath}`
    }
    return imagePath
  }
  return null
}

function getProductVariant(product) {
  if (product && product.variant_attributes && product.variant_attributes.length > 0) {
    return product.variant_attributes[0].value
  }
  return ''
}

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

function handleClose() {
  emit('close')
}

function handleBackdropClick(e) {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

function handleEscape(e) {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click="handleBackdropClick"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-0 sm:p-4">
        <transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div
            v-if="isOpen"
            class="relative transform overflow-hidden rounded-none sm:rounded-2xl bg-white text-left shadow-xl transition-all dark:bg-[#015C3B] w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] flex flex-col"
            @click.stop
          >
            <!-- Header -->
            <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-white/20 flex-shrink-0">
              <div class="flex items-center justify-between">
                <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {{ t('order_items.title') }} #{{ orderId }}
                </h3>
                <button
                  type="button"
                  @click="handleClose"
                  class="rounded-md p-2 -mr-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 touch-manipulation"
                  aria-label="Close"
                >
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div v-if="order" class="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <div>{{ t('order_items.created_at') }}: {{ formatDate(order.created_at) }}</div>
                <div>{{ t('order_items.total_amount') }}: {{ order.total_amount }} {{ t('product_selection.currency') }}</div>
                <div>{{ t('order_items.status') }}: <span :class="order.status === 'paid' || order.status === 'issued' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'">{{ order.status }}</span></div>
              </div>
            </div>

            <!-- Content -->
            <div class="px-4 sm:px-6 py-4 flex-1 overflow-y-auto" style="max-height: calc(100vh - 200px);">
              <!-- Loading state -->
              <div v-if="loading" class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">{{ t('order_items.loading') }}</p>
              </div>

              <!-- Error state -->
              <div v-if="error && !loading" class="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
              </div>

              <!-- Products - Mobile Cards View -->
              <div v-if="!loading && orderItems.length > 0" class="block md:hidden space-y-3">
                <div
                  v-for="item in orderItems"
                  :key="item.id"
                  class="bg-white dark:bg-[#015C3B] rounded-xl p-4 border border-gray-200 dark:border-white/20"
                >
                  <div class="flex items-start gap-4">
                    <!-- Product Image -->
                    <div class="flex-shrink-0">
                      <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        <img
                          v-if="item.product && getProductImage(item.product)"
                          :src="getProductImage(item.product)"
                          :alt="item.product.full_name"
                          class="w-full h-full object-cover"
                          @error="(e) => { e.target.style.display = 'none' }"
                        />
                        <svg v-else class="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    <!-- Product Info -->
                    <div class="flex-1 min-w-0">
                      <div class="mb-2">
                        <h4 class="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-0.5">
                          {{ item.product?.product_name || item.product?.full_name || `Variant ${item.variant_id}` }}
                        </h4>
                        <p v-if="item.product && getProductVariant(item.product)" class="text-xs text-gray-500 dark:text-gray-400">
                          {{ getProductVariant(item.product) }}
                        </p>
                      </div>

                      <div class="flex items-center justify-between mt-3">
                        <div class="text-base font-semibold text-gray-900 dark:text-white">
                          {{ item.price }} {{ t('product_selection.currency') }}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                          {{ t('order_items.quantity') }}: {{ item.quantity }}
                        </div>
                      </div>

                      <div v-if="item.issued_quantity !== undefined" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {{ t('order_items.issued_quantity') }}: {{ item.issued_quantity }} / {{ item.quantity }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Products - Desktop Table View -->
              <div v-if="!loading && orderItems.length > 0" class="hidden md:block overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-white/20">
                  <thead class="bg-gray-50 dark:bg-[#437d63]">
                    <tr>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                        {{ t('order_items.product') }}
                      </th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                        {{ t('order_items.price') }}
                      </th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                        {{ t('order_items.quantity') }}
                      </th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                        {{ t('order_items.total') }}
                      </th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                        {{ t('order_items.issued') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-[#015C3B] divide-y divide-gray-200 dark:divide-white/20">
                    <tr v-for="item in orderItems" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-[#437d63]">
                      <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div class="font-medium">{{ item.product?.product_name || item.product?.full_name || `Variant ${item.variant_id}` }}</div>
                        <div v-if="item.product && getProductVariant(item.product)" class="text-xs text-gray-500 dark:text-gray-400">
                          {{ getProductVariant(item.product) }}
                        </div>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {{ item.price }} {{ t('product_selection.currency') }}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {{ item.quantity }}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {{ (item.price * item.quantity).toFixed(2) }} {{ t('product_selection.currency') }}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {{ item.issued_quantity !== undefined ? `${item.issued_quantity} / ${item.quantity}` : '-' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Empty state -->
              <div v-if="!loading && orderItems.length === 0 && !error" class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">{{ t('order_items.no_items') }}</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-white/20 flex justify-end flex-shrink-0 bg-white dark:bg-[#015C3B]">
              <button
                type="button"
                @click="handleClose"
                class="w-full sm:w-auto px-6 py-3 text-base sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-[#437d63] dark:text-white dark:border-white/20 dark:hover:bg-[#015C3B] touch-manipulation"
              >
                {{ t('order_items.close') }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Additional styles if needed */
</style>

