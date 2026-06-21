<script setup lang="ts">
import { onMounted } from 'vue'

const appConfig = useAppConfig()

onMounted(() => {
  const saved = localStorage.getItem('glide_primary_color')
  if (saved) {
    appConfig.ui.colors.primary = saved
  }
})
</script>

<template>
  <u-app>
    <VitePwaManifest />
    <nuxt-layout>
      <nuxt-page/>
    </nuxt-layout>
  </u-app>
</template>
