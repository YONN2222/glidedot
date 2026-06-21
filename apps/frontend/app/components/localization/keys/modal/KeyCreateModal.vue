<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'create', keyName: string): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const newKeyName = ref("")

const handleCreate = () => {
  if (newKeyName.value.trim()) {
    emit('create', newKeyName.value.trim())
    newKeyName.value = ""
  }
}
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    title="Add New Key"
    description="Enter the identifier for your new translation key."
  >
    <template #body>
      <div class="p-4">
        <u-form-field label="Key Identifier">
          <u-input
            v-model="newKeyName"
            placeholder="e.g., dashboard.welcome.title"
            autofocus
            class="w-full"
            @keyup.enter="handleCreate"
          />
        </u-form-field>
      </div>
    </template>

    <template #footer>
      <u-button color="neutral" variant="ghost" label="Cancel" @click="isOpen = false"/>
      <u-button label="Add Key" color="neutral" :disabled="!newKeyName.trim()" @click="handleCreate"/>
    </template>
  </u-modal>
</template>
