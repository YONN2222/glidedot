<script setup lang="ts">
const props = defineProps<{
  color: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div class="flex flex-row items-center border border-accented rounded-md"
       :class="(
           props.size === 'sm' ? 'px-2 py-1 text-xs' :
           props.size === 'md' ? 'px-3 py-1.5 text-sm' :
           props.size === 'lg' ? 'px-4 py-2 text-base' :
           'px-3 py-1.5 text-sm'
       )"
  >
    <span class="flex flex-row rounded-full mr-1" :class="[
        (
           props.size === 'sm' && 'w-2 h-2' ||
           props.size === 'md' && 'w-3 h-3' ||
           props.size === 'lg' && 'w-4 h-4' ||
           'px-3 py-1.5 text-sm'
       ),
       (
           color === 'primary' && 'bg-primary' ||
           color === 'success' && 'bg-success' ||
           color === 'warning' && 'bg-warning' ||
           color === 'error' && 'bg-error' ||
           color === 'neutral' && 'bg-accented' ||
           'bg-accented'
       )
    ]" />
    <div class="text-muted">
      <slot/>
    </div>
  </div>
</template>