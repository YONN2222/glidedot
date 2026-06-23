<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const { fetchApi } = useApi()
const toast = useToast()
const { settings, saveSettings } = useSettings()

const s3BackupEnabled = computed({
  get: () => settings.value.s3BackupEnabled === 'true',
  set: async (val) => {
    settings.value.s3BackupEnabled = String(val)
    const success = await saveSettings({ s3BackupEnabled: String(val) })
    if (success) {
      toast.add({ title: val ? 'S3 Backups enabled' : 'S3 Backups disabled', color: 'success' })
    }
  }
})

const projects = ref<{ id: number; name: string }[]>([])
const languages = ref<{ id: number; code: string; name: string }[]>([])
const selectedProjectId = ref<number | null>(null)
const selectedLanguageId = ref<number | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)
const isExporting = ref(false)
const importAsPending = ref(false)

const conventionsFileInput = ref<HTMLInputElement | null>(null)
const isImportingConventions = ref(false)
const isExportingConventions = ref(false)

const backupFileInput = ref<HTMLInputElement | null>(null)
const isBackingUp = ref(false)
const isRestoring = ref(false)
const isRestoreModalOpen = ref(false)
const pendingRestoreFile = ref<File | null>(null)
const isTriggeringS3 = ref(false)

const loadProjects = async () => {
  try {
    const projs = await fetchApi('/localization/projects')
    projects.value = projs as { id: number; name: string }[]
  } catch {
    toast.add({ title: 'Failed to load projects', color: 'error' })
  }
}

const loadLanguages = async () => {
  if (!selectedProjectId.value) {
    languages.value = []
    return
  }
  try {
    const langs = await fetchApi(`/localization/projects/${selectedProjectId.value}/languages`)
    languages.value = langs as { id: number; code: string; name: string }[]
  } catch {
    toast.add({ title: 'Failed to load languages', color: 'error' })
  }
}

watch(selectedProjectId, () => {
  selectedLanguageId.value = null
  loadLanguages()
})

onMounted(() => {
  loadProjects()
})

const exportData = async () => {
  if (!selectedProjectId.value || !selectedLanguageId.value) return
  isExporting.value = true
  try {
    const data = await fetchApi(`/localization/projects/${selectedProjectId.value}/languages/${selectedLanguageId.value}/export`)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const project = projects.value.find(p => p.id === selectedProjectId.value)
    const language = languages.value.find(l => l.id === selectedLanguageId.value)
    a.download = `glde_${project?.name?.toLowerCase() || selectedProjectId.value}_${language?.code?.toLowerCase() || selectedLanguageId.value}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.add({ title: 'Export successful', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to export', color: 'error' })
  } finally {
    isExporting.value = false
  }
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!selectedProjectId.value || !selectedLanguageId.value) {
    toast.add({ title: 'Please select project and language first', color: 'error' })
    return
  }

  isImporting.value = true
  try {
    const text = await file.text()
    const jsonData = JSON.parse(text)
    
    const result = await fetchApi(`/localization/projects/${selectedProjectId.value}/languages/${selectedLanguageId.value}/import`, {
      method: 'POST',
      body: { data: jsonData, importAsPending: importAsPending.value }
    })

    toast.add({ title: `Import successful (${result.imported} keys imported)`, color: 'success' })
  } catch (e) {
    console.error(e)
    toast.add({ title: 'Failed to parse or import JSON', color: 'error' })
  } finally {
    isImporting.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const exportConventions = async () => {
  if (!selectedProjectId.value) return
  isExportingConventions.value = true
  try {
    const data = await fetchApi(`/localization/projects/${selectedProjectId.value}/conventions/export`)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const project = projects.value.find(p => p.id === selectedProjectId.value)
    a.download = `glide_conventions_${project?.name?.toLowerCase() || selectedProjectId.value}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.add({ title: 'Export successful', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to export conventions', color: 'error' })
  } finally {
    isExportingConventions.value = false
  }
}

const handleConventionsFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!selectedProjectId.value) {
    toast.add({ title: 'Please select a project first', color: 'error' })
    return
  }

  isImportingConventions.value = true
  try {
    const text = await file.text()
    const jsonData = JSON.parse(text)
    
    await fetchApi(`/localization/projects/${selectedProjectId.value}/conventions/import`, {
      method: 'POST',
      body: jsonData
    })

    toast.add({ title: 'Conventions imported successfully', color: 'success' })
  } catch (e) {
    console.error(e)
    toast.add({ title: 'Failed to parse or import JSON', color: 'error' })
  } finally {
    isImportingConventions.value = false
    if (conventionsFileInput.value) conventionsFileInput.value.value = ''
  }
}

const triggerConventionsFileInput = () => {
  conventionsFileInput.value?.click()
}

const downloadBackup = async () => {
  isBackingUp.value = true
  try {
    const data: Blob = await fetchApi('/admin/migration/backup', { responseType: 'blob' }) as Blob
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `glide-backup-${new Date().toISOString().split('T')[0]}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.add({ title: 'Backup downloaded successfully', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to download backup', color: 'error' })
  } finally {
    isBackingUp.value = false
  }
}

const handleBackupSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    isRestoreModalOpen.value = false
    return
  }

  isRestoring.value = true
  isRestoreModalOpen.value = false
  
  toast.add({ 
    title: 'Restore in progress...', 
    description: 'This may take a few minutes until all changes are loaded. Please wait.', 
    color: 'info',
    duration: 10000
  })
  
  try {
    const formData = new FormData()
    formData.append('file', file)

    await fetchApi('/admin/migration/backup', {
      method: 'POST',
      body: formData
    })

    toast.add({ title: 'Backup restored successfully', color: 'success' })
    
    // Delay reload so the user can see the success toast
    setTimeout(() => {
      window.location.href = '/'
    }, 2000)
  } catch (e) {
    console.error(e)
    toast.add({ title: 'Failed to restore backup', color: 'error' })
  } finally {
    isRestoring.value = false
    isRestoreModalOpen.value = false
    pendingRestoreFile.value = null
    if (backupFileInput.value) backupFileInput.value.value = ''
  }
}

const triggerBackupInput = () => {
  isRestoreModalOpen.value = true
}

const confirmAndSelectFile = () => {
  backupFileInput.value?.click()
}

const triggerS3Backup = async () => {
  isTriggeringS3.value = true
  try {
    await fetchApi('/admin/migration/s3-backup/trigger', { method: 'POST' })
    toast.add({ title: 'S3 Backup successfully uploaded', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to trigger S3 backup', color: 'error' })
  } finally {
    isTriggeringS3.value = false
  }
}
</script>

<template>
  <div class="w-full">
    <div class="flex flex-col gap-10">
      <div class="flex flex-col gap-4">
        <div>
          <h1 class="text-xl font-bold">Data & Migration</h1>
          <p class="text-sm text-neutral-400">Manage, migrate, and backup your Glide system data.</p>
        </div>
        <u-card class="flex flex-col h-full" :ui="{ body: { padding: 'p-2 sm:p-4' } }">
        <u-tabs 
          :items="[
            { label: 'Project Data', slot: 'project', icon: 'i-lucide-file-json' }, 
            { label: 'Local Backup', slot: 'local', icon: 'i-lucide-hard-drive-download' },
            { label: 'Cloud Backup', slot: 's3', icon: 'i-lucide-cloud' }
          ]"
          class="w-full"
        >
          <template #project>
            <div class="flex flex-col gap-6 pt-4">
              <div class="flex flex-col gap-1">
                <h2 class="text-lg font-bold flex items-center gap-2">
                  <u-icon name="i-lucide-file-json" class="w-5 h-5 text-primary-500" />
                  Project Data
                </h2>
                <p class="text-sm text-neutral-400">Import or export JSON translations and formatting conventions for specific projects.</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <u-form-field label="Project">
                  <u-select
                    v-model="selectedProjectId"
                    :items="projects.map(p => ({ label: p.name, value: p.id }))"
                    placeholder="Select project"
                    class="w-full"
                  />
                </u-form-field>

                <u-form-field label="Language (For Translations)">
                  <u-select
                    v-model="selectedLanguageId"
                    :items="languages.map(l => ({ label: l.name, value: l.id }))"
                    placeholder="Select language"
                    :disabled="!selectedProjectId"
                    class="w-full"
                  />
                </u-form-field>
              </div>

              <u-separator />

              <div class="flex flex-col gap-4">
                <h3 class="font-medium text-base text-neutral-200 flex items-center gap-2">
                  <u-icon name="i-lucide-languages" class="w-4 h-4 text-primary-500" />
                  Translations
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
                    <h3 class="font-medium text-sm">Export</h3>
                    <p class="text-xs text-neutral-400 mb-2 flex-1">Download a flat JSON file containing all translations for the selected project and language.</p>
                    <u-button 
                      label="Export to JSON" 
                      icon="i-lucide-download" 
                      color="primary" 
                      variant="subtle"
                      :disabled="!selectedLanguageId"
                      :loading="isExporting"
                      class="justify-center w-full"
                      @click="exportData"
                    />
                  </div>

                  <div class="flex flex-col gap-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
                    <h3 class="font-medium text-sm">Import</h3>
                    <p class="text-xs text-neutral-400 mb-2 flex-1">Upload a flat JSON file to import translations. Existing keys will be updated.</p>
                    <input 
                      ref="fileInput" 
                      type="file" 
                      accept=".json" 
                      class="hidden" 
                      @change="handleFileSelect"
                    >
                    <div class="flex items-center gap-2 mb-2">
                      <u-checkbox v-model="importAsPending" />
                      <span class="text-xs font-medium text-neutral-300">Import as pending review</span>
                    </div>
                    <u-button 
                      label="Import from JSON" 
                      icon="i-lucide-upload" 
                      color="primary" 
                      :disabled="!selectedLanguageId"
                      :loading="isImporting"
                      class="justify-center w-full"
                      @click="triggerFileInput"
                    />
                  </div>
                </div>
              </div>

              <u-separator />

              <div class="flex flex-col gap-4">
                <h3 class="font-medium text-base text-neutral-200 flex items-center gap-2">
                  <u-icon name="i-lucide-book-dashed" class="w-4 h-4 text-primary-500" />
                  Conventions
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
                    <h3 class="font-medium text-sm">Export</h3>
                    <p class="text-xs text-neutral-400 mb-2 flex-1">Download a JSON file containing key templates, variables, and glossary terms.</p>
                    <u-button 
                      label="Export Conventions" 
                      icon="i-lucide-download" 
                      color="primary" 
                      variant="subtle"
                      :disabled="!selectedProjectId"
                      :loading="isExportingConventions"
                      class="justify-center w-full"
                      @click="exportConventions"
                    />
                  </div>

                  <div class="flex flex-col gap-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
                    <h3 class="font-medium text-sm">Import</h3>
                    <p class="text-xs text-neutral-400 mb-2 flex-1">Upload a JSON file to import key templates, variables, and glossary terms.</p>
                    <input 
                      ref="conventionsFileInput" 
                      type="file" 
                      accept=".json" 
                      class="hidden" 
                      @change="handleConventionsFileSelect"
                    >
                    <u-button 
                      label="Import Conventions" 
                      icon="i-lucide-upload" 
                      color="primary" 
                      :disabled="!selectedProjectId"
                      :loading="isImportingConventions"
                      class="justify-center w-full mt-auto"
                      @click="triggerConventionsFileInput"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template #local>
            <div class="flex flex-col gap-6 pt-4">
              <div class="flex flex-col gap-1">
                <h2 class="text-lg font-bold flex items-center gap-2">
                  <u-icon name="i-lucide-hard-drive-download" class="w-5 h-5 text-primary-500" />
                  Local System Backup
                </h2>
                <p class="text-sm text-neutral-400">Export or import a complete snapshot of your Glide instance (projects, settings, conventions, and all translations, including those in review).</p>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
                  <h3 class="font-medium text-sm">Download Backup</h3>
                  <p class="text-xs text-neutral-400 mb-2 flex-1">Download a ZIP file containing the entire localization database and all related data.</p>
                  <u-button 
                    label="Download Backup ZIP" 
                    icon="i-lucide-download" 
                    color="primary" 
                    variant="subtle"
                    :loading="isBackingUp"
                    class="justify-center w-full"
                    @click="downloadBackup"
                  />
                </div>

                <div class="flex flex-col gap-2 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
                  <h3 class="font-medium text-sm">Restore Backup</h3>
                  <p class="text-xs text-neutral-400 mb-2 flex-1">Upload a previously generated ZIP backup. Warning: This will overwrite your existing data.</p>
                  <input 
                    ref="backupFileInput" 
                    type="file" 
                    accept=".zip" 
                    class="hidden" 
                    @change="handleBackupSelect"
                  >
                  <u-button 
                    label="Restore Backup" 
                    icon="i-lucide-upload" 
                    color="primary" 
                    :loading="isRestoring"
                    class="justify-center w-full"
                    @click="triggerBackupInput"
                  />
                </div>
              </div>
            </div>
          </template>

          <template #s3>
            <div class="flex flex-col gap-6 pt-4">
              <div class="flex flex-col gap-1">
                <h2 class="text-lg font-bold flex items-center gap-2">
                  <u-icon name="i-lucide-cloud" class="w-5 h-5 text-primary-500" />
                  Cloud Backup
                </h2>
                <p class="text-sm text-neutral-400">Configure automated remote backups of your entire localization database to an S3-compatible storage (AWS, MinIO, etc.).</p>
              </div>
            
            <div class="flex flex-col gap-4">
              <u-alert 
                v-if="!settings.s3Configured" 
                color="warning" 
                variant="subtle" 
                title="S3 Not Configured" 
                description="Please provide S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY in your environment variables." 
                icon="i-lucide-cloud-off" 
              />
              
              <div class="grid grid-cols-2 gap-4 p-4 border border-neutral-800 rounded-xl" :class="{ 'opacity-50 pointer-events-none': !settings.s3Configured }">
                <u-form-field label="Schedule Automatic Backups">
                  <div class="flex items-center gap-2 mt-2">
                    <u-switch v-model="s3BackupEnabled" />
                    <span class="text-sm text-neutral-400">Run backups automatically</span>
                  </div>
                </u-form-field>

                <u-form-field label="Backup Frequency">
                  <u-select
                    v-model="settings.s3BackupFrequency"
                    :items="[{label: 'Daily', value: 'daily'}, {label: 'Weekly', value: 'weekly'}, {label: 'Monthly', value: 'monthly'}]"
                    placeholder="Select frequency"
                    class="w-full"
                    @change="async () => {
                      const success = await saveSettings({ s3BackupFrequency: settings.s3BackupFrequency });
                      if (success) toast.add({ title: 'Backup frequency updated', color: 'success' });
                    }"
                  />
                </u-form-field>
                
                <div class="col-span-2 pt-2 flex justify-end">
                  <u-button 
                    label="Manually Trigger S3 Backup" 
                    icon="i-lucide-play" 
                    color="neutral" 
                    variant="subtle"
                    :loading="isTriggeringS3"
                    @click="triggerS3Backup"
                  />
                </div>
              </div>
            </div>
            </div>
          </template>
        </u-tabs>
        </u-card>
      </div>
    </div>

    <migration-restore-modal
      v-model="isRestoreModalOpen"
      :is-restoring="isRestoring"
      @confirm="confirmAndSelectFile"
    />
  </div>
</template>
