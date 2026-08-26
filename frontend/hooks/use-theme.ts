'use client'

import { useCallback, useEffect, useState } from 'react'

const THEME_KEY = 'trt_incident_theme'
const THEME_EVENT = 'trt-theme-change'

function readInitial(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(THEME_KEY) === 'dark'
}

// Aynı sekmede birden fazla bileşen (AppShell header'daki tema butonu ve
// Ayarlar sayfasındaki anahtar) tema durumunu paylaşır. localStorage +
// custom event ile canlı senkronize edilir.
export function useTheme() {
  const [dark, setDarkState] = useState<boolean>(readInitial)

  useEffect(() => {
    function onChange(e: Event) {
      setDarkState((e as CustomEvent<boolean>).detail)
    }
    window.addEventListener(THEME_EVENT, onChange)
    return () => window.removeEventListener(THEME_EVENT, onChange)
  }, [])

  const setDark = useCallback((value: boolean) => {
    window.localStorage.setItem(THEME_KEY, value ? 'dark' : 'light')
    setDarkState(value)
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: value }))
  }, [])

  return { dark, setDark }
}
