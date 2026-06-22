<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  isRestoring: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <u-modal v-model:open="isOpen" title="Restore System Backup">
    <template #body>
      <div class="p-4 flex flex-col gap-4">
        <u-alert 
          title="Important" 
          description="It may take a few minutes until all changes are fully loaded and applied. Please do not close the page during this process." 
          color="warning" 
          variant="subtle" 
          icon="i-lucide-clock" 
        />
        <p class="text-sm text-neutral-400">
          Are you sure you want to restore the system backup? This will completely wipe your current database (Projects, Languages, Labels, and Translations) and replace it with the data from the uploaded backup file. This action cannot be undone.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <u-button color="neutral" variant="ghost" label="Cancel" @click="isOpen = false" />
        <u-button label="Yes, Select Backup File" color="error" :loading="isRestoring" @click="emit('confirm')" />
      </div>
    </template>
  </u-modal>
</template>
