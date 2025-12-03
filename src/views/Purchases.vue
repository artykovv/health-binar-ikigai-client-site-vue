<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { http } from '@/api/http'
import { loadMe } from '@/utils/authStorage'
import OrderItemsModal from '@/components/OrderItemsModal.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

// Определяем активный раздел из URL (query параметр section)
const activeSection = ref(route.query.section || 'contract')

// Стиль для активной кнопки (как в Bonuses.vue)
const activeBtnStyle = { backgroundColor: '#015C3B', color: '#fff', borderRadius: '9999px', padding: '4px 12px' }

// Данные для заказов
const contractOrders = ref([])
const loadingOrders = ref(false)
const ordersError = ref('')

// Модальное окно для товаров заказа
const isOrderModalOpen = ref(false)
const selectedOrderId = ref(null)

// Функция переключения раздела
function switchSection(section) {
  activeSection.value = section
  // Обновляем URL с сохранением других параметров
  router.push({
    name: 'purchases',
    params: { locale: locale.value },
    query: { ...route.query, section: section }
  })
  
  // Загружаем данные при переключении на контракт
  if (section === 'contract') {
    loadContractOrders()
  }
}

// Загрузка заказов по контракту
async function loadContractOrders() {
  const me = loadMe()
  const participantId = me?.id
  if (!participantId) {
    ordersError.value = t('purchases.no_participant')
    return
  }
  
  loadingOrders.value = true
  ordersError.value = ''
  try {
    const data = await http(`/api/contracts/usages/${participantId}/contract-usage`)
    contractOrders.value = data || []
  } catch (e) {
    ordersError.value = e?.message || t('purchases.load_error')
    contractOrders.value = []
  } finally {
    loadingOrders.value = false
  }
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

function getStatusText(status) {
  const statusMap = {
    'paid': t('purchases.status_paid'),
    'partially_paid': t('purchases.status_partially_paid'),
    'pending': t('purchases.status_pending'),
    'cancelled': t('purchases.status_cancelled')
  }
  return statusMap[status] || status
}

function getStatusClass(status) {
  const classMap = {
    'paid': 'text-green-300',
    'partially_paid': 'text-yellow-300',
    'pending': 'text-blue-300',
    'cancelled': 'text-red-300'
  }
  return classMap[status] || 'text-gray-300'
}

function openOrderModal(orderId) {
  selectedOrderId.value = orderId
  isOrderModalOpen.value = true
}

function closeOrderModal() {
  isOrderModalOpen.value = false
  selectedOrderId.value = null
}

// Синхронизируем с URL при изменении route
watch(() => route.query.section, (newSection) => {
  if (newSection && (newSection === 'contract' || newSection === 'health_day')) {
    activeSection.value = newSection
    if (newSection === 'contract') {
      loadContractOrders()
    }
  }
})

onMounted(() => {
  // Если в URL нет section, устанавливаем по умолчанию
  if (!route.query.section) {
    switchSection('contract')
  } else if (route.query.section === 'contract') {
    loadContractOrders()
  }
})
</script>

<template>
  <div class="py-6">
    <h1 class="text-2xl font-semibold">{{ t('purchases.title') }}</h1>

    <div class="flex gap-4 mt-3 flex-wrap">
      <button :style="activeSection === 'contract' ? activeBtnStyle : null" @click="switchSection('contract')">{{ t('purchases.contract') }}</button>
      <button :style="activeSection === 'health_day' ? activeBtnStyle : null" @click="switchSection('health_day')">{{ t('purchases.health_day') }}</button>
    </div>

    <div class="mt-4 space-y-2">
      <!-- Контент раздела Контракт -->
      <template v-if="activeSection === 'contract'">
        <!-- Loading state -->
        <div v-if="loadingOrders" class="flex items-center justify-center min-h-[200px]">
          <div class="text-gray-500 dark:text-gray-400">{{ t('purchases.loading') }}</div>
        </div>

        <!-- Error state -->
        <div v-else-if="ordersError" class="text-sm text-red-600 dark:text-red-400">{{ ordersError }}</div>

        <!-- Orders list -->
        <div v-else-if="contractOrders.length > 0">
          <div 
            v-for="usage in contractOrders" 
            :key="usage.id" 
            @click="usage.order_id && openOrderModal(usage.order_id)"
            class="rounded-2xl p-4 shadow bg-[#015C3B] text-white mb-2 cursor-pointer hover:bg-[#014a2f] transition-colors"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm opacity-80">{{ t('purchases.order_id') }}: {{ usage.order_id }}</div>
              <div class="text-xs opacity-80">{{ formatDate(usage.created_at) }}</div>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div class="text-xs opacity-80">{{ t('purchases.total_amount') }}</div>
                <div class="text-base font-medium">{{ usage.order?.total_amount || 0 }} {{ t('product_selection.currency') }}</div>
              </div>
              <div>
                <div class="text-xs opacity-80">{{ t('purchases.amount_used') }}</div>
                <div class="text-base font-medium">{{ usage.amount_used }} {{ t('product_selection.currency') }}</div>
              </div>
            </div>
            <div class="mt-2">
              <div class="text-xs opacity-80">{{ t('purchases.status') }}</div>
              <div :class="getStatusClass(usage.order?.status)" class="text-sm font-medium">
                {{ getStatusText(usage.order?.status) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="text-sm text-gray-500 dark:text-gray-400">{{ t('purchases.no_orders') }}</div>
      </template>

      <!-- Контент раздела Health Day -->
      <template v-else-if="activeSection === 'health_day'">
        <div class="rounded-2xl p-5 shadow bg-white text-black dark:bg-[#015C3B] dark:text-white">
          <h2 class="text-lg font-semibold mb-4">{{ t('purchases.health_day') }}</h2>
          <p class="text-gray-600 dark:text-gray-300">{{ t('purchases.health_day_content') }}</p>
        </div>
      </template>
    </div>

    <!-- Order Items Modal -->
    <OrderItemsModal
      :is-open="isOrderModalOpen"
      :order-id="selectedOrderId"
      @close="closeOrderModal"
    />
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>

