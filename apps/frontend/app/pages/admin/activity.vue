<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

definePageMeta({
  layout: 'default'
})

const { fetchApi } = useApi()
const toast = useToast()

interface ActivityLog {
  id: number
  user: string
  action: string
  projectName: string
  details: string
  createdAt: string
  avatarUrl?: string
  username?: string
}

const logs = ref<ActivityLog[]>([])
const isLoading = ref(true)
const totalLogs = ref(0)
const searchQuery = ref('')

const currentPage = ref(1)
const pageSize = ref(15)

const fetchLogs = async () => {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', currentPage.value.toString())
    params.append('limit', pageSize.value.toString())
    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }
    const data = await fetchApi(`/admin/activity-logs?${params.toString()}`) as { data: ActivityLog[]; total: number }
    logs.value = data.data
    totalLogs.value = data.total
  } catch {
    toast.add({ title: 'Failed to load activity logs', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | undefined
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchLogs()
  }, 300)
})

watch(currentPage, () => {
  fetchLogs()
})

onMounted(() => {
  fetchLogs()
})

const columns = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'user', header: 'User' },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'projectName', header: 'Project' },
  { accessorKey: 'details', header: 'Details' },
  { accessorKey: 'createdAt', header: 'Time' }
]

const formatActionText = (action: string) => {
  return action.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
}

const formatDetails = (action: string, detailsString: string) => {
  if (!detailsString) return '-'
  try {
    const details = JSON.parse(detailsString)
    if (action === 'KEY_CREATED') {
      return `Created key "${details.key}"`
    } else if (action === 'TRANSLATION_UPDATED') {
      const keyName = details.keyName || `Key #${details.keyId}`
      const langCode = details.languageCode || `Lang #${details.languageId}`
      if (details.oldValue !== undefined && details.newValue !== undefined) {
        return `Updated ${keyName} (${langCode}) from "${details.oldValue}" to "${details.newValue}"`
      }
      return `Updated translation for ${keyName} (${langCode})`
    } else if (action === 'LANGUAGE_ADDED') {
      return `Added language ID ${details.languageId}`
    } else if (action === 'LABEL_CREATED') {
      return `Created label "${details.name}"`
    }
    const keys = Object.keys(details)
    if (keys.length > 0) {
      return keys.map(k => `${k}: ${details[k]}`).join(', ')
    }
    return detailsString
  } catch {
    return detailsString
  }
}

const formatLocalTime = (dateString: string) => {
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z')
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString()
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-row justify-between items-center">
      <div>
        <h1 class="text-xl font-bold">Activity Logs</h1>
        <p class="text-sm text-neutral-400">View a detailed log of all changes across the system.</p>
      </div>
      <u-button icon="i-lucide-refresh-cw" label="Refresh" color="neutral" variant="subtle" :loading="isLoading" @click="fetchLogs" />
    </div>

    <u-card :ui="{ body: { padding: 'p-0 sm:p-0' } }">
      <template #header>
        <div class="flex justify-between items-center">
          <u-input v-model="searchQuery" icon="i-lucide-search" placeholder="Search logs..." class="max-w-sm" />
        </div>
      </template>

      <u-table 
        :data="logs" 
        :columns="columns" 
        :loading="isLoading"
      >
        <template #id-cell="{ row }">
          <span class="text-xs text-neutral-500">#{{ row.original.id }}</span>
        </template>
        <template #user-cell="{ row }">
          <div class="flex items-center gap-2">
            <u-avatar
              :src="row.original.avatarUrl || undefined"
              :text="!row.original.avatarUrl ? getAvatarText(row.original.username) : undefined"
              :style="!row.original.avatarUrl ? { backgroundColor: getAvatarColor(row.original.username), color: '#171717' } : {}"
              size="xs"
              :ui="{ rounded: 'rounded-full' }"
            />
            <span class="font-medium text-sm">{{ row.original.username || 'System' }}</span>
          </div>
        </template>
        <template #action-cell="{ row }">
          <u-badge color="neutral" variant="subtle">
            {{ formatActionText(row.original.action) }}
          </u-badge>
        </template>
        <template #projectName-cell="{ row }">
          <span v-if="row.original.projectName" class="text-sm font-medium text-neutral-200">
            {{ row.original.projectName }}
          </span>
          <span v-else class="text-sm text-neutral-500 italic">
            System
          </span>
        </template>
        <template #details-cell="{ row }">
          <u-tooltip :text="formatDetails(row.original.action, row.original.details)" :popper="{ placement: 'top' }">
            <span class="text-sm text-neutral-300 block truncate max-w-[300px]">
              {{ formatDetails(row.original.action, row.original.details) }}
            </span>
          </u-tooltip>
        </template>
        <template #createdAt-cell="{ row }">
          <div class="flex flex-col">
            <span class="text-sm text-neutral-200">{{ formatLocalTime(row.original.createdAt).date }}</span>
            <span class="text-xs text-neutral-500">{{ formatLocalTime(row.original.createdAt).time }}</span>
          </div>
        </template>
      </u-table>

      <div v-if="totalLogs > pageSize" class="flex justify-end border-t border-default p-4">
        <u-pagination
            v-model:page="currentPage"
            :total="totalLogs"
            :items-per-page="pageSize"
        />
      </div>
    </u-card>
  </div>
</template>
