import { createFileRoute } from '@tanstack/react-router'
import { 
    useState, 
    useMemo,
    useEffect 
} from 'react'
import { 
    type BaseError,
    useAccount,
    useWalletClient
} from 'wagmi'
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch"
import { useThemeContext } from '@/context/ThemeContext'
import { 
    CardHeader, 
    CardTitle, 
    CardContent, 
    CardFooter 
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MagicCard } from '@/components/magicui/magic-card'
import { WarpBackground } from '@/components/magicui/warp-background'
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card'
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button'
import { ComicText } from '@/components/magicui/comic-text'
import { SparklesText } from '@/components/magicui/sparkles-text'
import { BorderBeam } from '@/components/magicui/border-beam'
import {  
    normalizeURL 
} from '@/utils'
import { type RegisterFormData, registerSchema } from '@/types'
import { MintOverlay } from '@/components/MintOverlay'
import { FloatingMintButton } from '@/components/FloatingMintButton'

const SERVER_URL = normalizeURL(import.meta.env.VITE_SERVER_URL || 'http://localhost:2053')

export const Route = createFileRoute('/send')({
  component: Send,
})

function Send() {
  const { theme } = useThemeContext()
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [formData, setFormData] = useState<RegisterFormData>({
    message: '',
    telegram: '',
    recipient: ''
  })
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [isMintOverlayOpen, setIsMintOverlayOpen] = useState(false)
  const [paymentResponse, setPaymentResponse] = useState<any>(null)
  
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
    
    // Clear success/error messages when user starts typing again
    if (submitSuccess) {
      setSubmitSuccess(null)
    }
    if (submitError) {
      setSubmitError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSubmitError(null)
    setSubmitSuccess(null)

    const result = registerSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors = result.error
      setErrors(fieldErrors as Partial<Record<keyof RegisterFormData, string>>)
      return
    }

    if (!isConnected || !address || !walletClient) {
      setSubmitError('Please connect your wallet to send the transaction.')
      return
    }

    // Additional validation to ensure address is a valid string
    if (typeof address !== 'string' || address.length !== 42 || !address.startsWith('0x')) {
      setSubmitError('Invalid wallet address. Please reconnect your wallet.')
      return
    }

    try {
      setIsSubmitting(true)

      const requestBody: any = {
        handle: formData.recipient,
        message: formData.message,
      }

      // Add sender_handle if provided
      if (formData.telegram && formData.telegram.trim()) {
        requestBody.sender_handle = formData.telegram
      }
      
      const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient as any)
      
      try {
        const response = await fetchWithPayment(`${SERVER_URL}send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
    
        const xPaymentResponseHeader = response.headers.get("x-payment-response")
        if (xPaymentResponseHeader) {
          const paymentResp = decodeXPaymentResponse(xPaymentResponseHeader)
          setPaymentResponse(paymentResp)
        }

        setSubmitSuccess('Sent successfully!')
        setFormData({ message: '', recipient: '', telegram: '' })
        return
      } catch (paymentError: any) {
        console.error('💳 Payment flow error:', paymentError)
        console.error('Payment error details:', {
          message: paymentError.message,
          x402Version: paymentError.x402Version,
          accepts: paymentError.accepts,
          error: paymentError.error
        })
        
        // TODO: Error enum for cleaner implementation
        if (paymentError.error === 'unexpected_verify_error') {
          setSubmitError('Payment verification failed. Please ensure you have USDC on Base Sepolia and try again.')
          return
        } else if (paymentError.message?.includes('User rejected')) {
          setSubmitError('Payment was cancelled by user.')
          return
        } else if (paymentError.message?.includes('insufficient funds')) {
          setSubmitError('Insufficient USDC funds on Base Sepolia.')
          return
        } else if (paymentError.name === 'TypeError' && paymentError.message === 'Failed to fetch') {
          throw paymentError
        } else {
          throw paymentError
        }
             }
    } catch (err: any) {
      console.error('Send error:', err)
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        response: err.response
      })
      
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setSubmitError('Unable to connect to the server. Please check your internet connection and try again.')
      } else if (err.response?.status === 402) {
        setSubmitError('Payment required. Please ensure your wallet has sufficient USDC on Base Sepolia testnet.')
      } else if (err.message?.includes('User rejected')) {
        setSubmitError('Payment was cancelled. Please try again.')
      } else if (err.message?.includes('insufficient funds')) {
        setSubmitError('Insufficient funds. Please ensure you have enough USDC on Base Sepolia.')
      } else if (err.response?.status >= 400 && err.response?.status < 500) {
        const message = err.response?.data?.error || err.response?.data?.detail || 'Invalid request'
        setSubmitError(message)
      } else if (err.response?.status >= 500) {
        setSubmitError('Server error. Please try again later.')
      } else {
        const message = err.response?.data?.error || err.message || 'Unknown error occurred'
        setSubmitError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isButtonDisabled = isSubmitting || !validation.isValid || 
    !formData.message.trim()
    || !formData.recipient.trim()
    || !isConnected

  const formContent = (
    <div className="max-h-screen min-w-md p-8 flex justify-center items-center flex-row">
      <div className="max-w-2xl min-w-md p-0 space-y-8 w-full md:w-auto h-full">
        {/* Send Signal Card */}
        <NeonGradientCard className="p-0 bg-card min-w-md w-full shadow-none border-1 border-border" neonColors={{
          firstColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))",
          secondColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"
        }} borderSize={1} opacity={0.9}>
          <MagicCard
            gradientColor={theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"}
            className="p-4"
            gradientOpacity={0.2}
            gradientSize={50}
          >
            <CardHeader className="border-b border-border p-4 [.border-b]:pb-4">
              <CardTitle>
                <ComicText fontSize={3} style={{ color: "#ffffff" }}>
                Send a Signal
                </ComicText>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bio">
                      <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                      Message
                      </SparklesText>
                      </Label>
                    <div className="relative rounded-md mt-2">
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
                      <BorderBeam />
                    </div>
                    {errors.message && (
                      <span className="text-sm text-red-500">{errors.message}</span>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="recipient">
                      <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                      Recipient handle
                      </SparklesText>
                    </Label>
                    <Input 
                      id="recipient" 
                      type="text"
                      placeholder="john_doe"
                      value={formData.recipient}
                      onChange={handleInputChange('recipient')}
                      className={errors.recipient ? 'border-red-500 mt-2' : 'mt-2'}
                    />
                    {errors.recipient && (
                      <span className="text-sm text-red-500">{errors.recipient}</span>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">
                      <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                      Your handle (optional)
                      </SparklesText>
                    </Label>
                    <Input 
                      id="telegram" 
                      type="text"
                      placeholder="john_doe"
                      value={formData.telegram}
                      onChange={handleInputChange('telegram')}
                      className={errors.telegram ? 'border-red-500 mt-2' : 'mt-2'}
                    />
                    {errors.telegram && (
                      <span className="text-sm text-red-500">{errors.telegram}</span>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="p-4 justify-center border-t border-border [.border-t]:pt-4">
              <div className="flex flex-col items-center gap-4 w-full">
                <InteractiveHoverButton 
                  className="min-w-[25vw]" 
                  disabled={isButtonDisabled}
                  onClick={handleSubmit}
                  type="submit"
                >
                  <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                    {isSubmitting ? 'Sending...' : 'Send'}
                  </SparklesText>
                </InteractiveHoverButton>
                
                {paymentResponse && (
                  <div className="text-sm text-muted-foreground">
                    Payment: {paymentResponse.amount} {paymentResponse.currency}
                  </div>
                )}
                
                {submitError && (
                  <div className="text-sm text-red-500 text-center">
                    Error: {submitError}
                  </div>
                )}
                
                {submitSuccess && (
                  <div className="text-sm text-green-500 text-center">
                    {submitSuccess}
                  </div>
                )}
              </div>
            </CardFooter>
          </MagicCard>
        </NeonGradientCard>
      </div>
    </div>
  )
  
  return (
    <>
      {/* Desktop with WarpBackground */}
      <div className="hidden md:block">
        <WarpBackground perspective={1000} className="w-full h-full" gridColor={"hsl(var(--secondary))"} beamSize={2} beamsPerSide={2}>
          {formContent}
          <FloatingMintButton onClick={() => setIsMintOverlayOpen(true)} />
        </WarpBackground>
      </div>

      {/* Mobile without WarpBackground */}
      <div className="md:hidden">
        {formContent}
      </div>
      
      {/* Mint Overlay */}
      <MintOverlay 
        isOpen={isMintOverlayOpen} 
        onClose={() => setIsMintOverlayOpen(false)} 
      />
    </>
  )
} 