import { watchEffect, toValue, type MaybeRefOrGetter } from 'vue'

export function useThemeColor(hexColor: MaybeRefOrGetter<string>) {
  if (import.meta.server) return

  watchEffect(() => {
    const color = toValue(hexColor)
    if (!color || !color.startsWith('#')) {
      const el = document.getElementById('glide-custom-theme')
      if (el) el.remove()
      return
    }

    let el = document.getElementById('glide-custom-theme')
    if (!el) {
      el = document.createElement('style')
      el.id = 'glide-custom-theme'
      document.head.appendChild(el)
    }

    el.innerHTML = `
      :root, :host {
        --ui-color-primary-50: color-mix(in srgb, ${color} 10%, white);
        --ui-color-primary-100: color-mix(in srgb, ${color} 20%, white);
        --ui-color-primary-200: color-mix(in srgb, ${color} 40%, white);
        --ui-color-primary-300: color-mix(in srgb, ${color} 60%, white);
        --ui-color-primary-400: color-mix(in srgb, ${color} 80%, white);
        --ui-color-primary-500: ${color};
        --ui-color-primary-600: color-mix(in srgb, ${color} 80%, black);
        --ui-color-primary-700: color-mix(in srgb, ${color} 60%, black);
        --ui-color-primary-800: color-mix(in srgb, ${color} 40%, black);
        --ui-color-primary-900: color-mix(in srgb, ${color} 20%, black);
        --ui-color-primary-950: color-mix(in srgb, ${color} 10%, black);
      }
    `
  })
}
