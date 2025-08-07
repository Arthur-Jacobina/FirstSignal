export type ThemeColors = 'Green' | 'Blue' | 'Orange' | 'Zinc' | 'Rose'

export interface ThemeColor {
  name: ThemeColors
  light: string
  dark: string
  cssVar: string
}

export const availableThemeColors: ThemeColor[] = [
  {
    name: 'Green',
    light: 'bg-green-600',
    dark: 'bg-green-500',
    cssVar: 'green'
  },
  {
    name: 'Blue', 
    light: 'bg-blue-600',
    dark: 'bg-blue-500',
    cssVar: 'blue'
  },
  {
    name: 'Orange',
    light: 'bg-orange-600', 
    dark: 'bg-orange-500',
    cssVar: 'orange'
  },
  {
    name: 'Zinc',
    light: 'bg-zinc-600',
    dark: 'bg-zinc-500', 
    cssVar: 'zinc'
  },
  {
    name: 'Rose',
    light: 'bg-[#EF88AD]',
    dark: 'bg-[#EF88AD]',
    cssVar: 'rose'
  }
]

export default function setGlobalColorTheme(theme: ThemeColors) {
  const root = document.documentElement
  
  // Remove all existing color theme classes
  availableThemeColors.forEach(color => {
    root.classList.remove(color.cssVar)
  })
  
  // Add the selected color theme class
  const selectedTheme = availableThemeColors.find(color => color.name === theme)
  if (selectedTheme) {
    root.classList.add(selectedTheme.cssVar)
  }
} 