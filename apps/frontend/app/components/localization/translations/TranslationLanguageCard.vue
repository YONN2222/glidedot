<script setup lang="ts">
import type { Language } from "~/types";
import StatusBadge from "~/components/StatusBadge.vue";
import { useTranslation } from '~/composables/localization/useTranslation'

const props = defineProps<{
  lang: Language,
  isRef: boolean,
}>()

const progress = defineModel<{
  count: number
  liveCount?: number
  pendingCount?: number
  total: number
  percentage: number
}>('progress', { required: true })

const emit = defineEmits<{
  (e: 'editList', lang: Language): void
}>()

const { openTranslationMode } = useTranslation()
</script>

<template>
  <div class="flex flex-col border border-default rounded-lg">
    <!-- Header -->
    <div class="flex flex-row p-4 space-x-2">
      <!-- Flag -->
      <div class="flex flex-col justify-center items-center bg-neutral-800/50 rounded-lg w-12 h-12">
        <span class="text-3xl">
          {{ lang.flag }}
        </span>
      </div>

      <!-- Language Name+Code -->
      <div class="flex flex-col justify-center items-start">
        <div class="flex flex-row justify-center items-center space-x-2">
          <h2 class="font-semibold">{{ lang.name }}</h2>
          <u-badge v-if="props.isRef" variant="subtle" color="primary" size="sm">Reference</u-badge>
        </div>
        <p class="text-sm text-muted">Locale: {{ lang.code }}</p>
      </div>
    </div>

    <u-separator/>

    <!-- Body -->
    <div class="flex flex-col p-4 space-y-8">

      <!-- Progress Bar -->
      <div class="flex flex-col space-y-4">
        <div class="flex flex-row justify-between">
          <p class="text-sm text-muted font-semibold">Translation Progress</p>
          <p v-if="progress.percentage < 100" class="text-sm font-semibold">{{ progress.percentage }}%</p>
          <p v-else class="text-sm font-semibold text-success">{{ progress.percentage }}%</p>
        </div>
        
        <div class="flex w-full h-2 bg-neutral-800/50 rounded-full overflow-hidden shadow-inner">
          <div 
            class="h-full transition-all duration-300" 
            :class="progress.percentage === 100 && (progress.pendingCount || 0) === 0 ? 'bg-success-500' : 'bg-primary-500'"
            :style="{ width: `${((progress.liveCount || 0) / (progress.total || 1)) * 100}%` }"/>
          <div class="bg-warning-500 h-full transition-all duration-300 relative" 
               :style="{ width: `${((progress.pendingCount || 0) / (progress.total || 1)) * 100}%` }">
            <!-- Add a subtle striped effect to pending -->
            <div class="absolute inset-0 bg-black/10" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 8px);"/>
          </div>
        </div>

        <div class="flex flex-row gap-2">
          <status-badge :color="progress.percentage === 100 && (progress.pendingCount || 0) === 0 ? 'success' : 'primary'" size="sm">{{ progress.liveCount || 0 }} Live</status-badge>
          <status-badge v-if="(progress.pendingCount || 0) > 0" color="warning" size="sm">{{ progress.pendingCount }} Pending</status-badge>
          <div class="flex-grow"/>
          <status-badge color="neutral" size="sm">{{ progress.total - progress.count }} Missing</status-badge>
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex flex-row space-x-2">
        <u-button
            variant="subtle"
            color="neutral"
            size="md"
            icon="i-lucide-square-pen"
            class="w-full justify-center"
            @click="emit('editList', lang)"
        >
          Edit Translations
        </u-button>
        <u-button
            color="neutral"
            size="md"
            icon="i-lucide-play"
            :disabled="progress.percentage === 100 || progress.total === 0"
            class="w-full justify-center"
            @click="openTranslationMode(lang)"
        >
          Continue
        </u-button>
      </div>
    </div>
  </div>
</template>