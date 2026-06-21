<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useShortcuts } from '~/composables/useShortcuts'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'

definePageMeta({
  layout: 'default'
})

const appConfig = useAppConfig()
const toast = useToast()
const { shortcuts, loadShortcuts, saveShortcuts, formatShortcut, defaultShortcuts } = useShortcuts()
const { user } = useAuth()
const { fetchApi } = useApi()

const saveProfileSettings = async (val: boolean) => {
  if (!user.value) return
  try {
    await fetchApi('/users/me', {
      method: 'PATCH',
      body: { enableSuggestions: val }
    })
    user.value.enableSuggestions = val
    toast.add({ title: 'Profile settings updated', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to update profile', color: 'error' })
  }
}

const isSuggestionsEnabled = computed({
  get: () => user.value?.enableSuggestions ?? true,
  set: (val: boolean) => saveProfileSettings(val)
})

const colors = [
  { name: 'Rose', value: 'rose', bgClass: 'bg-rose-500' },
  { name: 'Blue', value: 'blue', bgClass: 'bg-blue-500' },
  { name: 'Green', value: 'emerald', bgClass: 'bg-emerald-500' },
  { name: 'Purple', value: 'purple', bgClass: 'bg-purple-500' },
  { name: 'Orange', value: 'orange', bgClass: 'bg-orange-500' },
  { name: 'Zinc', value: 'zinc', bgClass: 'bg-zinc-500' }
]

const selectedColor = ref(appConfig.ui.colors.primary)
const isCustomColor = computed(() => selectedColor.value.startsWith('#'))
const tempCustomColor = ref('#ffffff')
const hexInputString = ref('#ffffff')

const enableShortcuts = ref(true)

const selectColor = (colorValue: string) => {
  selectedColor.value = colorValue
  appConfig.ui.colors.primary = colorValue
  localStorage.setItem('glide_primary_color', colorValue)
  toast.add({ title: 'Theme updated successfully', color: 'success' })
}

const onColorPickerUpdate = (val: string) => {
  hexInputString.value = val
  selectColor(val)
}

const applyHexInput = () => {
  const val = hexInputString.value
  if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
    tempCustomColor.value = val
    selectColor(val)
  }
}

const saveSettings = () => {
  localStorage.setItem('glide_enable_shortcuts', enableShortcuts.value ? 'true' : 'false')
  toast.add({ title: 'Settings saved', color: 'success' })
}

const recordingShortcut = ref<keyof typeof shortcuts.value | null>(null)

const startRecording = (name: keyof typeof shortcuts.value) => {
  recordingShortcut.value = name
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!recordingShortcut.value) return
  
  e.preventDefault()
  if (['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) return
  
  shortcuts.value[recordingShortcut.value] = {
    key: e.key,
    metaKey: e.metaKey,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey,
    altKey: e.altKey
  }
  
  saveShortcuts()
  recordingShortcut.value = null
  toast.add({ title: 'Shortcut updated', color: 'success' })
}

const resetShortcut = (name: keyof typeof shortcuts.value) => {
  shortcuts.value[name] = JSON.parse(JSON.stringify(defaultShortcuts[name]))
  saveShortcuts()
  toast.add({ title: 'Shortcut reset', color: 'success' })
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  loadShortcuts()
  const savedColor = localStorage.getItem('glide_primary_color')
  if (savedColor) {
    selectedColor.value = savedColor
    appConfig.ui.colors.primary = savedColor
    if (savedColor.startsWith('#')) {
      tempCustomColor.value = savedColor
      hexInputString.value = savedColor
    }
  }
  
  const savedShortcuts = localStorage.getItem('glide_enable_shortcuts')
  if (savedShortcuts) enableShortcuts.value = savedShortcuts === 'true'
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="flex flex-col gap-6 max-w-4xl mx-auto py-8">
    <div>
      <h1 class="text-2xl font-bold">Settings</h1>
      <p class="text-sm text-neutral-400 mt-1">Customize the application and your personal workflow.</p>
    </div>

    <u-card :ui="{ body: { padding: 'p-6 sm:p-8' } }">
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-semibold text-neutral-200">Primary Color</h2>
          <p class="text-sm text-neutral-400 mt-1">Select the primary accent color for the entire application.</p>
        </div>

        <div class="flex gap-4 flex-wrap">
          <button
            v-for="color in colors"
            :key="color.value"
            class="group flex flex-col items-center gap-3 p-4 rounded-xl border transition-all"
            :class="selectedColor === color.value ? 'border-primary-500 bg-primary-500/10 shadow-md' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800'"
            @click="selectColor(color.value)"
          >
            <div class="w-12 h-12 rounded-full shadow-inner flex items-center justify-center transition-transform group-hover:scale-110" :class="color.bgClass">
              <u-icon v-if="selectedColor === color.value" name="i-lucide-check" class="text-white w-6 h-6" />
            </div>
            <span class="text-sm font-medium" :class="selectedColor === color.value ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-200'">{{ color.name }}</span>
          </button>

          <u-popover>
            <button
              class="group flex flex-col items-center gap-3 p-4 rounded-xl border transition-all"
              :class="isCustomColor ? 'border-primary-500 bg-primary-500/10 shadow-md' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800'"
            >
              <div 
                class="w-12 h-12 rounded-full shadow-inner flex items-center justify-center transition-transform group-hover:scale-110" 
                :class="!isCustomColor && 'bg-gradient-to-br from-red-500 via-green-500 to-blue-500'"
                :style="isCustomColor ? `background-color: ${selectedColor}` : ''"
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
    </u-card>

    <u-card :ui="{ body: { padding: 'p-6 sm:p-8' } }">
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-semibold text-neutral-200">Translation Preferences</h2>
          <p class="text-sm text-neutral-400 mt-1">Configure your default translation workflow.</p>
          <u-badge v-if="user?.allowSuggestions === false" color="error" variant="subtle" class="mt-2">
            AI suggestions have been disabled by your administrator.
          </u-badge>
        </div>

        <div class="flex flex-row justify-between items-start" :class="user?.allowSuggestions === false && 'opacity-50 pointer-events-none'">
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-neutral-200">Translation Suggestions</h2>
            <p class="text-sm text-neutral-40">Enable AI-powered translation suggestions while editing.</p>
            <div class="flex flex-row items-center space-x-4">
              <div class="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md">
                <span class="text-xs font-medium text-neutral-400">
                  Provider: <strong class="text-neutral-200">{{ user?.hasDeepL ? 'DeepL' : 'Google Translate' }}</strong>
                </span>
              </div>
              <u-switch
                  v-model="isSuggestionsEnabled"
              />
            </div>
          </div>
        </div>
      </div>
    </u-card>

    <u-card class="hidden md:block" :ui="{ body: { padding: 'p-6 sm:p-8' } }">
      <div class="space-y-6">
        <div class="flex flex-row justify-between items-start">
          <div>
            <h2 class="text-lg font-semibold text-neutral-200">Keyboard Shortcuts</h2>
            <p class="text-sm text-neutral-400 mt-1">Enable power-user shortcuts for translating.</p>
          </div>
          <u-toggle v-model="enableShortcuts" @change="saveSettings" />
        </div>

        <div class="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden transition-opacity" :class="!enableShortcuts && 'opacity-50 pointer-events-none'">
          <div class="grid grid-cols-2 gap-px bg-neutral-800">
            <div v-for="(label, key) in { saveNext: 'Save & Next', next: 'Next Translation', prev: 'Previous Translation', approve: 'Approve Suggestion', close: 'Close Window' }" :key="key" class="bg-neutral-900 p-4 flex items-center justify-between group">
              <span class="text-sm font-medium text-neutral-300">{{ label }}</span>
              <div class="flex items-center gap-4">
                <button v-if="recordingShortcut !== key" class="opacity-0 group-hover:opacity-100 text-xs text-neutral-500 hover:text-neutral-300 transition-opacity" @click="resetShortcut(key as string)">Reset</button>
                <button class="flex gap-1 hover:ring-2 ring-primary-500 rounded p-1 transition-all outline-none" :class="recordingShortcut === key && 'ring-2 ring-primary-500 bg-primary-500/20'" @click="startRecording(key as string)">
                  <span v-if="recordingShortcut === key" class="text-xs text-primary-500 font-medium px-2 py-1 animate-pulse">Press any key...</span>
                  <kbd v-for="k in formatShortcut(shortcuts[key as keyof typeof shortcuts])" v-else :key="k" class="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-xs font-mono">{{ k }}</kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </u-card>
  </div>
</template>
