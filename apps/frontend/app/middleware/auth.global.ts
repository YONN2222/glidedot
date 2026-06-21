export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { isLoggedIn, fetchUser } = useAuth()
  const { loggedIn: oidcLoggedIn, fetch: fetchOidc } = useOidcAuth()
  const config = useRuntimeConfig()

  // Ensure OIDC session is fetched before making redirect decisions
  if (!oidcLoggedIn.value && typeof fetchOidc === 'function') {
    try {
      await fetchOidc()
    } catch {
      // ignore
    }
  }

  // If going to /login but already logged in, redirect home
  if (to.path === '/login') {
    if (isLoggedIn.value) {
      return navigateTo('/')
    }
    return
  }

  // Skip if we are going to logout
  if (to.path === '/logout') return

  // Check setup status
  try {
    const status = await $fetch<{ setupRequired: boolean }>(`${config.public.apiBase}/setup/status`)
    if (status.setupRequired) {
      if (to.path !== '/setup') {
        return navigateTo('/setup')
      }
      return
    } else if (to.path === '/setup') {
      return navigateTo('/login')
    }
  } catch (e) {
    console.error('Failed to check setup status', e)
  }

  // If not logged in, try fetching user first
  if (!isLoggedIn.value) {
    const user = await fetchUser()
    if (!user) {
      return navigateTo('/login')
    }
  }
})
