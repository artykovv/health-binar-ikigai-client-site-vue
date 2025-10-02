<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { http } from '@/api/http'
import { loadMe } from '@/utils/authStorage'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const structure = ref(null)
const loading = ref(false)
const error = ref('')

const myId = (() => { try { return loadMe()?.id || '' } catch (_) { return '' } })()
const participantId = ref(route.params.id || myId)

async function fetchStructure(id) {
  if (!id) {
    structure.value = null
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data = await http(`/api/structure/${id}`)
    structure.value = data
  } catch (e) {
    error.value = t('common_error') || 'Error'
  } finally {
    loading.value = false
  }
}

function hasAnyChild(node) { return !!(node?.left_child || node?.right_child) }
function nodeStyle(node) { const style = {}; if (node && node.color) style.background = `linear-gradient(${node.color})`; return style }
function goTo(id) { if (!id) return; router.push({ name: 'structure', params: { locale: route.params.locale, id } }) }

onMounted(() => {
  if (!route.params.id && myId) {
    return router.replace({ name: 'structure', params: { locale: route.params.locale, id: myId } })
  }
  fetchStructure(participantId.value)
})
watch(() => route.params.id, (newId) => { participantId.value = newId || myId; fetchStructure(participantId.value) })
</script>

<template>
  <div>
    <div>
      <div>
        <div v-if="loading" class="flex items-center justify-center min-h-[200px] my-4">
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
        <div v-else-if="error" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 my-3 dark:bg-[#3f3f47] dark:border-gray-700 dark:text-white">{{ error }}</div>
        <div v-else>
          <div class="mt-5 mb-5 overflow-x-auto">
            <div class="tree inline-block min-w-max">
            <div v-if="structure" class="node">
              <div @click="goTo(structure.participant_id)" class="node-content" :style="nodeStyle(structure)">
                <h6 class="leading-tight">
                  <span class="block">{{ structure.participant_lastname }}</span>
                  <span class="block">{{ structure.participant_name }}</span>
                  <span class="block">{{ structure.participant_patronymic }}</span>
                </h6>
                <button class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-800 text-xs hover:bg-gray-200 mt-1 dark:bg-[#3f3f47] dark:text-white dark:hover:bg-[#4a4a52]">{{ structure.participant_personal_number }}</button>
              </div>
              <div class="branch" v-if="hasAnyChild(structure)">
                <div class="node">
                  <div v-if="structure.left_child" @click="goTo(structure.left_child.participant_id)" class="node-content" :style="nodeStyle(structure.left_child)">
                    <h6 class="leading-tight">
                      <span class="block">{{ structure.left_child.participant_lastname }}</span>
                      <span class="block">{{ structure.left_child.participant_name }}</span>
                      <span class="block">{{ structure.left_child.participant_patronymic }}</span>
                    </h6>
                    <button class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-800 text-xs hover:bg-gray-200 mt-1 dark:bg-[#3f3f47] dark:text-white dark:hover:bg-[#4a4a52]">{{ structure.left_child.participant_personal_number }}</button>
                  </div>
                  <div v-else class="node invisible"></div>
                  <div class="branch" v-if="structure.left_child && hasAnyChild(structure.left_child)">
                    <div class="node">
                      <div v-if="structure.left_child.left_child" @click="goTo(structure.left_child.left_child.participant_id)" class="node-content" :style="nodeStyle(structure.left_child.left_child)">
                        <h6 class="leading-tight">
                          <span class="block">{{ structure.left_child.left_child.participant_lastname }}</span>
                          <span class="block">{{ structure.left_child.left_child.participant_name }}</span>
                          <span class="block">{{ structure.left_child.left_child.participant_patronymic }}</span>
                        </h6>
                        <button class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-800 text-xs hover:bg-gray-200 mt-1 dark:bg-[#3f3f47] dark:text-white dark:hover:bg-[#4a4a52]">{{ structure.left_child.left_child.participant_personal_number }}</button>
                      </div>
                      <div v-else class="node invisible"></div>
                    </div>
                    <div class="node">
                      <div v-if="structure.left_child.right_child" @click="goTo(structure.left_child.right_child.participant_id)" class="node-content" :style="nodeStyle(structure.left_child.right_child)">
                        <h6 class="leading-tight">
                          <span class="block">{{ structure.left_child.right_child.participant_lastname }}</span>
                          <span class="block">{{ structure.left_child.right_child.participant_name }}</span>
                          <span class="block">{{ structure.left_child.right_child.participant_patronymic }}</span>
                        </h6>
                        <button class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-800 text-xs hover:bg-gray-200 mt-1 dark:bg-[#3f3f47] dark:text-white dark:hover:bg-[#4a4a52]">{{ structure.left_child.right_child.participant_personal_number }}</button>
                      </div>
                      <div v-else class="node invisible"></div>
                    </div>
                  </div>
                </div>

                <div class="node">
                  <div v-if="structure.right_child" @click="goTo(structure.right_child.participant_id)" class="node-content" :style="nodeStyle(structure.right_child)">
                    <h6 class="leading-tight">
                      <span class="block">{{ structure.right_child.participant_lastname }}</span>
                      <span class="block">{{ structure.right_child.participant_name }}</span>
                      <span class="block">{{ structure.right_child.participant_patronymic }}</span>
                    </h6>
                    <button class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-800 text-xs hover:bg-gray-200 mt-1 dark:bg-[#3f3f47] dark:text-white dark:hover:bg-[#4a4a52]">{{ structure.right_child.participant_personal_number }}</button>
                  </div>
                  <div v-else class="node invisible"></div>
                  <div class="branch" v-if="structure.right_child && hasAnyChild(structure.right_child)">
                    <div class="node">
                      <div v-if="structure.right_child.left_child" @click="goTo(structure.right_child.left_child.participant_id)" class="node-content" :style="nodeStyle(structure.right_child.left_child)">
                        <h6 class="leading-tight">
                          <span class="block">{{ structure.right_child.left_child.participant_lastname }}</span>
                          <span class="block">{{ structure.right_child.left_child.participant_name }}</span>
                          <span class="block">{{ structure.right_child.left_child.participant_patronymic }}</span>
                        </h6>
                        <button class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-800 text-xs hover:bg-gray-200 mt-1 dark:bg-[#3f3f47] dark:text-white dark:hover:bg-[#4a4a52]">{{ structure.right_child.left_child.participant_personal_number }}</button>
                      </div>
                      <div v-else class="node invisible"></div>
                    </div>
                    <div class="node">
                      <div v-if="structure.right_child.right_child" @click="goTo(structure.right_child.right_child.participant_id)" class="node-content" :style="nodeStyle(structure.right_child.right_child)">
                        <h6 class="leading-tight">
                          <span class="block">{{ structure.right_child.right_child.participant_lastname }}</span>
                          <span class="block">{{ structure.right_child.right_child.participant_name }}</span>
                          <span class="block">{{ structure.right_child.right_child.participant_patronymic }}</span>
                        </h6>
                        <button class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-800 text-xs hover:bg-gray-200 mt-1 dark:bg-[#3f3f47] dark:text-white dark:hover:bg-[#4a4a52]">{{ structure.right_child.right_child.participant_personal_number }}</button>
                      </div>
                      <div v-else class="node invisible"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500">Нет данных</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
  .tree .branch {
    padding-top: 20px;
    position: relative;
    transition: all 0.5s;
  }
  .tree .node {
    display: inline-block;
    text-align: center;
    position: relative;
    padding: 20px 5px 0 5px;
    transition: all 0.5s;
  }
  .tree .node::before, .tree .node::after {
    content: '';
    position: absolute;
    top: 0;
    right: 50%;
    border-top: 1px solid #ccc;
    width: 50%;
    height: 20px;
  }
  .tree .node::after { right: auto; left: 50%; border-left: 1px solid #ccc; }
  .tree .node:only-child::after, .tree .node:only-child::before { display: none; }
  .tree .node:only-child { padding-top: 0; }
  .tree .node:first-child::before, .tree .node:last-child::after { border: 0 none; }
  .tree .node:last-child::before { border-right: 1px solid #ccc; border-radius: 0 5px 0 0; }
  .tree .node:first-child::after { border-radius: 5px 0 0 0; }
  .tree .branch::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 1px solid #ccc; width: 0; height: 20px; }
  .tree .node-content {
    text-decoration: none; color: #000000; font-family: arial, verdana, tahoma; font-size: 11px; display: inline-block; border-radius: 5px; transition: all 0.5s; cursor: pointer; border: 1px solid #000000; background-color: #ffffff; padding: 12px 16px;
  }
  .tree .node-content:hover { background: #ffffff; color: #000; }
  .node.invisible { visibility: hidden; }
  .tree .branch { display: flex; justify-content: center; }
  :root.dark .tree .node-content { color: #ffffff; background-color: #3f3f47; border-color: #4a4a52; }
  :root.dark .tree .node-content:hover { background-color: #4a4a52; color: #ffffff; }
  
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


