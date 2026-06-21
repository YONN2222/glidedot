import { ref } from 'vue'
import { useApi } from './useApi'

const globalSettings = ref<Record<string, string>>({})
const isLoading = ref(false)

export function useSettings() {
  const { fetchApi } = useApi()

  const loadSettings = async () => {
    if (isLoading.value || Object.keys(globalSettings.value).length > 0) return
    isLoading.value = true
    try {
      const data = await fetchApi('/admin/settings') as Record<string, string>
      globalSettings.value = data
    } catch (e) {
      console.error('Failed to load settings', e)
    } finally {
      isLoading.value = false
    }
  }

  const saveSettings = async (settingsToSave: Record<string, string>) => {
    try {
      await fetchApi('/admin/settings', {
        method: 'POST',
        body: settingsToSave
      })
      // Update local state
      globalSettings.value = { ...globalSettings.value, ...settingsToSave }
      return true
    } catch (e) {
      console.error('Failed to save settings', e)
      return false
    }
  }

  return {
    settings: globalSettings,
    loadSettings,
    saveSettings
  }
}
