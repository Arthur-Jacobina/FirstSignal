import { Moon, Sun } from 'lucide-react'

interface SliderToggleProps {
  isDark: boolean
  onToggle: () => void
  className?: string
}

export function SliderToggle({ isDark, onToggle, className = '' }: SliderToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        relative inline-flex h-9 w-16 items-center rounded-full 
        border-2 border-[hsl(var(--border))] bg-[hsl(var(--background))]
        transition-all duration-300 ease-in-out
        hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--accent-foreground)/0.3)]
        focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2
        ${className}
      `}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Track background */}
      <div 
        className={`
          absolute inset-0.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${isDark 
            ? 'bg-gradient-to-r from-slate-700 to-slate-900' 
            : 'bg-gradient-to-r from-amber-200 to-orange-300'
          }
        `}
      />
      
      {/* Slider thumb */}
      <div
        className={`
          relative z-10 flex h-7 w-7 items-center justify-center rounded-full
          bg-[hsl(var(--background))] shadow-lg
          transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform
          ${isDark ? 'translate-x-7' : 'translate-x-0.5'}
        `}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-slate-400" />
        ) : (
          <Sun className="h-4 w-4 text-amber-600" />
        )}
      </div>
      
      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <Sun 
          className={`
            h-3 w-3 transition-opacity duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${isDark ? 'opacity-80 text-amber-300' : 'opacity-0'}
          `} 
        />
        <Moon 
          className={`
            h-3 w-3 transition-opacity duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${isDark ? 'opacity-0' : 'opacity-80 text-slate-600'}
          `} 
        />
      </div>
    </button>
  )
} 