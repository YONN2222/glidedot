<script setup lang="ts">
definePageMeta({
  layout: 'login'
})

const accesskey = ref("")
const password = ref("")
const { login: authLogin } = useAuth()
const error = ref(false)

const { login: oidcLogin } = useOidcAuth()
const config = useRuntimeConfig()
const isOidcEnabled = computed(() => config.public.oidcEnabled)

const login = async () => {
  error.value = false
  const success = await authLogin(accesskey.value, password.value)
  if (success) {
    navigateTo('/')
  } else {
    error.value = true
  }
}

const focusPassword = () => {
  document.getElementById('password')?.focus()
}
</script>

<template>
  <div class="min-h-svh flex flex-col justify-center items-center space-y-4">
    <nuxt-img src="/img/logo.png" class="w-18 h-auto"/>

    <div class="flex flex-col items-center border border-accented rounded-lg p-4 w-100 h-auto pb-8">

      <div class="flex flex-col items-center">
        <h1 class="mb-2 text-xl font-bold">Welcome back</h1>
        <p>Login with your Accesskey<span v-if="isOidcEnabled"> or OIDC</span></p>
      </div>

      <div class="flex flex-col mt-6 relative" :class="{'opacity-50 blur-[2px] pointer-events-none select-none': !isOidcEnabled}">
        <u-button variant="subtle" color="neutral" class="w-80 h-10 justify-center" @click="oidcLogin('oidc')">
          <div class="flex flex-row items-center space-x-2">
            <u-icon name="i-lucide-fingerprint" class="size-4"/>
            <p class="text-base">Login with OIDC</p>
          </div>
        </u-button>
        <div v-if="!isOidcEnabled" class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <u-badge color="warning" variant="solid" size="sm">OIDC Disabled</u-badge>
        </div>
      </div>

      <u-separator :label="isOidcEnabled ? 'or login with' : ''" class="py-6"
                  :class="!isOidcEnabled ? 'invisible' : ''"
                  :ui="{ border: 'border-accented', label: 'text-base text-neutral-400' }"/>

      <div class="flex flex-col space-y-4">
        <label for="username" class="mb-2">Username</label>
        <u-input id="username" v-model="accesskey" placeholder="Username" size="xl" class="w-80" :color="error ? 'error' : 'neutral'" @keydown.enter="focusPassword" />
        <label for="password" class="mb-2">Password</label>
        <u-input id="password" v-model="password" type="password" placeholder="Password" size="xl" class="w-80" :color="error ? 'error' : 'neutral'" @keydown.enter="login" />
        <p v-if="error" class="text-error-500 text-sm">Invalid username or password</p>
        <u-button color="neutral" label="Login" class="w-80 h-10 mt-4 justify-center text-base" @click="login"/>
      </div>
    </div>
  </div>
</template>