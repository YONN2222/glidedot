<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const { user } = useAuth()
const { fetchApi } = useApi()
const toast = useToast()

interface DashboardStats {
  globalStats: {
    totalProjects: number
    totalKeys: number
    totalLanguages: number
    totalTranslations: number
    overallProgress: number
  }
  projects: {
    id: number
    name: string
    keysCount: number
    languagesCount: number
    translationsCount: number
    progress: number
  }[]
  personalStats?: {
    keysCreated: number
    translationsUpdated: number
    languagesAdded: number
    labelsCreated: number
  }
}

const stats = ref<DashboardStats | null>(null)
const isLoading = ref(true)

const loadStats = async (silent = false) => {
  if (!silent) isLoading.value = true
  try {
    const data = await fetchApi('/localization/projects/dashboard')
    stats.value = data as DashboardStats
  } catch {
    if (!silent) toast.add({ title: 'Failed to load dashboard statistics', color: 'error' })
  } finally {
    isLoading.value = false
  }
}



let intervalId: ReturnType<typeof setInterval>

onMounted(() => {
  loadStats()
  // Poll every 10 seconds to keep stats and activity feed updated
  intervalId = setInterval(() => {
    loadStats(true)
  }, 10000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <div class="flex flex-col gap-8 max-w-7xl mx-auto py-4">
    <!-- Header -->
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold">Welcome back, {{ user?.username || 'User' }}! 👋</h1>
      <p class="text-sm text-neutral-400">Here's a quick overview of your localization progress.</p>
    </div>

    <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <u-skeleton v-for="i in 4" :key="i" class="h-28 w-full rounded-xl bg-neutral-900" />
    </div>

    <template v-else-if="stats">
      <!-- Welcome Message & Personal Contributions -->
      <div class="flex flex-col gap-6 p-5 md:p-8 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary-500/10 via-[#121212] to-[#121212] border border-primary-500/20 mb-4 shadow-lg shadow-primary-500/5 relative overflow-hidden">
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"/>
        
        <div class="flex flex-col gap-2 z-10">
          <h2 class="text-2xl md:text-3xl font-bold text-white tracking-tight">Your Contributions</h2>
          <p class="text-neutral-400 max-w-xl text-sm leading-relaxed">Here is an overview of everything you've accomplished so far. Keep up the great work!</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 z-10">
          <!-- Translations -->
          <div class="flex flex-col p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-sm">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Translations</span>
            <span class="text-3xl font-black text-white">{{ stats.personalStats?.translationsUpdated || 0 }}</span>
          </div>
          <!-- Keys -->
          <div class="flex flex-col p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-sm">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Keys Created</span>
            <span class="text-3xl font-black text-white">{{ stats.personalStats?.keysCreated || 0 }}</span>
          </div>
          <!-- Languages -->
          <div class="flex flex-col p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-sm">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Languages Added</span>
            <span class="text-3xl font-black text-white">{{ stats.personalStats?.languagesAdded || 0 }}</span>
          </div>
          <!-- Labels -->
          <div class="flex flex-col p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-sm">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Labels Created</span>
            <span class="text-3xl font-black text-white">{{ stats.personalStats?.labelsCreated || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Project Progress (Takes up 2 columns) -->
        <div class="lg:col-span-2 flex flex-col gap-4">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <u-icon name="i-lucide-bar-chart-3" class="w-5 h-5 text-neutral-400" />
            Project Progress
          </h2>
          
          <u-card :ui="{ body: 'p-0 sm:p-0', divide: 'divide-y divide-neutral-800' }" class="bg-[#121212]">
            <div v-if="stats.projects.length === 0" class="p-6 text-sm text-neutral-500 text-center">
              No projects found.
            </div>
            
            <a 
              v-for="project in stats.projects"
              :key="project.id" 
              :href="`/projects/${project.id}`"
              class="block p-4 hover:bg-neutral-900 transition-colors group"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex flex-col">
                  <span class="font-semibold text-neutral-200 group-hover:text-primary-400 transition-colors">{{ project.name }}</span>
                  <span class="text-xs text-neutral-500">{{ project.keysCount }} Keys • {{ project.languagesCount }} Languages</span>
                </div>
                <div class="text-right">
                  <div class="text-sm font-bold" :class="project.progress === 100 ? 'text-success-500' : 'text-neutral-300'">
                    {{ project.progress }}%
                  </div>
                  <div class="text-xs text-neutral-500">{{ project.translationsCount }} / {{ project.keysCount * project.languagesCount }}</div>
                </div>
              </div>
              <u-progress 
                :model-value="project.progress" 
                :max="100" 
                :color="project.progress === 100 ? 'success' : 'primary'"
                size="xs"
              />
            </a>
          </u-card>
        </div>

        <!-- Needs Attention (Takes up 1 column) -->
        <div class="flex flex-col gap-4">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <u-icon name="i-lucide-alert-circle" class="w-5 h-5 text-amber-500" />
            Needs Attention
          </h2>
          
          <u-card :ui="{ body: 'p-0 sm:p-0', divide: 'divide-y divide-neutral-800' }" class="bg-[#121212]">
            <template v-if="stats.projects.filter(p => p.progress < 100).length === 0">
              <div class="p-6 text-center text-sm text-neutral-500 flex flex-col items-center gap-2">
                <u-icon name="i-lucide-party-popper" class="w-8 h-8 text-neutral-600" />
                All caught up! Every project is 100% translated.
              </div>
            </template>
            
            <a 
              v-for="project in stats.projects.filter(p => p.progress < 100).sort((a,b) => a.progress - b.progress).slice(0, 5)"
              :key="project.id"
              :href="`/projects/${project.id}/localization/translations`"
              class="block p-4 hover:bg-neutral-900 transition-colors group"
            >
              <div class="flex items-center justify-between">
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium text-neutral-200 group-hover:text-neutral-100 transition-colors">{{ project.name }}</span>
                  <span class="text-xs text-amber-500/80">{{ (project.keysCount * project.languagesCount) - project.translationsCount }} missing</span>
                </div>
                <div class="text-right">
                  <div class="text-sm font-bold text-amber-500">
                    {{ project.progress }}%
                  </div>
                </div>
              </div>
            </a>
          </u-card>
        </div>
      </div>
    </template>
  </div>
</template>