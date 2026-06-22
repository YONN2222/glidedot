<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import KeysSettings from '~/components/localization/structure/KeysSettings.vue'
import LanguagesSettings from '~/components/localization/structure/LanguagesSettings.vue'
import LabelsSettings from '~/components/localization/structure/LabelsSettings.vue'

const route = useRoute()
const projectId = parseInt(route.params.id as string)

const items = [{
  label: 'Translation Keys',
  icon: 'i-lucide-logs',
  slot: 'keys'
}, {
  label: 'Labels',
  icon: 'i-lucide-tag',
  slot: 'labels'
}, {
  label: 'Languages',
  icon: 'i-lucide-flag',
  slot: 'languages'
}]
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col md:flex-row justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold">Structure</h1>
        <p class="text-sm text-neutral-400">Manage the core architecture of your translations.</p>
      </div>
    </div>
    
    <u-tabs 
      :items="items" 
      :default-index="0" 
      class="mt-4 w-full"
      :ui="{ list: { background: 'bg-neutral-900 border border-neutral-800', width: 'w-fit', height: 'h-10', tab: { height: 'h-8', size: 'text-sm' } } }"
    >
      <template #keys="{ item }">
        <div class="py-2">
          <keys-settings />
        </div>
      </template>
      <template #labels="{ item }">
        <div class="py-2">
          <labels-settings />
        </div>
      </template>
      <template #languages="{ item }">
        <div class="py-2">
          <languages-settings />
        </div>
      </template>
    </u-tabs>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
