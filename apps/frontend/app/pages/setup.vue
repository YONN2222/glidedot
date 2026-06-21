<script setup lang="ts">
const config = useRuntimeConfig()
const step = ref(1)
const loading = ref(false)

const setupData = ref({
  adminPassword: '',
  initialProjectName: 'My Awesome Project'
})

const continueFromStep1 = () => {
  const error = validatePasswordStrength(setupData.value.adminPassword)
  if (error) {
    useToast().add({ title: error, color: 'error' })
    return
  }
  step.value = 2
}

const startSetup = async () => {
  loading.value = true
  try {
    const response = await $fetch<{ success: boolean }>(`${config.public.apiBase}/setup/initial`, {
      method: 'POST',
      body: setupData.value
    })
    if (response.success) {
      step.value = 3
    }
  } catch (e) {
    console.error(e)
    alert('Setup failed. Check console for details.')
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-svh flex flex-col justify-center items-center bg-neutral-950 p-6">
    <div class="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-8 shadow-2xl">

      <div class="flex flex-col items-center">
        <nuxt-img src="/img/logo.png" class="w-20 mb-6"/>
        <h1 class="text-2xl font-bold text-white">Setup Wizard</h1>
        <p class="text-neutral-400 text-center mt-2 px-4">Welcome to Glide! Let's get your environment ready in just a few steps.</p>
      </div>

      <!-- Step 1: Welcome & Admin -->
      <div v-if="step === 1" class="space-y-6">
        <div class="space-y-2">
          <label class="text-sm font-semibold text-neutral-300">Set Admin Password</label>
          <u-input v-model="setupData.adminPassword" type="password" placeholder="Choose a secure password" size="xl" class="w-full"/>
          <p class="text-[11px] text-neutral-500">Username will be 'admin'. You'll need this to login for the first time.</p>
        </div>
        <u-button color="primary" label="Continue" size="xl" class="w-full justify-center" :disabled="!setupData.adminPassword" @click="continueFromStep1"/>
      </div>

      <!-- Step 2: Settings & Project -->
      <div v-if="step === 2" class="space-y-6">
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-neutral-300">First Project Name</label>
            <u-input v-model="setupData.initialProjectName" placeholder="e.g. Mobile App" size="xl" class="w-full"/>
          </div>
        </div>
        <div class="flex gap-3">
          <u-button color="neutral" variant="ghost" label="Back" size="xl" class="flex-1 justify-center" @click="step = 1"/>
          <u-button color="primary" label="Finish Setup" size="xl" class="flex-1 justify-center" :loading="loading" @click="startSetup"/>
        </div>
      </div>

      <!-- Step 3: Success -->
      <div v-if="step === 3" class="text-center space-y-6 py-4">
        <div class="size-16 bg-success-500/20 text-success-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <u-icon name="i-lucide-check" class="size-8"/>
        </div>
        <h2 class="text-xl font-bold">You're all set!</h2>
        <p class="text-neutral-400">The database has been initialized, default languages created, and your admin account is ready.</p>
        <u-button color="primary" label="Go to Login" size="xl" class="w-full justify-center" @click="goToLogin"/>
      </div>

    </div>
  </div>
</template>

