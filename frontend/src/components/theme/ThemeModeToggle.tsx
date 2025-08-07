import { Moon, Sun } from 'lucide-react'
import { useThemeContext } from '../../context/ThemeContext'
import { Button } from '../Button'
import { SliderToggle } from './SliderToggle'

interface ThemeModeToggleProps {
  layout?: 'icon' | 'buttons'
}

export function ThemeModeToggle({ layout = 'icon' }: ThemeModeToggleProps) {
  const { setTheme, theme } = useThemeContext()

  if (layout === 'buttons') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant={theme === 'light' ? 'primary' : 'outline'}
          size="sm"
          radius="md"
          onClick={() => setTheme('light')}
          className="flex items-center justify-center gap-2"
        >
          <Sun className="h-4 w-4" />
          Light
        </Button>
        <Button
          variant={theme === 'dark' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setTheme('dark')}
          className="flex items-center justify-center gap-2"
        >
          <Moon className="h-4 w-4" />
          Dark
        </Button>
      </div>
    )
  }

  return (
    <SliderToggle 
      isDark={theme === 'dark'}
      onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    />
  )
} 