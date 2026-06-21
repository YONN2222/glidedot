<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { TranslationLabel } from '@glidedot/types'
import { useTranslation } from '~/composables/localization/useTranslation'

const search = ref("")
const pagination = ref({pageIndex: 0, pageSize: 15})
const rowSelection = ref<Record<string, boolean>>({})

const isDeleteModalOpen = ref(false)
const isAddLabelModalOpen = ref(false)


const currentPagination = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (val) => {
    pagination.value = {
      ...pagination.value,
      pageIndex: val - 1
    }
  }
})

const columns: TableColumn<TranslationLabel>[] = [
  {id: 'select'},
  {accessorKey: 'name', header: 'Label Name'},
  {accessorKey: 'color', header: 'Color'},
]

const {
  init,
  labels: realLabels,
  isLoading,
  addLabel,
  bulkDeleteLabels
} = useTranslation()

onMounted(() => {
  init()
})

const selectedLabels = computed(() => {
  return realLabels.value.filter((_, index) => rowSelection.value[index.toString()])
})

const selectedRowsCount = computed(() => selectedLabels.value.length)

const deleteSelectedLabels = async () => {
  const ids = selectedLabels.value.map(l => l.id)
  if (ids.length) {
    await bulkDeleteLabels(ids)
  }
  rowSelection.value = {}
  isDeleteModalOpen.value = false
}

const addNewLabel = async (payload: { name: string, color: string }) => {
  await addLabel(payload.name, payload.color)
  isAddLabelModalOpen.value = false
}

const bulkActions = computed<DropdownMenuItem[][]>(() => [
  [
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

const filteredLabelsMobile = computed(() => {
  if (!search.value) return realLabels.value
  const s = search.value.toLowerCase()
  return realLabels.value.filter(l => l.name.toLowerCase().includes(s))
})

const paginatedLabelsMobile = computed(() => {
  const start = pagination.value.pageIndex * pagination.value.pageSize
  return filteredLabelsMobile.value.slice(start, start + pagination.value.pageSize)
})

const toggleSelection = (label: TranslationLabel) => {
  const idx = realLabels.value.indexOf(label).toString()
  rowSelection.value[idx] = !rowSelection.value[idx]
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-col md:flex-row justify-between gap-4">
      <h1 class="text-xl font-bold">Translation Labels</h1>
    </div>

    <label-delete-modal
      v-model="isDeleteModalOpen"
      :selected-count="selectedRowsCount"
      @confirm="deleteSelectedLabels"
    />

    <label-create-modal
      v-model="isAddLabelModalOpen"
      @create="addNewLabel"
    />

    <div class="flex flex-col md:flex-row justify-between py-4 gap-4">
      <u-input v-model="search" icon="i-lucide-search" size="lg" placeholder="Search labels..." class="w-full md:w-80"/>
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
            label="Add Label"
            icon="i-lucide-plus"
            @click="isAddLabelModalOpen = true"
        />
      </div>
    </div>

    <div class="w-full space-y-4 pb-4">
      <div class="hidden md:block">
        <u-table
            v-model:row-selection="rowSelection"
            v-model:pagination="pagination"
            v-model:global-filter="search"
            :data="realLabels"
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

          <template #name-cell="{ row }">
            <span class="font-medium">{{ row.getValue('name') }}</span>
          </template>

          <template #color-cell="{ row }">
            <u-badge
                variant="subtle"
                color="neutral"
                size="md"
                :style="{ backgroundColor: `${row.original.color}20`, color: row.original.color, borderColor: `${row.original.color}20` }"
            >
              {{ row.original.color }}
            </u-badge>
          </template>
        </u-table>
      </div>

      <!-- Mobile List -->
      <div class="flex flex-col gap-3 md:hidden">
        <u-card v-for="label in paginatedLabelsMobile" :key="label.id" :ui="{ body: { padding: 'p-4' } }" class="cursor-pointer" @click="toggleSelection(label)">
          <div class="flex items-center gap-4">
            <u-checkbox
              :model-value="rowSelection[realLabels.indexOf(label).toString()]"
              @update:model-value="(val) => rowSelection[realLabels.indexOf(label).toString()] = !!val"
              @click.stop
            />
            <div class="flex flex-col flex-1 gap-2">
              <span class="font-bold text-neutral-200">{{ label.name }}</span>
              <div class="flex items-center gap-2">
                <u-badge
                    variant="subtle"
                    color="neutral"
                    size="sm"
                    :style="{ backgroundColor: `${label.color}20`, color: label.color, borderColor: `${label.color}20` }"
                >
                  {{ label.color }}
                </u-badge>
              </div>
            </div>
          </div>
        </u-card>
        <div v-if="paginatedLabelsMobile.length === 0" class="text-center py-8 text-neutral-500 text-sm">
          No labels found.
        </div>
      </div>

      <div class="flex justify-end border-t border-default pt-4 px-4">
        <u-pagination
            v-model:page="currentPagination"
            :total="realLabels.length"
            :items-per-page="pagination.pageSize"
        />
      </div>
    </div>
  </div>
</template>
