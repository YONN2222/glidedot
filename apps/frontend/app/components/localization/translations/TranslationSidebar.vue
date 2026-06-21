<script setup lang="ts">
import type { TranslationKeyScopeNode } from '@glidedot/types'

const props = defineProps<{
  visibleScopes: TranslationKeyScopeNode[]
}>()

const selectedScope = defineModel<string | null>('selectedScope', { default: null })
</script>

<template>
  <u-card class="w-72 flex-shrink-0">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold">Key Scopes</h2>
        <u-icon name="i-lucide-filter" class="text-muted w-4 h-4" />
      </div>
    </template>

    <div class="flex flex-col space-y-1 max-h-[600px] overflow-y-auto">
      <!-- "All Keys" Option -->
      <u-button
          :variant="selectedScope === null ? 'soft' : 'ghost'"
          color="neutral"
          size="sm"
          class="w-full justify-start gap-2 px-2.5 text-primary"
          icon="i-lucide-layout-grid"
          @click="selectedScope = null"
      >
        All Keys
      </u-button>

      <div class="py-1">
        <u-separator />
      </div>

      <!-- Scope List -->
      <u-button
          v-for="node in props.visibleScopes"
          :key="node.id"
          :variant="selectedScope === node.id ? 'soft' : 'ghost'"
          color="neutral"
          size="sm"
          class="w-full justify-start gap-2 px-2.5 text-left"
          :style="{ paddingLeft: `calc(${node.level * 0.75}rem + 10px)` }"
          @click="selectedScope = node.id"
      >
        <u-icon
            :name="node.hasChildren ? 'i-lucide-folder' : 'i-lucide-hash'"
            class="w-4 h-4 shrink-0"
        />

        <span class="truncate font-medium flex-1">
          {{ node.name }}
        </span>

        <u-badge v-if="node.keyCount > 0" variant="subtle" size="xs" color="neutral" class="ml-auto shrink-0 font-mono">
          {{ node.keyCount }}
        </u-badge>
      </u-button>
    </div>
  </u-card>
</template>

