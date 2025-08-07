import { useThemeContext } from '../../context/ThemeContext'
import { availableThemeColors, type ThemeColors } from '../../lib/themeColors'
import { Button } from '../Button'
import { Badge } from '../Badge'

interface ThemeColorToggleProps {
  variant?: 'select' | 'grid'
}

export function ThemeColorToggle({
  variant = 'grid',
}: ThemeColorToggleProps) {
  const { themeColor, setThemeColor, theme } = useThemeContext()

  if (variant === 'grid') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {availableThemeColors.map(({ name, light, dark }) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              className={`p-0 h-10 w-10 relative border-2 ${
                themeColor === name
                  ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]/20'
                  : 'border-[hsl(var(--border))]'
              }`}
              onClick={() => setThemeColor(name as ThemeColors)}
              title={`${name} theme`}
              aria-label={`Set ${name} theme`}
            >
              <div
                className={`rounded-sm absolute inset-[3px] ${
                  theme === 'light' ? light : dark
                }`}
              />
              {themeColor === name && (
                <svg 
                  className="h-4 w-4 text-white absolute z-10" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  // Simple select variant using buttons
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
          Color Theme:
        </span>
        <Badge variant="outline">{themeColor}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableThemeColors.map(({ name }) => (
          <Button
            key={name}
            variant={themeColor === name ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setThemeColor(name as ThemeColors)}
          >
            {name}
          </Button>
        ))}
      </div>
    </div>
  )
} 