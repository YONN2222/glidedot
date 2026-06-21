<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '@glidedot/types'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  project: Partial<Project>
  languages: { id: number; code: string; name: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save'): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <u-modal v-model:open="isOpen" :title="mode === 'create' ? 'Create Project' : 'Edit Project'">
    <template #body>
      <div class="p-4 flex flex-col gap-4">
        <u-form-field label="Project Name" required>
          <u-input v-model="project.name" placeholder="e.g. Mobile App" class="w-full" autofocus @keyup.enter="emit('save')" />
        </u-form-field>

        <u-form-field v-if="mode === 'edit'" label="Source Language (Optional)">
          <u-select
            v-model="project.sourceLanguageId"
            :items="languages.map(l => ({ label: l.name, value: l.id }))"
            placeholder="Select source language"
            class="w-full"
          />
        </u-form-field>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <u-button color="neutral" variant="ghost" label="Cancel" @click="isOpen = false" />
        <u-button :label="mode === 'create' ? 'Create Project' : 'Save Changes'" color="neutral" :disabled="!project.name?.trim()" @click="emit('save')" />
      </div>
    </template>
  </u-modal>
</template>
