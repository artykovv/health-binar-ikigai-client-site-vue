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
        <div v-if="loading" class="my-4 text-center">
          <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-600 dark:border-t-white"></span>
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
</style>


