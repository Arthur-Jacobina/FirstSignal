import { useState } from 'react'
import { useThemeContext } from '../../context/ThemeContext'
import { availableThemeColors, type ThemeColors } from '../../lib/themeColors'
import { Button } from '../Button'
import { Card, CardContent, CardHeader, CardTitle } from '../Card'

interface ThemeToggleProps {
  expanded?: boolean
}

export function ThemeToggle({ expanded = false }: ThemeToggleProps) {
  const { setTheme, theme, themeColor, setThemeColor } = useThemeContext()
  const [isOpen, setIsOpen] = useState(false)

  const togglePopover = () => setIsOpen(!isOpen)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className={`p-2 ${expanded ? 'w-full justify-start px-3 py-2' : 'w-10 h-10'}`}
        onClick={togglePopover}
      >
        <svg 
          className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg 
          className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        {expanded && <span className="ml-2">Theme</span>}
        <span className="sr-only">Toggle theme</span>
      </Button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Popover Content */}
          <div className="absolute right-0 top-full mt-2 z-50">
            <Card className="w-56 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Theme Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[hsl(var(--foreground))]">Mode</h4>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={theme === 'light' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('light')}
                      className="flex-1"
                    >
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                      className="flex-1"
                    >
                      Dark
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[hsl(var(--foreground))]">Color</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {availableThemeColors.map(({ name, light, dark }) => (
                      <Button
                        key={name}
                        variant="outline"
                        size="sm"
                        className={`p-0 h-8 w-8 border-2 ${
                          themeColor === name 
                            ? 'border-[hsl(var(--primary))]' 
                            : 'border-[hsl(var(--border))]'
                        }`}
                        onClick={() => setThemeColor(name as ThemeColors)}
                        title={name}
                      >
                        <div
                          className={`rounded-sm w-full h-full ${
                            theme === 'light' ? light : dark
                          }`}
                        />
                        <span className="sr-only">{name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
} 