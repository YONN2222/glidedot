<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettings } from '~/composables/useSettings'
import { useToast } from '#imports'

const { settings, loadSettings, saveSettings } = useSettings()
const toast = useToast()

const isLoading = ref(false)

const formData = ref({
  primaryColor: 'rose',
  logoType: 'text',
  logoText: 'glide',
  logoTextMinimal: 'g',
  logoShowDot: true,
  logoUrl: '',
  logoUrlMinimal: ''
})

const colors = [
  { name: 'Rose', value: 'rose', bgClass: 'bg-rose-500' },
  { name: 'Blue', value: 'blue', bgClass: 'bg-blue-500' },
  { name: 'Green', value: 'emerald', bgClass: 'bg-emerald-500' },
  { name: 'Purple', value: 'purple', bgClass: 'bg-purple-500' },
  { name: 'Orange', value: 'orange', bgClass: 'bg-orange-500' },
  { name: 'Zinc', value: 'zinc', bgClass: 'bg-zinc-500' }
]

const isCustomColor = computed(() => formData.value.primaryColor.startsWith('#'))
const tempCustomColor = ref('#ffffff')
const hexInputString = ref('#ffffff')

const selectCustomColor = (color: string) => {
  formData.value.primaryColor = color
}

const onColorPickerUpdate = (color: string) => {
  hexInputString.value = color
  selectCustomColor(color)
}

const applyHexInput = () => {
  const val = hexInputString.value
  if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
    tempCustomColor.value = val
    selectCustomColor(val)
  }
}

onMounted(async () => {
  await loadSettings()
  formData.value.primaryColor = settings.value.primaryColor || 'rose'
  if (formData.value.primaryColor.startsWith('#')) {
    tempCustomColor.value = formData.value.primaryColor
    hexInputString.value = formData.value.primaryColor
  }
  formData.value.logoType = settings.value.logoType || 'text'
  formData.value.logoText = settings.value.logoText || 'glide'
  formData.value.logoTextMinimal = settings.value.logoTextMinimal || 'g'
  formData.value.logoShowDot = settings.value.logoShowDot !== 'false' // default true
  formData.value.logoUrl = settings.value.logoUrl || ''
  formData.value.logoUrlMinimal = settings.value.logoUrlMinimal || ''
})

const save = async () => {
  isLoading.value = true
  const success = await saveSettings({
    primaryColor: formData.value.primaryColor,
    logoType: formData.value.logoType,
    logoText: formData.value.logoText,
    logoTextMinimal: formData.value.logoTextMinimal,
    logoShowDot: formData.value.logoShowDot ? 'true' : 'false',
    logoUrl: formData.value.logoUrl,
    logoUrlMinimal: formData.value.logoUrlMinimal
  })
  isLoading.value = false
  if (success) {
    toast.add({ title: 'Settings saved', color: 'success' })
    // Reload page to apply primary color correctly across Nuxt UI if needed
    window.location.reload()
  } else {
    toast.add({ title: 'Failed to save settings', color: 'error' })
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
      <div class="flex flex-col gap-1">
        <h1 class="text-xl font-bold">Whitelabeling Settings</h1>
        <p class="text-sm text-neutral-400">Customize the appearance and branding of your workspace.</p>
      </div>
      <u-button icon="i-lucide-save" label="Save Changes" color="primary" :loading="isLoading" @click="save" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <u-card>
        <template #header>
          <div class="flex items-center gap-2">
            <u-icon name="i-lucide-palette" class="w-5 h-5 text-primary-500" />
            <h3 class="font-medium">Appearance</h3>
          </div>
        </template>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Primary Theme Color</label>
            <p class="text-xs text-neutral-400 mb-4">Select the primary accent color for the entire workspace.</p>
            <div class="flex flex-wrap gap-4">
              <button
                v-for="color in colors"
                :key="color.value"
                class="group flex flex-col items-center gap-3 p-4 rounded-xl border transition-all"
                :class="formData.primaryColor === color.value ? 'border-primary-500 bg-primary-500/10 shadow-md' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800'"
                @click="formData.primaryColor = color.value"
              >
                <div class="w-12 h-12 rounded-full shadow-inner flex items-center justify-center transition-transform group-hover:scale-110" :class="color.bgClass">
                  <u-icon v-if="formData.primaryColor === color.value" name="i-lucide-check" class="text-white w-6 h-6" />
                </div>
                <span class="text-sm font-medium" :class="formData.primaryColor === color.value ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-200'">{{ color.name }}</span>
              </button>

              <u-popover>
                <button
                  class="group flex flex-col items-center gap-3 p-4 rounded-xl border transition-all"
                  :class="isCustomColor ? 'border-primary-500 bg-primary-500/10 shadow-md' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800'"
                >
                  <div 
                    class="w-12 h-12 rounded-full shadow-inner flex items-center justify-center transition-transform group-hover:scale-110" 
                    :class="!isCustomColor && 'bg-gradient-to-br from-red-500 via-green-500 to-blue-500'"
                    :style="isCustomColor ? `background-color: ${formData.primaryColor}` : ''"
                  >
                    <u-icon v-if="isCustomColor" name="i-lucide-check" class="text-white w-6 h-6" />
                  </div>
                  <span class="text-sm font-medium" :class="isCustomColor ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-200'">Custom</span>
                </button>
                <template #content>
                  <div class="p-4 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col gap-3">
                    <u-color-picker v-model="tempCustomColor" @update:model-value="onColorPickerUpdate" />
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-neutral-400 font-medium">HEX:</span>
                      <u-input v-model="hexInputString" size="sm" class="flex-1" placeholder="#FFFFFF" @blur="applyHexInput" @keyup.enter="applyHexInput" />
                    </div>
                  </div>
                </template>
              </u-popover>
            </div>
          </div>
        </div>
      </u-card>

      <u-card>
        <template #header>
          <div class="flex items-center gap-2">
            <u-icon name="i-lucide-image" class="w-5 h-5 text-primary-500" />
            <h3 class="font-medium">Logo & Branding</h3>
          </div>
        </template>
        
        <div class="flex flex-col gap-8">
          <div class="flex items-center justify-between p-4 rounded-lg ring-1 ring-default bg-neutral-800/50">
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium">Use Image Logo</span>
              <span class="text-xs text-neutral-400">Replace the text logo with your own custom image assets.</span>
            </div>
            <u-switch :model-value="formData.logoType === 'image'" @update:model-value="v => formData.logoType = v ? 'image' : 'text'" />
          </div>

          <template v-if="formData.logoType === 'text'">
            <u-form-field label="Expanded Text Logo (e.g. 'glide')" description="Shown when the sidebar is fully expanded.">
              <u-input v-model="formData.logoText" placeholder="glide" />
            </u-form-field>
            
            <u-form-field label="Minimal Text Logo (e.g. 'g')" description="Shown when the sidebar is collapsed.">
              <u-input v-model="formData.logoTextMinimal" placeholder="g" />
            </u-form-field>
            
            <div class="flex items-center justify-between p-4 rounded-lg ring-1 ring-default bg-neutral-800/50">
              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium">Show Colored Dot</span>
                <span class="text-xs text-neutral-400">Appends a primary-colored dot (.) to the end of the text logo.</span>
              </div>
              <u-switch v-model="formData.logoShowDot" />
            </div>
          </template>

          <template v-if="formData.logoType === 'image'">
            <u-form-field label="Expanded Logo" description="URL for the logo shown when sidebar is fully expanded (Supports PNG, WebP, SVG).">
              <u-input v-model="formData.logoUrl" size="lg" class="w-full" icon="i-lucide-link" placeholder="https://example.com/logo.svg" />
            </u-form-field>
            
            <u-form-field label="Minimal Logo" description="URL for the logo shown when sidebar is collapsed (e.g., an icon).">
              <u-input v-model="formData.logoUrlMinimal" size="lg" class="w-full" icon="i-lucide-link" placeholder="https://example.com/icon.svg" />
            </u-form-field>
          </template>
        </div>
      </u-card>
    </div>
  </div>
</template>
