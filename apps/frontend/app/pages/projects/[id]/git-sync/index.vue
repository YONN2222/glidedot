<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const projectId = route.params.id as string
const toast = useToast()
const { fetchApi } = useApi()
const { isAdmin } = useAuth()

const isLoading = ref(false)
const syncs = ref<any[]>([])

const providerMap = {
  github: { icon: 'i-simple-icons-github', color: 'text-white' },
  gitlab: { icon: 'i-simple-icons-gitlab', color: 'text-[#FC6D26]' },
  forgejo: { icon: 'i-simple-icons-gitea', color: 'text-[#609926]' }
}

const fetchData = async () => {
  isLoading.value = true
  try {
    syncs.value = await fetchApi(`/git/projects/${projectId}/syncs`)
  } catch {
    toast.add({ title: 'Error', description: 'Failed to load sync configurations', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

const isPushing = ref<Record<number, boolean>>({})
const pushSync = async (id: number) => {
  isPushing.value[id] = true
  try {
    const res = await fetchApi(`/git/projects/${projectId}/syncs/${id}/execute`, { method: 'POST' })
    toast.add({ title: 'PR Created!', description: `Successfully opened a pull request on branch: ${res.branch}`, color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Push Failed', description: e.message || 'An error occurred', color: 'error' })
  } finally {
    isPushing.value[id] = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex justify-between items-start">
      <div>
        <h1 class="text-2xl font-bold text-white mb-2">Git Sync</h1>
        <p class="text-neutral-400">Push your translations directly to your version control provider via automated Pull Requests.</p>
      </div>
    </div>

    <!-- Active Configurations -->
    <div class="space-y-4">
      <div v-if="syncs.length === 0" class="p-8 text-center border border-dashed border-neutral-700 rounded-xl bg-neutral-900/50">
        <u-icon name="i-lucide-git-merge" class="w-12 h-12 mx-auto text-neutral-600 mb-4" />
        <h3 class="text-lg font-medium text-white mb-2">No Git Syncs configured</h3>
        <p class="text-neutral-400 max-w-sm mx-auto mb-6">Automated Pull Requests must be configured before you can sync translations.</p>
        <u-button v-if="isAdmin" label="Go to Manage Projects" to="/admin/projects" color="primary" />
        <p v-else class="text-sm text-neutral-500">Please ask an administrator to configure Git Sync for this project.</p>
      </div>

      <div v-for="sync in syncs" :key="sync.id" class="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-start gap-4">
          <u-icon :name="providerMap[sync.provider as keyof typeof providerMap].icon" class="w-8 h-8 mt-1" :class="providerMap[sync.provider as keyof typeof providerMap].color" />
          <div>
            <h3 class="font-bold text-white text-lg">{{ sync.repoName }}</h3>
            <div class="flex gap-4 mt-2 text-sm text-neutral-400">
              <span class="flex items-center gap-1"><u-icon name="i-lucide-git-branch" class="w-4 h-4" /> {{ sync.branch }}</span>
              <span class="flex items-center gap-1"><u-icon name="i-lucide-file-code" class="w-4 h-4" /> {{ sync.filePath }}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
          <u-button label="Create Pull Request" icon="i-lucide-upload-cloud" color="primary" class="flex-1 md:flex-none justify-center" :loading="isPushing[sync.id]" @click="pushSync(sync.id)" />
        </div>
      </div>
    </div>
  </div>
</template>
