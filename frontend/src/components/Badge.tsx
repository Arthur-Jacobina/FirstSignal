import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className = '' 
}) => {
  const baseClasses = `
    inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold 
    transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] 
    focus:ring-offset-2
  `

  const variantClasses = {
    default: `
      bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] 
      hover:bg-[hsl(var(--primary)/0.8)]
    `,
    secondary: `
      bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] 
      hover:bg-[hsl(var(--secondary)/0.8)]
    `,
    destructive: `
      bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] 
      hover:bg-[hsl(var(--destructive)/0.8)]
    `,
    outline: `
      border border-[hsl(var(--border))] text-[hsl(var(--foreground))]
    `,
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
} 