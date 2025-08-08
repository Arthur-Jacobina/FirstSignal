import { createFileRoute } from '@tanstack/react-router'
import { 
    useState, 
    useMemo,
    useEffect 
} from 'react'
import { 
    type BaseError,
    useAccount, 
    useSendCalls,
    useWaitForCallsStatus,
    useChainId, 
    useSwitchChain 
} from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { parseEther } from 'viem'
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
    fsFetch, 
    normalizeURL 
} from '@/utils'
import { type RegisterFormData, registerSchema } from '@/types'
import { exp1Config } from '@/lib/contracts'
import { MintOverlay } from '@/components/MintOverlay'
import { FloatingMintButton } from '@/components/FloatingMintButton'

const SERVER_URL = normalizeURL(import.meta.env.VITE_SERVER_URL || 'https://f6a60de0ed24.ngrok-free.app')

export const Route = createFileRoute('/')({
  component: Send,
})

function Send() {
  const { theme } = useThemeContext()
  const { isConnected } = useAccount()
  const { data, isPending, sendCalls, error } = useSendCalls()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForCallsStatus({
    id: data?.id,
  })
  const chainId = useChainId()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()
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
  
  const validation = useMemo(() => {
    const result = registerSchema.safeParse(formData)
    return {
      isValid: result.success,
      errors: result.success ? {} : result.error
    }
  }, [formData])

  useEffect(() => {
    const handleTransactionSuccess = async () => {
      if (isConfirmed && data?.id && isSubmitting) {
        try {
          console.log('Transaction confirmed:', data.id)

          const formattedMessage = formData.telegram 
            ? `"${formData.message}"\n-${formData.telegram}`
            : `"${formData.message}"`

          const response = await fsFetch(SERVER_URL, 'send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              handle: formData.recipient,
              message: formattedMessage,
            //   txHash: data.id,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData?.detail || `Request failed with status ${response.status}`
            console.error(errorMessage)
            throw new Error(errorMessage)
          }

          await response.json().catch(() => ({}))
          setSubmitSuccess('Sent successfully!')
          setFormData({ message: '', recipient: '', telegram: '' })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          setSubmitError(message)
        } finally {
          setIsSubmitting(false)
        }
      }
    }

    handleTransactionSuccess()
  }, [isConfirmed, data?.id, isSubmitting, formData.telegram, formData.message, formData.recipient])

  useEffect(() => {
    if (error) {
      const message = (error as BaseError).shortMessage || error.message
      setSubmitError(message)
      setIsSubmitting(false)
    }
  }, [error])

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

    if (!isConnected) {
      setSubmitError('Please connect your wallet to send the transaction.')
      return
    }

    try {
      setIsSubmitting(true)
      // TODO: add checkIfUserExists handle
      if (chainId !== baseSepolia.id) {
        await switchChainAsync({ chainId: baseSepolia.id })
      }

      sendCalls({
        calls: [
          {
            abi: exp1Config.abi,
            args: ['0xb56fD34B90a6ecfADDb1dfAe41E3986fE9041939', parseEther('10')],
            functionName: 'approve',
            to: exp1Config.address,
          },
          {
            abi: exp1Config.abi,
            args: ['0xb56fD34B90a6ecfADDb1dfAe41E3986fE9041939', parseEther('10')],
            functionName: 'transfer',
            to: exp1Config.address,
          },
        ],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setSubmitError(message)
      setIsSubmitting(false)
    }
  }

  const isButtonDisabled = isSubmitting || isPending || isConfirming || !validation.isValid || 
    !formData.message.trim()
    || !formData.recipient.trim()
    || !isConnected
    || isSwitching

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
                    {isPending && isSubmitting ? 'Sending Transaction...' : isConfirming && isSubmitting ? 'Confirming...' : 'Send'}
                  </SparklesText>
                </InteractiveHoverButton>
                
                {data?.id && isSubmitting && (
                  <div className="text-sm text-muted-foreground">
                    Transaction ID: {data.id.slice(0, 10)}...{data.id.slice(-8)}
                  </div>
                )}
                
                {isConfirming && isSubmitting && (
                  <div className="text-sm text-muted-foreground">
                    Waiting for confirmation...
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
      <div className="hidden md:block">
        <WarpBackground perspective={1000} className="w-full h-full" gridColor={"hsl(var(--secondary))"} beamSize={2} beamsPerSide={2}>
          {formContent}
          <FloatingMintButton onClick={() => setIsMintOverlayOpen(true)} />
        </WarpBackground>
      </div>

      <div className="md:hidden">
        {formContent}
      </div>
      
      <MintOverlay 
        isOpen={isMintOverlayOpen} 
        onClose={() => setIsMintOverlayOpen(false)} 
      />
    </>
  )
} 