<script setup lang="ts">
import { useTranslation } from '~/composables/localization/useTranslation'

import TranslationActivityModal from '../../../../../components/localization/translations/modal/TranslationActivityModal.vue'
import TranslationListModal from '../../../../../components/localization/translations/modal/TranslationListModal.vue'
import TranslationLanguageCard from "../../../../../components/localization/translations/TranslationLanguageCard.vue";
import TranslationSidebar from "../../../../../components/localization/translations/TranslationSidebar.vue";
import type { Language } from '@glidedot/types'

const {
  init,
  languages,
  sourceLanguage,
  visibleScopes,
  selectedScope,
  getLanguageProgress,
} = useTranslation()

const isListModalOpen = ref(false)
const listModalLanguage = ref<Language | null>(null)

const openListModal = (lang: Language) => {
  listModalLanguage.value = lang
  isListModalOpen.value = true
}

const sortedLanguages = computed(() => {
  if (!languages.value) return []
  return [...languages.value].sort((a, b) => {
    if (a.code === sourceLanguage.value?.code) return -1
    if (b.code === sourceLanguage.value?.code) return 1
    return a.name.localeCompare(b.name)
  })
})

onMounted(() => {
  init()
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="flex flex-col gap-6 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col gap-1 mb-2">
      <h1 class="text-xl font-semibold">Translations</h1>
      <p class="text-sm text-neutral-400">Select a scope and choose a language to start translating.</p>
    </div>

    <!-- Main Content -->
    <div class="flex flex-col md:flex-row gap-6 items-start">

      <!-- Sidebar -->
      <translation-sidebar
          class="hidden md:block"
          v-model:selected-scope="selectedScope"
          :visible-scopes="visibleScopes"
      />

      <!-- Languages Grid -->
      <div class="flex flex-col w-full min-w-0">
        <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          <translation-language-card
              v-for="lang in sortedLanguages"
              :key="lang.code"
              :lang="lang"
              :is-ref="lang.code === sourceLanguage?.code"
              :progress="getLanguageProgress(lang.code)"
              @edit-list="openListModal"
          />
        </div>
      </div>
    </div>

    <!-- Teleport Flashcard Modal to body so it overlays everything smoothly -->
    <teleport to="body">
      <translation-activity-modal/>
    </teleport>

    <translation-list-modal v-model="isListModalOpen" :lang="listModalLanguage" />
  </div>
</template>
