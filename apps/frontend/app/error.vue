<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})

const handleError = () => clearError({ redirect: '/' })

const { settings, loadSettings } = useSettings()
await loadSettings()

useHead({
  title: `${props.error?.statusCode || 500} - ${props.error?.statusMessage || 'Error'}`
})

if (import.meta.server) {
  const event = useRequestEvent()
  if (event && props.error?.statusCode) {
    setResponseStatus(event, props.error.statusCode, props.error.statusMessage)
  }
}
</script>

<template>
  <NuxtLayout name="error">
    <div class="flex flex-col justify-center items-center space-y-4 w-full px-4">
      <div class="flex items-center justify-center mb-4 mt-8">
        <div class="text-5xl font-black tracking-tighter text-white font-sans flex items-baseline">
          <template v-if="settings?.logoType === 'image'">
            <img :src="settings.logoUrlMinimal || settings.logoUrl" alt="Logo" class="h-14 w-auto max-w-[200px] object-contain shrink-0" >
          </template>
          <template v-else>
            {{ settings?.logoText || 'glide' }}<span v-if="settings?.logoShowDot !== 'false'" class="text-primary-500">.</span>
          </template>
        </div>
      </div>

      <div class="flex flex-col items-center border border-accented rounded-lg p-8 w-full max-w-[24rem]">
        <h1 class="text-6xl font-black text-primary-400 mb-2">{{ error?.statusCode || 500 }}</h1>
        <h2 class="text-xl font-bold mb-2 text-white">{{ error?.statusMessage || 'An error occurred' }}</h2>
        <p class="text-sm text-neutral-400 mb-8 text-center break-words w-full">{{ error?.message || 'Something went wrong while trying to load this page.' }}</p>

        <u-button 
          color="neutral" 
          variant="subtle"
          label="Back to Home" 
          icon="i-lucide-arrow-left"
          class="w-full h-10 justify-center text-base" 
          @click="handleError"
        />
      </div>
    </div>
  </NuxtLayout>
</template>
