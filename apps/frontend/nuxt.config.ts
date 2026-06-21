// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: false,
    components: [
      {
        path: '~/components',
        pathPrefix: false,
      },
    ],
    runtimeConfig: {
        public: {
            apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/v1',
            oidcEnabled: !!process.env.NUXT_OIDC_CLIENT_ID
        }
    },
    devtools: {enabled: true},
    modules: [
      '@nuxt/eslint',
      '@nuxt/image',
      '@nuxt/ui',
      'nuxt-oidc-auth',
      '@nuxt/content',
      '@comark/nuxt',
      '@vite-pwa/nuxt'
    ],
    pwa: {
        registerType: 'autoUpdate',
        manifest: {
            name: 'Glide',
            short_name: 'Glide',
            theme_color: '#141417',
            background_color: '#141417',
            display: 'standalone',
            icons: [
                {
                    src: '/icon.svg',
                    sizes: '512x512',
                    type: 'image/svg+xml',
                    purpose: 'any maskable'
                }
            ]
        },
        workbox: {
            navigateFallback: '/',
            globPatterns: ['**/*.{js,css,html,png,svg,ico}']
        },
        devOptions: {
            enabled: true,
            type: 'module',
            suppressWarnings: true
        }
    },
    oidc: {
        defaultProvider: 'oidc',
        providers: {
            oidc: {
                clientId: process.env.NUXT_OIDC_CLIENT_ID || '',
                clientSecret: process.env.NUXT_OIDC_CLIENT_SECRET || '',
                authorizationUrl: process.env.NUXT_OIDC_AUTHORIZATION_URL || '',
                tokenUrl: process.env.NUXT_OIDC_TOKEN_URL || '',
                userInfoUrl: process.env.NUXT_OIDC_USERINFO_URL || '',
                redirectUri: process.env.NUXT_OIDC_REDIRECT_URI || '',
                tokenRequestType: 'form-urlencoded',
                scope: ['openid', 'email', 'profile', 'groups'],
                validateAccessToken: false,
                validateIdToken: false
            }
        },
        middleware: {
            globalMiddlewareEnabled: false
        }
    },
    css: ["~/assets/style/main.css"],
    vite: {
        server: {
            allowedHosts: true
        }
    }
})