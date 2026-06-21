<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { TranslationKey, TranslationLabel } from '@glidedot/types'
import { useTranslation } from '~/composables/localization/useTranslation'

const {
  init,
  keys: realKeys,
  labels: projectLabels,
  isLoading,
  addKey,
  bulkDeleteKeys,
  bulkAddLabelToKeys,
  bulkRemoveLabelFromKeys
} = useTranslation()

const search = ref("")
const pagination = ref({pageIndex: 0, pageSize: 15})
const rowSelection = ref<Record<string, boolean>>({})
const isEditLabelsModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isAddKeyModalOpen = ref(false)

const currentPagination = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (val) => {
    pagination.value = {
      ...pagination.value,
      pageIndex: val - 1
    }
  }
})

const columns: TableColumn<TranslationKey>[] = [
  {id: 'select'},
  {accessorKey: 'key', header: 'Translation Key'},
  {accessorKey: 'labels', header: 'Labels'},
]

onMounted(() => {
  init()
})

const selectedKeys = computed(() => {
  return realKeys.value.filter((_, index) => rowSelection.value[index.toString()])
})

const deleteSelectedKeys = async () => {
  const ids = selectedKeys.value.map(k => k.id)
  if (ids.length) {
    await bulkDeleteKeys(ids)
  }
  rowSelection.value = {}
  isDeleteModalOpen.value = false
}

const selectedRowsCount = computed(() => selectedKeys.value.length)

const commonLabels = computed(() => {
  if (selectedKeys.value.length === 0) return []
  const firstKeyLabels = selectedKeys.value[0]?.labels || []
  return firstKeyLabels.filter(label =>
      selectedKeys.value.every(key =>
          key.labels?.some(l => l.id === label.id)
      )
  )
})

const availableLabels = computed(() => {
  const commonIds = commonLabels.value.map(l => l.id)
  return projectLabels.value.filter(l => !commonIds.includes(l.id))
})

const addLabelToSelection = async (label: TranslationLabel) => {
  const ids = selectedKeys.value.filter(key => !key.labels?.some(l => l.id === label.id)).map(k => k.id)
  if (ids.length) {
    await bulkAddLabelToKeys(ids, label.id)
  }
}

const removeLabelFromSelection = async (labelId: number) => {
  const ids = selectedKeys.value.filter(key => key.labels?.some(l => l.id === labelId)).map(k => k.id)
  if (ids.length) {
    await bulkRemoveLabelFromKeys(ids, labelId)
  }
}

const addNewKey = async (keyName: string) => {
  await addKey(keyName)
  isAddKeyModalOpen.value = false
}

const bulkActions = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Edit Labels',
      icon: 'i-lucide-tag',
      onSelect: () => {
        isEditLabelsModalOpen.value = true
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => {
        isDeleteModalOpen.value = true
      }
    }
  ]
])

const filteredKeysMobile = computed(() => {
  if (!search.value) return realKeys.value
  const s = search.value.toLowerCase()
  return realKeys.value.filter(k => k.key.toLowerCase().includes(s))
})

const paginatedKeysMobile = computed(() => {
  const start = pagination.value.pageIndex * pagination.value.pageSize
  return filteredKeysMobile.value.slice(start, start + pagination.value.pageSize)
})

const toggleSelection = (keyObj: TranslationKey) => {
  const idx = realKeys.value.indexOf(keyObj).toString()
  rowSelection.value[idx] = !rowSelection.value[idx]
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-col md:flex-row justify-between gap-4">
      <h1 class="text-xl font-bold">Translation Keys</h1>
    </div>

    <key-edit-labels-modal
      v-model="isEditLabelsModalOpen"
      :selected-count="selectedRowsCount"
      :common-labels="commonLabels"
      :available-labels="availableLabels"
      @add-label="addLabelToSelection"
      @remove-label="removeLabelFromSelection"
    />

    <key-delete-modal
      v-model="isDeleteModalOpen"
      :selected-count="selectedRowsCount"
      @confirm="deleteSelectedKeys"
    />

    <key-create-modal
      v-model="isAddKeyModalOpen"
      @create="addNewKey"
    />

    <div class="flex flex-col md:flex-row justify-between py-4 gap-4">
      <u-input v-model="search" icon="i-lucide-search" size="lg" placeholder="Search keys..." class="w-full md:w-80"/>
      <div class="flex items-center gap-2 w-full md:w-auto justify-end">
        <u-dropdown-menu v-if="selectedRowsCount > 0" :items="bulkActions">
          <u-button
              variant="subtle"
              color="neutral"
              :label="`Actions (${selectedRowsCount})`"
              icon="i-lucide-chevron-down"
              trailing
          />
        </u-dropdown-menu>
        <u-button
            variant="subtle"
            color="neutral"
            label="Add Key"
            icon="i-lucide-plus"
            @click="isAddKeyModalOpen = true"
        />
      </div>
    </div>

    <div class="w-full space-y-4 pb-4">
      <div class="hidden md:block">
        <u-table
            v-model:row-selection="rowSelection"
            v-model:pagination="pagination"
            v-model:global-filter="search"
            :data="realKeys"
            :columns="columns"
            :loading="isLoading"
            :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
            class="font-mono"
        >

          <template #select-header="{ table }">
            <u-checkbox
                :model-value="table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')"
                aria-label="Select all"
                @update:model-value="(val) => table.toggleAllPageRowsSelected(!!val)"
            />
          </template>

          <template #select-cell="{ row }">
            <u-checkbox
                :model-value="row.getIsSelected()"
                aria-label="Select row"
                @update:model-value="(val) => row.toggleSelected(!!val)"
            />
          </template>

          <template #key-cell="{ row }">
            <span class="font-medium">{{ row.getValue('key') }}</span>
          </template>

          <template #labels-cell="{ row }">
            <div class="flex gap-1">
              <div v-if="row.original.labels?.length" class="flex gap-1 flex-wrap">
                <u-badge v-for="label in row.original.labels" :key="label.id" variant="subtle" color="neutral" size="md"
                        :style="{ backgroundColor: `${label.color}20`, color: label.color, borderColor: `${label.color}20` }">
                  {{ label.name }}
                </u-badge>
              </div>
              <p v-else class="text-neutral-500 text-sm">No labels</p>
            </div>
          </template>
        </u-table>
      </div>

      <!-- Mobile List -->
      <div class="flex flex-col gap-3 md:hidden">
        <u-card v-for="keyObj in paginatedKeysMobile" :key="keyObj.id" :ui="{ body: { padding: 'p-4' } }" class="cursor-pointer" @click="toggleSelection(keyObj)">
          <div class="flex items-start gap-4">
            <u-checkbox
              class="mt-1"
              :model-value="rowSelection[realKeys.indexOf(keyObj).toString()]"
              @update:model-value="(val) => rowSelection[realKeys.indexOf(keyObj).toString()] = !!val"
              @click.stop
            />
            <div class="flex flex-col flex-1 gap-2 min-w-0">
              <span class="font-bold text-neutral-200 font-mono break-all text-sm">{{ keyObj.key }}</span>
              <div class="flex gap-1.5 flex-wrap">
                <template v-if="keyObj.labels?.length">
                  <u-badge v-for="label in keyObj.labels" :key="label.id" variant="subtle" color="neutral" size="xs"
                          :style="{ backgroundColor: `${label.color}20`, color: label.color, borderColor: `${label.color}20` }">
                    {{ label.name }}
                  </u-badge>
                </template>
                <p v-else class="text-neutral-500 text-[10px] uppercase tracking-wider font-semibold">No labels</p>
              </div>
            </div>
          </div>
        </u-card>
        <div v-if="paginatedKeysMobile.length === 0" class="text-center py-8 text-neutral-500 text-sm">
          No keys found.
        </div>
      </div>

      <div class="flex justify-end border-t border-default pt-4 px-4">
        <u-pagination
            v-model:page="currentPagination"
            :total="realKeys.length"
            :items-per-page="pagination.pageSize"
        />
      </div>
    </div>
  </div>
</template>