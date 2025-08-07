import { createFileRoute } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Button } from '../components/Button'
import { useState, useMemo } from 'react'
import { MagicCard } from '../components/magicui/magic-card'
import { useThemeContext } from '../context/ThemeContext'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { z } from 'zod'
import { WarpBackground } from '@/components/magicui/warp-background'

// Zod schema for form validation
const registerSchema = z.object({
  message: z.string().min(2, 'Message must be at least 2 characters'),
  telegram: z.string().optional()
})

type RegisterFormData = z.infer<typeof registerSchema>

export const Route = createFileRoute('/send')({
  component: Send,
})

function Send() {
  const { theme } = useThemeContext()
  const [formData, setFormData] = useState<RegisterFormData>({
    message: '',
    telegram: ''
  })
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})

  const validation = useMemo(() => {
    const result = registerSchema.safeParse(formData)
    return {
      isValid: result.success,
      errors: result.success ? {} : result.error
    }
  }, [formData])

  const handleInputChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const result = registerSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors = result.error
      setErrors(fieldErrors as Partial<Record<keyof RegisterFormData, string>>)
      return
    }
    
    console.log('Form submitted:', formData)
  }

  const isButtonDisabled = !validation.isValid || 
    !formData.message.trim()

  const formContent = (
    <div className="max-h-screen p-8 flex justify-center items-center flex-row">
      <div className="max-w-2xl min-w-sm p-0 space-y-8 w-full md:w-auto h-full">
        <Card className="p-0 max-w-sm w-full shadow-none border-1 border-border">
          <MagicCard
            gradientColor={theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"}
            className="p-0 cursor-pointer"
            gradientOpacity={0.2}
            gradientSize={50}
          >
            <CardHeader className="border-b border-border p-4 [.border-b]:pb-4">
              <CardTitle>Send a Signal</CardTitle>
              <CardDescription>
                Send a signal to someone 🤫
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Message</Label>
                    <textarea 
                      className={`min-h-32 w-full rounded-md border px-3 py-2 text-base resize-none 
                        file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground 
                        bg-transparent dark:bg-card/20 border-border shadow-xs transition-[color,box-shadow,border-color] outline-none 
                        focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
                        aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 
                        disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm
                        ${errors.message ? 'border-red-500 aria-invalid:border-destructive' : ''}`}
                      id="message" 
                      placeholder="What's on your mind?"
                      value={formData.message}
                      onChange={handleInputChange('message')}
                    />
                    {errors.message && (
                      <span className="text-sm text-red-500">{errors.message}</span>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Telegram handle (optional)</Label>
                    <Input 
                      id="telegram" 
                      type="text"
                      placeholder="john_doe"
                      value={formData.telegram}
                      onChange={handleInputChange('telegram')}
                      className={errors.telegram ? 'border-red-500' : ''}
                    />
                    {errors.telegram && (
                      <span className="text-sm text-red-500">{errors.telegram}</span>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="p-4 border-t border-border [.border-t]:pt-4">
              <Button 
                className="w-full" 
                disabled={isButtonDisabled}
                onClick={handleSubmit}
                type="submit"
              >
                Send
              </Button>
            </CardFooter>
          </MagicCard>
        </Card>
      </div>
    </div>
  )
  
  return (
    <>
      {/* Desktop with WarpBackground */}
      <div className="hidden md:block">
        <WarpBackground perspective={400} className="w-full h-full" gridColor={"hsl(var(--secondary))"} beamSize={3}>
          {formContent}
        </WarpBackground>
      </div>

      {/* Mobile without WarpBackground */}
      <div className="md:hidden">
        {formContent}
      </div>
    </>
  )
} 