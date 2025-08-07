import React, { createContext, useContext, useEffect, useState } from 'react'
import setGlobalColorTheme, { availableThemeColors, type ThemeColors } from '../lib/themeColors'

type ThemeMode = 'light' | 'dark'

interface ThemeContextProps {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  themeColor: ThemeColors
  setThemeColor: (color: ThemeColors) => void
}

const ThemeContext = createContext<ThemeContextProps>({} as ThemeContextProps)

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [theme, setThemeState] = useState<ThemeMode>('light')
  const [themeColor, setThemeColorState] = useState<ThemeColors | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      try {
        const savedColor = localStorage.getItem('themeColor')
        if (
          savedColor &&
          availableThemeColors.some((c) => c.name === savedColor)
        ) {
          setThemeColorState(savedColor as ThemeColors)
        } else {
          setThemeColorState('Green')
        }
      } catch (error) {
        setThemeColorState('Green')
      }
    }
  }, [isMounted])

  useEffect(() => {
    if (!isMounted) return

    const savedTheme = localStorage.getItem('theme')
    if (!savedTheme) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      setThemeState(systemTheme)
      localStorage.setItem('theme', systemTheme)
    } else {
      setThemeState(savedTheme as ThemeMode)
    }
  }, [isMounted])

  useEffect(() => {
    if (!isMounted || themeColor === null) return

    localStorage.setItem('themeColor', themeColor)
    localStorage.setItem('theme', theme)

    setGlobalColorTheme(themeColor)
    
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [themeColor, theme, isMounted])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }

  const setThemeColor = (newColor: ThemeColors) => {
    setThemeColorState(newColor)
  }

  if (!isMounted || themeColor === null) {
    return null
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themeColor,
        setThemeColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  return useContext(ThemeContext)
} 