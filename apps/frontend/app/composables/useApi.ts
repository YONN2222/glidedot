export const useApi = () => {
  const config = useRuntimeConfig()
  const apiKey = useCookie('glide_api_key')

  const fetchApi = async (url: string, options: Parameters<typeof $fetch>[1] = {}) => {
    return $fetch(url, {
      baseURL: config.public.apiBase,
      headers: {
        'x-api-key': apiKey.value || '',
        ...options.headers
      },
      ...options
    })
  }

  return {
    fetchApi,
    apiKey
  }
}

