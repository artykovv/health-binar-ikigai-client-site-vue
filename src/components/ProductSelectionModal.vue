<script setup>
import { ref, watch, computed } from 'vue'
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeHttp, http } from '@/api/http'
import { STORE_API_BASE } from '@/config'

const { t } = useI18n()

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  contract: {
    type: Object,
    default: null
  },
  participantId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'order-created'])

const products = ref([])
const loading = ref(false)
const error = ref('')
const submitting = ref(false)
const selectedProducts = ref({}) // { productId: quantity }

// Watch for modal open to load products
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadProducts()
  } else {
    // Reset selections when modal closes
    selectedProducts.value = {}
  }
})

async function loadProducts() {
  loading.value = true
  error.value = ''
  try {
    const data = await storeHttp('/api/products/variants?skip=0&limit=100&is_binar=true')
    products.value = data || []
  } catch (e) {
    error.value = e?.message || 'Error loading products'
    products.value = []
  } finally {
    loading.value = false
  }
}

function toggleProduct(productId) {
  if (selectedProducts.value[productId]) {
    delete selectedProducts.value[productId]
  } else {
    const product = products.value.find(p => p.id === productId)
    if (!product) return
    
    // Проверяем лимит контракта перед добавлением
    const contractLimit = props.contract ? parseFloat(props.contract.remaining_amount) : Infinity
    const currentTotal = totalAmount.value
    const productPrice = product.price
    
    if (currentTotal + productPrice > contractLimit) {
      // Вычисляем максимальное количество, которое можно добавить
      const availableAmount = contractLimit - currentTotal
      const maxQty = Math.floor(availableAmount / productPrice)
      if (maxQty > 0) {
        selectedProducts.value[productId] = maxQty
      }
    } else {
      selectedProducts.value[productId] = 1
    }
  }
}

function incrementQuantity(productId) {
  const product = products.value.find(p => p.id === productId)
  if (!product) return
  const currentQty = selectedProducts.value[productId] || 0
  
  // Вычисляем новую общую сумму с увеличенным количеством
  const newQty = currentQty + 1
  const currentTotal = totalAmount.value
  const currentProductTotal = product.price * currentQty
  const newProductTotal = product.price * newQty
  const newTotal = currentTotal - currentProductTotal + newProductTotal
  
  // Проверяем лимит контракта
  const contractLimit = props.contract ? parseFloat(props.contract.remaining_amount) : Infinity
  if (newTotal > contractLimit) {
    // Вычисляем максимальное количество, которое можно добавить
    const availableAmount = contractLimit - currentTotal + currentProductTotal
    const maxQty = Math.floor(availableAmount / product.price)
    if (maxQty > currentQty) {
      selectedProducts.value[productId] = maxQty
    }
    return
  }
  
  // Если товар есть в наличии, ограничиваем количеством на складе, иначе разрешаем увеличивать
  const finalQty = product.stock > 0 ? Math.min(newQty, product.stock) : newQty
  if (finalQty > 0) {
    selectedProducts.value[productId] = finalQty
  }
}

function decrementQuantity(productId) {
  const currentQty = selectedProducts.value[productId] || 0
  if (currentQty > 1) {
    selectedProducts.value[productId] = currentQty - 1
  } else {
    delete selectedProducts.value[productId]
  }
}

function removeProduct(productId) {
  delete selectedProducts.value[productId]
}

function getProductImage(product) {
  if (product.images && product.images.length > 0 && product.images[0].src) {
    // Если путь начинается с /, добавляем STORE_API_BASE
    const imagePath = product.images[0].src
    if (imagePath.startsWith('/')) {
      return `${STORE_API_BASE}${imagePath}`
    }
    return imagePath
  }
  return null
}

function getProductVariant(product) {
  if (product.variant_attributes && product.variant_attributes.length > 0) {
    return product.variant_attributes[0].value
  }
  return ''
}

function updateQuantity(productId, quantity) {
  const product = products.value.find(p => p.id === productId)
  if (!product) return
  
  let qty = Math.max(0, parseInt(quantity) || 0)
  
  // Limit quantity to available stock only if stock > 0
  if (product.stock > 0 && qty > product.stock) {
    qty = product.stock
  }
  
  // Проверяем лимит контракта
  const contractLimit = props.contract ? parseFloat(props.contract.remaining_amount) : Infinity
  const currentTotal = totalAmount.value
  const currentQty = selectedProducts.value[productId] || 0
  const currentProductTotal = product.price * currentQty
  const newProductTotal = product.price * qty
  const newTotal = currentTotal - currentProductTotal + newProductTotal
  
  if (newTotal > contractLimit) {
    // Вычисляем максимальное количество, которое можно установить
    const availableAmount = contractLimit - currentTotal + currentProductTotal
    const maxQty = Math.floor(availableAmount / product.price)
    if (maxQty > 0) {
      qty = maxQty
    } else {
      qty = 0
    }
  }
  
  if (qty > 0) {
    selectedProducts.value[productId] = qty
  } else {
    delete selectedProducts.value[productId]
  }
}

function getProductQuantity(productId) {
  return selectedProducts.value[productId] || 0
}

function isProductSelected(productId) {
  return !!selectedProducts.value[productId]
}

const totalAmount = computed(() => {
  let total = 0
  products.value.forEach(product => {
    if (selectedProducts.value[product.id]) {
      total += product.price * selectedProducts.value[product.id]
    }
  })
  return total
})

const hasSelectedProducts = computed(() => {
  return Object.keys(selectedProducts.value).length > 0
})

const contractRemaining = computed(() => {
  return props.contract ? parseFloat(props.contract.remaining_amount) : 0
})

const canAddMore = computed(() => {
  return totalAmount.value < contractRemaining.value
})

const remainingAfterPurchase = computed(() => {
  return Math.max(0, contractRemaining.value - totalAmount.value)
})

function handleClose() {
  emit('close')
}

async function handleConfirm() {
  if (!props.contract || !props.participantId) {
    error.value = t('product_selection.missing_data')
    return
  }

  if (!hasSelectedProducts.value) {
    return
  }

  submitting.value = true
  error.value = ''

  try {
    // Формируем items из выбранных товаров
    const items = []
    products.value.forEach(product => {
      if (selectedProducts.value[product.id]) {
        items.push({
          variant_id: product.id,
          quantity: selectedProducts.value[product.id],
          price: product.price
        })
      }
    })

    // Используем id контракта
    const contractId = props.contract.id

    // Формируем contributions
    const contributions = [{
      participant_id: props.participantId,
      contract_id: contractId,
      amount: totalAmount.value.toFixed(2)
    }]

    // Отправляем POST запрос
    const orderData = {
      responsible_participant_id: props.participantId,
      items: items,
      contributions: contributions
    }

    await http('/api/orders/', {
      method: 'POST',
      body: orderData
    })

    // Успешно создан заказ - закрываем модальное окно и сбрасываем выбор
    selectedProducts.value = {}
    emit('order-created')
    handleClose()
  } catch (e) {
    error.value = e?.message || t('product_selection.order_error')
    console.error('Order creation error:', e)
  } finally {
    submitting.value = false
  }
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
                  {{ t('product_selection.title') }}
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
            </div>

            <!-- Content -->
            <div class="px-4 sm:px-6 py-4 flex-1 overflow-y-auto" style="max-height: calc(100vh - 180px);">
              <div v-if="contract" class="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 p-3 sm:p-4">
                <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <span class="font-medium">{{ t('product_selection.contract_amount') }}:</span>
                  <span class="ml-2">{{ contract.remaining_amount }} {{ t('product_selection.currency') }}</span>
                </div>
                <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  <span class="font-medium">{{ t('product_selection.initial_amount') }}:</span>
                  <span class="ml-2">{{ contract.initial_amount }} {{ t('product_selection.currency') }}</span>
                </div>
              </div>

              <!-- Loading state -->
              <div v-if="loading" class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">{{ t('product_selection.loading') }}</p>
              </div>

              <!-- Error state -->
              <div v-if="error && !loading" class="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
              </div>

              <!-- Products - Mobile Cards View -->
              <div v-if="!loading && products.length > 0" class="block md:hidden space-y-3">
                <!-- Product Cards -->
                <div
                  v-for="product in products"
                  :key="product.id"
                  class="bg-white dark:bg-[#015C3B] rounded-xl p-4 border border-gray-200 dark:border-white/20"
                >
                  <div class="flex items-start gap-4">
                    <!-- Product Image -->
                    <div class="flex-shrink-0">
                      <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        <img
                          v-if="getProductImage(product)"
                          :src="getProductImage(product)"
                          :alt="product.full_name"
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
                      <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="flex-1 min-w-0">
                          <h4 class="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-0.5">
                            {{ product.product_name || product.full_name }}
                          </h4>
                          <p v-if="getProductVariant(product)" class="text-xs text-gray-500 dark:text-gray-400">
                            {{ getProductVariant(product) }}
                          </p>
                        </div>
                        <button
                          v-if="isProductSelected(product.id)"
                          @click="removeProduct(product.id)"
                          class="flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 touch-manipulation p-1"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div class="flex items-center justify-between mt-3">
                        <div class="text-base font-semibold text-gray-900 dark:text-white">
                          {{ product.price }} {{ t('product_selection.currency') }}
                        </div>

                        <!-- Quantity Selector -->
                        <div v-if="isProductSelected(product.id)" class="flex items-center gap-2">
                          <button
                            @click="decrementQuantity(product.id)"
                            :disabled="getProductQuantity(product.id) <= 1"
                            class="w-8 h-8 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-[#437d63] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#015C3B] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                            </svg>
                          </button>
                          <span class="w-8 text-center text-sm font-medium text-gray-900 dark:text-white">
                            {{ getProductQuantity(product.id) }}
                          </span>
                          <button
                            @click="incrementQuantity(product.id)"
                            :disabled="(product.stock > 0 && getProductQuantity(product.id) >= product.stock) || (totalAmount + product.price > contractRemaining)"
                            class="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>

                        <!-- Add Button -->
                        <button
                          v-else
                          @click="toggleProduct(product.id)"
                          :disabled="totalAmount + product.price > contractRemaining"
                          class="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        >
                          {{ t('product_selection.add') }}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              <!-- Products - Desktop Table View -->
              <div v-if="!loading && products.length > 0" class="hidden md:block overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-white/20">
                  <thead class="bg-gray-50 dark:bg-[#437d63]">
                    <tr>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                        <input
                          type="checkbox"
                          :checked="products.length > 0 && products.every(p => isProductSelected(p.id))"
                          @change="(e) => {
                            if (e.target.checked) {
                              // Добавляем товары с учетом лимита контракта
                              const contractLimit = props.contract ? parseFloat(props.contract.remaining_amount) : Infinity
                              let currentTotal = 0
                              products.forEach(p => {
                                if (currentTotal + p.price <= contractLimit) {
                                  selectedProducts.value[p.id] = 1
                                  currentTotal += p.price
                                }
                              })
                            } else {
                              selectedProducts.value = {}
                            }
                          }"
                          class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                        {{ t('product_selection.product_name') }}
                      </th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                        {{ t('product_selection.price') }}
                      </th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                        {{ t('product_selection.quantity') }}
                      </th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                        {{ t('product_selection.total') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-[#015C3B] divide-y divide-gray-200 dark:divide-white/20">
                    <tr v-for="product in products" :key="product.id" class="hover:bg-gray-50 dark:hover:bg-[#437d63]">
                      <td class="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          :checked="isProductSelected(product.id)"
                          @change="toggleProduct(product.id)"
                          :disabled="!isProductSelected(product.id) && totalAmount + product.price > contractRemaining"
                          class="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div class="font-medium">{{ product.full_name }}</div>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {{ product.price }} {{ t('product_selection.currency') }}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          <button
                            @click="decrementQuantity(product.id)"
                            :disabled="!isProductSelected(product.id) || getProductQuantity(product.id) <= 1"
                            class="w-7 h-7 rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-[#437d63] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#015C3B] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            :value="getProductQuantity(product.id)"
                            @input="(e) => updateQuantity(product.id, e.target.value)"
                            :disabled="!isProductSelected(product.id)"
                            min="1"
                            :max="product.stock > 0 ? product.stock : undefined"
                            class="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md dark:bg-[#437d63] dark:text-white dark:border-white/20 disabled:opacity-50 text-center"
                          />
                          <button
                            @click="incrementQuantity(product.id)"
                            :disabled="!isProductSelected(product.id) || (product.stock > 0 && getProductQuantity(product.id) >= product.stock) || (totalAmount + product.price > contractRemaining)"
                            class="w-7 h-7 rounded bg-green-600 text-white flex items-center justify-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {{ isProductSelected(product.id) ? (product.price * getProductQuantity(product.id)).toFixed(2) : '0.00' }} {{ t('product_selection.currency') }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Empty state -->
              <div v-if="!loading && products.length === 0" class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">{{ t('product_selection.no_products') }}</p>
              </div>

              <!-- Total amount -->
              <div v-if="hasSelectedProducts || contract" class="mt-4 pt-4 border-t border-gray-200 dark:border-white/20 sticky bottom-0 bg-white dark:bg-[#015C3B] pb-2 space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {{ t('product_selection.total_amount') }}:
                  </span>
                  <span class="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    {{ totalAmount.toFixed(2) }} {{ t('product_selection.currency') }}
                  </span>
                </div>
                <div v-if="contract" class="flex justify-between items-center text-sm">
                  <span class="text-gray-600 dark:text-gray-400">
                    {{ t('product_selection.remaining_after') }}:
                  </span>
                  <span :class="remainingAfterPurchase >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-semibold">
                    {{ remainingAfterPurchase.toFixed(2) }} {{ t('product_selection.currency') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-white/20 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0 bg-white dark:bg-[#015C3B]">
              <button
                type="button"
                @click="handleClose"
                class="w-full sm:w-auto px-6 py-3 text-base sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-[#437d63] dark:text-white dark:border-white/20 dark:hover:bg-[#015C3B] touch-manipulation"
              >
                {{ t('product_selection.cancel') }}
              </button>
              <button
                type="button"
                @click="handleConfirm"
                :disabled="!hasSelectedProducts || submitting"
                class="w-full sm:w-auto px-6 py-3 text-base sm:text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                <span v-if="submitting">{{ t('product_selection.submitting') }}</span>
                <span v-else>{{ t('product_selection.confirm') }}</span>
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

